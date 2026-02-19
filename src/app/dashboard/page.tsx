'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, Package, TrendingUp, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { formatDate, EVENT_STATUS } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
  totalEvents: number
  eventsThisMonth: number
  totalRequirements: number
  pendingRequirements: number
  highPriorityReqs: number
  upcomingEvents: Array<{
    id: string
    title: string
    date: string
    status: string
    discipline: { name: string; color: string; icon: string }
  }>
  eventsByStatus: Array<{ status: string; _count: number }>
  requirementsByPriority: Array<{ priority: string; _count: number }>
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {session?.user.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {session?.user.role === 'COMITE'
            ? `Panel del comité de ${session.user.disciplineName}`
            : 'Panel de control — CVA Secretaría de Deportes'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Calendar}
              label="Total Eventos"
              value={data.totalEvents}
              sub={`${data.eventsThisMonth} este mes`}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon={CheckCircle2}
              label="Eventos este mes"
              value={data.eventsThisMonth}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              icon={Package}
              label="Requerimientos"
              value={data.totalRequirements}
              sub={`${data.pendingRequirements} pendientes`}
              color="bg-orange-50 text-orange-600"
            />
            <StatCard
              icon={AlertTriangle}
              label="Alta Prioridad"
              value={data.highPriorityReqs}
              sub="Requerimientos urgentes"
              color="bg-red-50 text-red-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming events */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Próximos Eventos</h2>
                </div>
                <Link href="/calendario" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Ver todos
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {data.upcomingEvents.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No hay eventos próximos</div>
                ) : (
                  data.upcomingEvents.map((event) => {
                    const statusInfo = EVENT_STATUS[event.status as keyof typeof EVENT_STATUS]
                    return (
                      <div key={event.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: event.discipline.color + '20' }}
                        >
                          {event.discipline.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{event.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {event.discipline.name} · {formatDate(event.date)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${statusInfo?.color}`}>
                          {statusInfo?.label}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Summary charts */}
            <div className="space-y-4">
              {/* Events by status */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Eventos por Estado</h2>
                </div>
                <div className="space-y-3">
                  {data.eventsByStatus.map((item) => {
                    const info = EVENT_STATUS[item.status as keyof typeof EVENT_STATUS]
                    const pct = data.totalEvents > 0 ? Math.round((item._count / data.totalEvents) * 100) : 0
                    return (
                      <div key={item.status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{info?.label || item.status}</span>
                          <span className="font-medium text-gray-900">{item._count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${info?.dot || 'bg-gray-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Requirements by priority */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Requerimientos Activos</h2>
                </div>
                <div className="space-y-3">
                  {data.requirementsByPriority.length === 0 ? (
                    <p className="text-sm text-gray-400">No hay requerimientos activos</p>
                  ) : (
                    data.requirementsByPriority.map((item) => {
                      const colors: Record<string, string> = {
                        ALTA: 'bg-red-500',
                        MEDIA: 'bg-yellow-500',
                        BAJA: 'bg-green-500',
                      }
                      const labels: Record<string, string> = { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' }
                      const total = data.requirementsByPriority.reduce((s, r) => s + r._count, 0)
                      const pct = total > 0 ? Math.round((item._count / total) * 100) : 0
                      return (
                        <div key={item.priority}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Prioridad {labels[item.priority]}</span>
                            <span className="font-medium text-gray-900">{item._count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colors[item.priority] || 'bg-gray-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
