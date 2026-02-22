'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { PRIORITY, TASK_STATUS, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Edit2, Trash2, Calendar, User, GripVertical } from 'lucide-react'
import { TaskModal } from './TaskModal'
import type { Session } from 'next-auth'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  department: string
  dueDate?: string
  order: number
  createdBy: { id: string; name: string }
  assignedTo?: { id: string; name: string }
}

const COLUMNS: Array<{ key: string; label: string; color: string; bg: string }> = [
  { key: 'POR_HACER', label: 'Por Hacer', color: 'text-gray-600', bg: 'bg-gray-100' },
  { key: 'EN_PROGRESO', label: 'En Progreso', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'PARA_REVISAR', label: 'Para Revisar', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { key: 'COMPLETADA', label: 'Completada', color: 'text-green-600', bg: 'bg-green-50' },
]

interface KanbanBoardProps {
  tasks: Task[]
  onUpdate: () => void
  session: Session | null
}

export function KanbanBoard({ tasks, onUpdate, session }: KanbanBoardProps) {
  const [editTask, setEditTask] = useState<Task | null>(null)

  const getColumnTasks = (status: string) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order)

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newStatus = destination.droppableId

    await fetch(`/api/tasks/${draggableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, order: destination.index }),
    })
    onUpdate()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    onUpdate()
  }

  const role = session?.user.role
  const canManageTask = (task: Task) =>
    role === 'ADMIN' || (role === 'SOCIALES' && task.department === 'SOCIALES')
  const isPastDue = (dueDate?: string) => dueDate && new Date(dueDate) < new Date()

  const DEPT_BADGE: Record<string, { label: string; color: string }> = {
    DEPORTES: { label: 'Deportes', color: 'bg-blue-100 text-blue-700' },
    SOCIALES: { label: 'Sociales', color: 'bg-purple-100 text-purple-700' },
  }

  return (
    <div className="flex-1 overflow-x-auto -mx-6 lg:-mx-8 px-6 lg:px-8 pb-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 min-w-max pb-4">
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col.key)
            return (
              <div key={col.key} className="w-72 flex flex-col">
                {/* Column header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${col.bg} mb-3`}>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-sm ${col.color}`}>{col.label}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-white font-medium ${col.color}`}>
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Droppable */}
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-xl min-h-32 p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary-50 border-2 border-dashed border-primary-300' : 'bg-gray-50/50'
                      }`}
                    >
                      <div className="space-y-2">
                        {columnTasks.map((task, index) => {
                          const priorityInfo = PRIORITY[task.priority as keyof typeof PRIORITY]
                          const pastDue = isPastDue(task.dueDate)

                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`bg-white rounded-xl border shadow-sm p-3 transition-shadow ${
                                    snapshot.isDragging
                                      ? 'shadow-lg border-primary-200 rotate-1'
                                      : 'border-gray-100 hover:shadow-md'
                                  }`}
                                >
                                  {/* Drag handle + actions */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="flex gap-1">
                                      {canManageTask(task) && (
                                        <>
                                          <button
                                            onClick={() => setEditTask(task)}
                                            className="p-1 text-gray-300 hover:text-primary-600 rounded transition-colors"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDelete(task.id)}
                                            className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Title */}
                                  <p className="text-sm font-medium text-gray-900 leading-snug">
                                    {task.title}
                                  </p>

                                  {/* Description */}
                                  {task.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                                  )}

                                  {/* Meta */}
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    <Badge className={priorityInfo?.color}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo?.dot}`} />
                                      {priorityInfo?.label}
                                    </Badge>
                                    {(() => {
                                      const dept = DEPT_BADGE[task.department] ?? DEPT_BADGE.DEPORTES
                                      return (
                                        <Badge className={dept.color}>
                                          {dept.label}
                                        </Badge>
                                      )
                                    })()}
                                  </div>

                                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                    {task.assignedTo && (
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span className="truncate max-w-24">{task.assignedTo.name}</span>
                                      </div>
                                    )}
                                    {task.dueDate && (
                                      <div className={`flex items-center gap-1 ${pastDue ? 'text-red-500' : ''}`}>
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatDate(task.dueDate)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                      </div>
                      {provided.placeholder}

                      {columnTasks.length === 0 && (
                        <div className="flex items-center justify-center h-16 text-xs text-gray-300">
                          Arrastra tareas aquí
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {editTask && (
        <TaskModal
          open={!!editTask}
          onClose={() => setEditTask(null)}
          onSuccess={() => { setEditTask(null); onUpdate() }}
          task={editTask}
        />
      )}
    </div>
  )
}
