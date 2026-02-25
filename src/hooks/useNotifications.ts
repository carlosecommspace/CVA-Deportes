'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { dispatchToast } from '@/components/ui/Toaster'

const POLL_MS = 30_000
const STORAGE_KEY = 'cva_notif_seen'

const NOTIFIED_ROLES = ['ADMIN', 'TRABAJADORA', 'SOCIALES']

function loadSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function persistSeen(ids: Set<string>) {
  try {
    // Keep last 500 IDs to avoid localStorage bloat
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(-500)))
  } catch {}
}

export function useNotifications() {
  const { data: session } = useSession()
  const seenRef = useRef<Set<string>>(new Set())
  const initialized = useRef(false)
  const [unread, setUnread] = useState(0)

  // Load persisted seen IDs on mount
  useEffect(() => {
    seenRef.current = loadSeen()
  }, [])

  useEffect(() => {
    if (!session) return
    const role = session.user.role
    if (!NOTIFIED_ROLES.includes(role)) return

    // Request browser notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const endpoints: Array<{ url: string; type: 'event' | 'task' | 'requirement' }> = [
      { url: '/api/events', type: 'event' },
      { url: '/api/tasks', type: 'task' },
    ]
    // SOCIALES doesn't have access to requirements
    if (role !== 'SOCIALES') {
      endpoints.push({ url: '/api/requirements', type: 'requirement' })
    }

    async function poll() {
      const isFirst = !initialized.current
      let newCount = 0

      for (const { url, type } of endpoints) {
        try {
          const res = await fetch(url)
          if (!res.ok) continue
          const data: Array<{ id: string; title: string }> = await res.json()
          if (!Array.isArray(data)) continue

          if (!isFirst) {
            for (const item of data) {
              if (!seenRef.current.has(item.id)) {
                // In-app toast
                dispatchToast({ type, message: item.title })

                // Browser notification
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                  const titles = {
                    event: 'Nuevo evento',
                    task: 'Nueva tarea',
                    requirement: 'Nuevo requerimiento',
                  }
                  new Notification(titles[type], {
                    body: item.title,
                    icon: '/favicon.ico',
                  })
                }

                newCount++
              }
            }
          }

          // Mark all current items as seen
          data.forEach((item) => seenRef.current.add(item.id))
        } catch {
          // Ignore fetch errors during background polling
        }
      }

      persistSeen(seenRef.current)
      if (!isFirst && newCount > 0) setUnread((n) => n + newCount)
      if (isFirst) initialized.current = true
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => {
      clearInterval(id)
      initialized.current = false
    }
  }, [session])

  return {
    unread,
    clearUnread: () => setUnread(0),
  }
}
