'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { formatDateTimeLocal } from '@/lib/utils'

interface Discipline {
  id: string
  name: string
  icon: string
}

interface EventModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  defaultDate?: Date | null
}

export function EventModal({ open, onClose, onSuccess, defaultDate }: EventModalProps) {
  const { data: session } = useSession()
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: defaultDate ? formatDateTimeLocal(defaultDate) : '',
    endDate: '',
    disciplineId: '',
  })

  useEffect(() => {
    fetch('/api/disciplines')
      .then((r) => r.json())
      .then((data: Discipline[]) => {
        if (session?.user.role === 'SOCIALES') {
          const social = data.find((d) => d.name === 'Actividad Social')
          const filtered = social ? [social] : []
          setDisciplines(filtered)
          if (social) setForm((f) => ({ ...f, disciplineId: social.id }))
        } else {
          setDisciplines(data)
          if (session?.user.role === 'COMITE' && session.user.disciplineId) {
            setForm((f) => ({ ...f, disciplineId: session.user.disciplineId! }))
          } else if (data.length > 0) {
            setForm((f) => ({ ...f, disciplineId: f.disciplineId || data[0].id }))
          }
        }
      })
  }, [session])

  useEffect(() => {
    if (defaultDate) {
      setForm((f) => ({ ...f, date: formatDateTimeLocal(defaultDate) }))
    }
  }, [defaultDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Error al crear el evento')
        return
      }
      onSuccess()
      onClose()
      setForm({ title: '', description: '', location: '', date: '', endDate: '', disciplineId: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Evento" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título del evento *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ej: Torneo mensual de tenis"
          required
        />

        <Textarea
          label="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción del evento..."
          rows={3}
        />

        <Input
          label="Lugar / Ubicación"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Ej: Canchas de tenis CVA"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fecha y hora de inicio *"
            type="datetime-local"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Input
            label="Fecha y hora de fin"
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>

        <Select
          label="Disciplina *"
          value={form.disciplineId}
          onChange={(e) => setForm({ ...form, disciplineId: e.target.value })}
          disabled={session?.user.role === 'COMITE' || session?.user.role === 'SOCIALES'}
          required
        >
          <option value="">Selecciona una disciplina</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.icon} {d.name}
            </option>
          ))}
        </Select>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Crear Evento
          </Button>
        </div>
      </form>
    </Modal>
  )
}
