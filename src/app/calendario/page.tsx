'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EventModal } from '@/components/events/EventModal'
import { EventDetailModal } from '@/components/events/EventDetailModal'

const locales = { es }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    status: string
    discipline: { name: string; color: string; icon: string }
    description?: string
    location?: string
  }
}

interface RawEvent {
  id: string
  title: string
  date: string
  endDate?: string
  status: string
  description?: string
  location?: string
  discipline: { name: string; color: string; icon: string }
}

const messages = {
  allDay: 'Todo el día',
  previous: '← Anterior',
  next: 'Siguiente →',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este período',
}

export default function CalendarioPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null)

  const loadEvents = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    fetch('/api/events')
      .then((r) => r.json())
      .then((data: RawEvent[]) => {
        setEvents(
          data.map((e) => ({
            id: e.id,
            title: `${e.discipline.icon} ${e.title}`,
            start: new Date(e.date),
            end: e.endDate ? new Date(e.endDate) : new Date(e.date),
            resource: {
              status: e.status,
              discipline: e.discipline,
              description: e.description,
              location: e.location,
            },
          })),
        )
      })
      .finally(() => { if (!silent) setLoading(false) })
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    const id = setInterval(() => loadEvents(true), 30_000)
    return () => clearInterval(id)
  }, [loadEvents])

  const eventStyleGetter = (event: CalendarEvent) => {
    const statusColors: Record<string, string> = {
      PLANIFICADO: '#0073c6',
      EN_PROGRESO: '#d97706',
      COMPLETADO: '#16a34a',
      CANCELADO: '#dc2626',
      POSTERGADO: '#6b7280',
    }
    const color = statusColors[event.resource.status] || '#0073c6'
    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontSize: '0.75rem',
        padding: '2px 6px',
      },
    }
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedSlotDate(start)
    setCreateOpen(true)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEventId(event.id)
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8 h-screen flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Calendario de Eventos</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {session?.user.role === 'COMITE'
              ? `Eventos de ${session.user.disciplineName}`
              : 'Planificación mensual de todas las disciplinas'}
          </p>
        </div>

        <Button onClick={() => { setSelectedSlotDate(new Date()); setCreateOpen(true) }}>
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { label: 'Planificado', color: '#0073c6' },
          { label: 'En Progreso', color: '#d97706' },
          { label: 'Completado', color: '#16a34a' },
          { label: 'Cancelado', color: '#dc2626' },
          { label: 'Postergado', color: '#6b7280' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', minHeight: 500 }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            messages={messages}
            culture="es"
            popup
          />
        )}
      </div>

      {/* Modals */}
      {createOpen && (
        <EventModal
          open={createOpen}
          onClose={() => { setCreateOpen(false); setSelectedSlotDate(null) }}
          onSuccess={loadEvents}
          defaultDate={selectedSlotDate}
        />
      )}

      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onUpdate={loadEvents}
        />
      )}
    </div>
  )
}
