'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Package, Filter, Search, Edit2, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RequirementModal } from '@/components/requirements/RequirementModal'
import { PRIORITY, REQUIREMENT_STATUS, REQUIREMENT_CATEGORIES, formatDate } from '@/lib/utils'

interface Requirement {
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
  discipline: { id: string; name: string; icon: string; color: string }
  createdBy: { id: string; name: string }
  createdAt: string
}

interface Discipline {
  id: string
  name: string
  icon: string
}

export default function RequerimientosPage() {
  const { data: session } = useSession()
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Requirement | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterDiscipline, setFilterDiscipline] = useState('')

  const loadRequirements = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    fetch('/api/requirements')
      .then((r) => r.json())
      .then(setRequirements)
      .finally(() => { if (!silent) setLoading(false) })
  }, [])

  useEffect(() => {
    loadRequirements()
    fetch('/api/disciplines').then((r) => r.json()).then(setDisciplines)
  }, [loadRequirements])

  useEffect(() => {
    const id = setInterval(() => loadRequirements(true), 30_000)
    return () => clearInterval(id)
  }, [loadRequirements])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este requerimiento?')) return
    await fetch(`/api/requirements/${id}`, { method: 'DELETE' })
    loadRequirements()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/requirements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadRequirements()
  }

  const filtered = requirements.filter((r) => {
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || r.status === filterStatus
    const matchPriority = !filterPriority || r.priority === filterPriority
    const matchDiscipline = !filterDiscipline || r.discipline.id === filterDiscipline
    return matchSearch && matchStatus && matchPriority && matchDiscipline
  })

  const canCreate = true // All roles can create requirements for their discipline
  const isAdmin = session?.user.role === 'ADMIN' || session?.user.role === 'TRABAJADORA'

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Requerimientos</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {session?.user.role === 'COMITE'
              ? `Requerimientos de ${session.user.disciplineName}`
              : 'Solicitudes de implementos, insumos y equipamiento'}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo Requerimiento
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar requerimientos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Todos los estados</option>
              {Object.entries(REQUIREMENT_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Toda prioridad</option>
              {Object.entries(PRIORITY).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {isAdmin && (
              <select
                value={filterDiscipline}
                onChange={(e) => setFilterDiscipline(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Todas las disciplinas</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Object.entries(REQUIREMENT_STATUS).map(([key, val]) => {
          const count = requirements.filter((r) => r.status === key).length
          return (
            <div
              key={key}
              className={`rounded-xl p-4 border cursor-pointer transition-all ${filterStatus === key ? 'ring-2 ring-primary-500' : 'border-gray-100'} ${val.color} bg-opacity-20`}
              onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
            >
              <p className="text-xs font-medium opacity-80">{val.label}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Requirements list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No hay requerimientos</p>
          <p className="text-sm mt-1">Crea el primer requerimiento para tu disciplina</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const priorityInfo = PRIORITY[req.priority as keyof typeof PRIORITY]
            const statusInfo = REQUIREMENT_STATUS[req.status as keyof typeof REQUIREMENT_STATUS]
            const categoryLabel = REQUIREMENT_CATEGORIES.find((c) => c.value === req.category)?.label

            const canEdit = isAdmin ||
              (session?.user.role === 'COMITE' && req.discipline.id === session.user.disciplineId)

            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: req.discipline.color + '20' }}
                      >
                        {req.discipline.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{req.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{req.discipline.name}</span>
                          {categoryLabel && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="text-xs text-gray-500">{categoryLabel}</span>
                            </>
                          )}
                          {req.quantity && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="text-xs text-gray-500">{req.quantity} {req.unit || 'unidades'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={priorityInfo?.color}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo?.dot}`} />
                        {priorityInfo?.label}
                      </Badge>
                      {canEdit ? (
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer ${statusInfo?.color}`}
                        >
                          {Object.entries(REQUIREMENT_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                      )}
                    </div>
                  </div>

                  {req.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{req.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {req.estimatedDate && (
                        <span>📅 Fecha estimada: {formatDate(req.estimatedDate)}</span>
                      )}
                      <span>Por: {req.createdBy.name}</span>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditTarget(req)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <RequirementModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => { setCreateOpen(false); loadRequirements() }}
        />
      )}
      {editTarget && (
        <RequirementModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); loadRequirements() }}
          requirement={editTarget}
        />
      )}
    </div>
  )
}
