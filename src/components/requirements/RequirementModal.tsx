'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { REQUIREMENT_CATEGORIES, formatDateInput } from '@/lib/utils'

interface Discipline {
  id: string
  name: string
  icon: string
}

interface RequirementData {
  id: string
  title: string
  description?: string
  category?: string
  priority: string
  estimatedDate?: string
  quantity?: number
  unit?: string
  status: string
  notes?: string
  discipline: { id: string }
}

interface RequirementModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  requirement?: RequirementData
}

export function RequirementModal({ open, onClose, onSuccess, requirement }: RequirementModalProps) {
  const { data: session } = useSession()
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: requirement?.title || '',
    description: requirement?.description || '',
    category: requirement?.category || '',
    priority: requirement?.priority || 'MEDIA',
    estimatedDate: requirement?.estimatedDate ? formatDateInput(requirement.estimatedDate) : '',
    quantity: requirement?.quantity?.toString() || '',
    unit: requirement?.unit || '',
    disciplineId: requirement?.discipline.id || '',
    notes: requirement?.notes || '',
  })

  useEffect(() => {
    fetch('/api/disciplines')
      .then((r) => r.json())
      .then((data: Discipline[]) => {
        setDisciplines(data)
        if (session?.user.role === 'COMITE' && session.user.disciplineId && !requirement) {
          setForm((f) => ({ ...f, disciplineId: session.user.disciplineId! }))
        } else if (!requirement && data.length > 0 && !form.disciplineId) {
          setForm((f) => ({ ...f, disciplineId: data[0].id }))
        }
      })
  }, [session, requirement])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = requirement ? `/api/requirements/${requirement.id}` : '/api/requirements'
      const method = requirement ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Error al guardar')
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const isEdit = !!requirement

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Requerimiento' : 'Nuevo Requerimiento'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título del requerimiento *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ej: Pelotas de tenis"
          required
        />

        <Textarea
          label="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe el requerimiento en detalle..."
          rows={2}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Categoría"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Sin categoría</option>
            {REQUIREMENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>

          <Select
            label="Prioridad *"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            required
          >
            <option value="ALTA">🔴 Alta</option>
            <option value="MEDIA">🟡 Media</option>
            <option value="BAJA">🟢 Baja</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Cantidad"
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Ej: 10"
            min="1"
          />
          <Input
            label="Unidad"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="Ej: pares, latas"
          />
          <Input
            label="Fecha estimada de adquisición"
            type="date"
            value={form.estimatedDate}
            onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })}
          />
        </div>

        <Select
          label="Disciplina *"
          value={form.disciplineId}
          onChange={(e) => setForm({ ...form, disciplineId: e.target.value })}
          disabled={session?.user.role === 'COMITE'}
          required
        >
          <option value="">Selecciona una disciplina</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
          ))}
        </Select>

        <Textarea
          label="Notas adicionales"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Observaciones, referencias, etc."
          rows={2}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? 'Guardar Cambios' : 'Crear Requerimiento'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
