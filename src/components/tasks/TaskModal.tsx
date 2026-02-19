'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { formatDateInput } from '@/lib/utils'

interface TaskData {
  id: string
  title: string
  description?: string
  priority: string
  dueDate?: string
  assignedTo?: { id: string; name: string }
}

interface Worker {
  id: string
  name: string
}

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  task?: TaskData
}

export function TaskModal({ open, onClose, onSuccess, task }: TaskModalProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'MEDIA',
    dueDate: task?.dueDate ? formatDateInput(task.dueDate) : '',
    assignedToId: task?.assignedTo?.id || '',
  })

  useEffect(() => {
    // Get trabajadora users to assign tasks
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((tasks: Array<{ assignedTo?: { id: string; name: string } }>) => {
        const found = tasks
          .filter((t) => t.assignedTo)
          .map((t) => t.assignedTo!)
        const unique = Array.from(new Map(found.map((u) => [u.id, u])).values())
        setWorkers(unique)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks'
      const method = task ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Error')
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Editar Tarea' : 'Nueva Tarea'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Describe la tarea..."
          required
        />

        <Textarea
          label="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Detalles adicionales..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Prioridad"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="ALTA">🔴 Alta</option>
            <option value="MEDIA">🟡 Media</option>
            <option value="BAJA">🟢 Baja</option>
          </Select>

          <Input
            label="Fecha límite"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {task ? 'Guardar' : 'Crear Tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
