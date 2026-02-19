'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { KanbanSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { TaskModal } from '@/components/tasks/TaskModal'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  order: number
  createdBy: { id: string; name: string }
  assignedTo?: { id: string; name: string }
}

export default function TareasPage() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  if (status === 'authenticated' && session?.user.role === 'COMITE') {
    redirect('/dashboard')
  }

  const loadTasks = useCallback(() => {
    setLoading(true)
    fetch('/api/tasks')
      .then((r) => r.json())
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (session) loadTasks()
  }, [session, loadTasks])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8 h-screen flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Gestión de tareas — Panel de {session?.user.role === 'ADMIN' ? 'administración' : 'trabajo'}
          </p>
        </div>
        {session?.user.role === 'ADMIN' && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </Button>
        )}
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <KanbanBoard tasks={tasks} onUpdate={loadTasks} session={session} />
      )}

      {/* Modal */}
      {createOpen && (
        <TaskModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => { setCreateOpen(false); loadTasks() }}
        />
      )}
    </div>
  )
}
