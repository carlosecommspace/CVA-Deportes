'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  MapPin, Clock, CheckSquare, Square, MessageCircle,
  Plus, Trash2, User, Pencil, X
} from 'lucide-react'
import { EVENT_STATUS, formatDateTime, formatDate, formatDateTimeLocal } from '@/lib/utils'

interface ChecklistItem {
  id: string
  item: string
  completed: boolean
  completedAt?: string
  completedBy?: { id: string; name: string }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string }
}

interface EventDetail {
  id: string
  title: string
  description?: string
  location?: string
  date: string
  endDate?: string
  status: string
  discipline: { name: string; color: string; icon: string }
  createdBy: { id: string; name: string; email: string }
  comments: Comment[]
  checklist: ChecklistItem[]
}

interface EventDetailModalProps {
  eventId: string
  onClose: () => void
  onUpdate: () => void
}

type Tab = 'info' | 'checklist' | 'comments'

export function EventDetailModal({ eventId, onClose, onUpdate }: EventDetailModalProps) {
  const { data: session } = useSession()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('info')
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [newCheckItem, setNewCheckItem] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', date: '', endDate: '', location: '', description: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  const loadEvent = () => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then(setEvent)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadEvent() }, [eventId])

  const handleStatusChange = async (status: string) => {
    setSavingStatus(true)
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSavingStatus(false)
    loadEvent()
    onUpdate()
  }

  const handleCheckItem = async (itemId: string, completed: boolean) => {
    await fetch(`/api/events/${eventId}/checklist/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    loadEvent()
  }

  const handleAddCheckItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCheckItem.trim()) return
    await fetch(`/api/events/${eventId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: newCheckItem }),
    })
    setNewCheckItem('')
    loadEvent()
  }

  const handleDeleteCheckItem = async (itemId: string) => {
    await fetch(`/api/events/${eventId}/checklist/${itemId}`, { method: 'DELETE' })
    loadEvent()
  }

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSendingComment(true)
    await fetch(`/api/events/${eventId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    })
    setNewComment('')
    setSendingComment(false)
    loadEvent()
  }

  const handleStartEdit = () => {
    setEditForm({
      title: event!.title,
      date: formatDateTimeLocal(event!.date),
      endDate: event!.endDate ? formatDateTimeLocal(event!.endDate) : '',
      location: event!.location || '',
      description: event!.description || '',
    })
    setEditing(true)
    setTab('info')
  }

  const handleSaveEdit = async () => {
    setSavingEdit(true)
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setSavingEdit(false)
    setEditing(false)
    loadEvent()
    onUpdate()
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.')) return
    await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
    onUpdate()
    onClose()
  }

  const canDelete = session?.user.role === 'ADMIN' || session?.user.role === 'TRABAJADORA'

  const canEditEvent = session?.user.role === 'ADMIN' || session?.user.role === 'TRABAJADORA' ||
    (session?.user.role === 'COMITE' && event?.discipline.name === session.user.disciplineName)

  const canManageChecklist = session?.user.role === 'ADMIN' || session?.user.role === 'TRABAJADORA'

  if (loading || !event) {
    return (
      <Modal open onClose={onClose} size="xl">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </Modal>
    )
  }

  const statusInfo = EVENT_STATUS[event.status as keyof typeof EVENT_STATUS]
  const checklistDone = event.checklist.filter((i) => i.completed).length

  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: 'info', label: 'Información' },
    { key: 'checklist', label: 'Checklist', count: event.checklist.length },
    { key: 'comments', label: 'Comentarios', count: event.comments.length },
  ]

  return (
    <Modal open onClose={onClose} size="xl" title="">
      {/* Custom header */}
      <div className="-mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-gray-100 mb-4" style={{ backgroundColor: event.discipline.color + '10' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{event.discipline.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{event.discipline.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canEditEvent && !editing ? (
              <Select
                value={event.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs py-1"
              >
                {Object.entries(EVENT_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Select>
            ) : !editing ? (
              <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
            ) : null}
            {canDelete && !editing && (
              <>
                <button
                  onClick={handleStartEdit}
                  title="Editar evento"
                  className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-white/60 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  title="Eliminar evento"
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white/60 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            {editing && (
              <button
                onClick={() => setEditing(false)}
                title="Cancelar edición"
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{formatDateTime(event.date)}</span>
            {event.endDate && <span>— {formatDateTime(event.endDate)}</span>}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>Creado por {event.createdBy.name}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 -mx-6 px-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 pt-1 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'info' && !editing && (
        <div className="space-y-4">
          {event.description && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Descripción</p>
              <p className="text-gray-800 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Checklist</p>
              <p className="text-2xl font-bold text-gray-900">{checklistDone}/{event.checklist.length}</p>
              <p className="text-xs text-gray-500">ítems completados</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Actividad</p>
              <p className="text-2xl font-bold text-gray-900">{event.comments.length}</p>
              <p className="text-xs text-gray-500">comentarios</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'info' && editing && (
        <div className="space-y-4">
          <Input
            label="Título *"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha y hora de inicio *"
              type="datetime-local"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />
            <Input
              label="Fecha y hora de fin"
              type="datetime-local"
              value={editForm.endDate}
              onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
            />
          </div>
          <Input
            label="Lugar / Ubicación"
            value={editForm.location}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
          />
          <Textarea
            label="Descripción"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={3}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} loading={savingEdit} className="flex-1">
              Guardar cambios
            </Button>
          </div>
        </div>
      )}

      {tab === 'checklist' && (
        <div className="space-y-3">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: event.checklist.length > 0 ? `${(checklistDone / event.checklist.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">{checklistDone}/{event.checklist.length}</span>
          </div>

          {event.checklist.map((item) => (
            <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${item.completed ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
              <button
                onClick={() => handleCheckItem(item.id, !item.completed)}
                className="mt-0.5 flex-shrink-0"
              >
                {item.completed ? (
                  <CheckSquare className="w-5 h-5 text-green-500" />
                ) : (
                  <Square className="w-5 h-5 text-gray-300" />
                )}
              </button>
              <div className="flex-1">
                <p className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {item.item}
                </p>
                {item.completed && item.completedBy && (
                  <p className="text-xs text-green-600 mt-0.5">
                    ✓ Completado por {item.completedBy.name} — {item.completedAt ? formatDate(item.completedAt) : ''}
                  </p>
                )}
              </div>
              {canManageChecklist && (
                <button
                  onClick={() => handleDeleteCheckItem(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* Add item */}
          <form onSubmit={handleAddCheckItem} className="flex gap-2 mt-4">
            <input
              type="text"
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              placeholder="Agregar ítem al checklist..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      {tab === 'comments' && (
        <div className="space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {event.comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No hay comentarios aún
              </div>
            ) : (
              event.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 text-primary-600 text-sm font-semibold">
                    {c.user.name[0]}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{c.user.name}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendComment} className="mt-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <Button type="submit" loading={sendingComment} size="sm">
                Enviar
              </Button>
            </div>
          </form>
        </div>
      )}

    </Modal>
  )
}
