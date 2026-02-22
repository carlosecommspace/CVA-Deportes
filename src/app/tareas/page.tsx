'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { KanbanSquare, Plus, Archive, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { TaskModal } from '@/components/tasks/TaskModal'
import { Badge } from '@/components/ui/Badge'
import { PRIORITY, formatDate } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  department: string
  dueDate?: string
  archivedAt?: string
  order: number
  createdBy: { id: string; name: string }
  assignedTo?: { id: string; name: string }
}

const DEPT_BADGE: Record<string, { label: string; color: string }> = {
  DEPORTES: { label: 'Deportes', color: 'bg-blue-100 text-blue-700' },
  SOCIALES: { label: 'Sociales', color: 'bg-purple-100 text-purple-700' },
}

export default function TareasPage() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [showArchive, setShowArchive] = useState(false)

  if (status === 'authenticated' && session?.user.role === 'COMITE') {
    redirect('/dashboard')
  }

  const loadTasks = useCallback((archived = false) => {
    setLoading(true)
    fetch(`/api/tasks${archived ? '?archived=true' : ''}`)
      .then((r) => r.json())
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (session) loadTasks(showArchive)
  }, [session, loadTasks, showArchive])

  const handleUnarchive = async (id: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: false }),
    })
    loadTasks(true)
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const isAdmin = session?.user.role === 'ADMIN'

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8 h-screen flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
            {showArchive && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Archivo
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {showArchive
              ? 'Tareas archivadas — solo visibles para administración'
              : `Gestión de tareas — Panel de ${isAdmin ? 'Deportes' : session?.user.role === 'SOCIALES' ? 'Sociales' : 'trabajo'}`}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowArchive((v) => !v)}
            >
              <Archive className="w-4 h-4" />
              {showArchive ? 'Ver tablero' : 'Archivo'}
            </Button>
          )}
          {!showArchive && (session?.user.role === 'ADMIN' || session?.user.role === 'SOCIALES') && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Nueva Tarea
            </Button>
          )}
        </div>
      </div>

      {/* Board / Archive */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : showArchive ? (
        <div className="flex-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
              <Archive className="w-10 h-10" />
              <p className="text-sm">No hay tareas archivadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {tasks.map((task) => {
                const priorityInfo = PRIORITY[task.priority as keyof typeof PRIORITY]
                const dept = DEPT_BADGE[task.department] ?? DEPT_BADGE.DEPORTES
                return (
                  <div
                    key={task.id}
                    className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <p className="text-sm font-medium text-gray-700 leading-snug mb-1">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge className={priorityInfo?.color}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo?.dot}`} />
                        {priorityInfo?.label}
                      </Badge>
                      <Badge className={dept.color}>{dept.label}</Badge>
                    </div>
                    {task.archivedAt && (
                      <p className="text-xs text-gray-400 mb-3">
                        Archivada el {formatDate(task.archivedAt)}
                      </p>
                    )}
                    <button
                      onClick={() => handleUnarchive(task.id)}
                      className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restaurar al tablero
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <KanbanBoard tasks={tasks} onUpdate={() => loadTasks(false)} session={session} />
      )}

      {/* Modal */}
      {createOpen && (
        <TaskModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => { setCreateOpen(false); loadTasks(false) }}
        />
      )}
    </div>
  )
}
