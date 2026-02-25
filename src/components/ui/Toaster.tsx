'use client'

import { useEffect, useState } from 'react'
import { Calendar, Package, KanbanSquare } from 'lucide-react'

export type ToastItem = {
  id: string
  type: 'event' | 'task' | 'requirement'
  message: string
}

type Listener = (toast: ToastItem) => void
const listeners = new Set<Listener>()

export function dispatchToast(toast: Omit<ToastItem, 'id'>) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
  listeners.forEach((l) => l({ ...toast, id }))
}

const ICONS = {
  event: Calendar,
  task: KanbanSquare,
  requirement: Package,
}

const LABELS = {
  event: 'Nuevo evento',
  task: 'Nueva tarea',
  requirement: 'Nuevo requerimiento',
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener: Listener = (toast) => {
      setToasts((prev) => [...prev.slice(-3), toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 6000)
    }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72 pointer-events-none">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className="flex items-start gap-3 bg-white border border-gray-200 shadow-xl rounded-xl px-4 py-3 pointer-events-auto"
          >
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-400">{LABELS[t.type]}</p>
              <p className="text-sm font-semibold text-gray-900 leading-snug mt-0.5 line-clamp-2">{t.message}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
