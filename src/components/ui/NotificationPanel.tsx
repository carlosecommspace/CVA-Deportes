'use client'

import Link from 'next/link'
import { Calendar, Package, KanbanSquare, Bell, X, Check } from 'lucide-react'
import type { NotificationItem } from '@/hooks/useNotifications'

const TYPE_META: Record<
  NotificationItem['type'],
  { label: string; href: string; Icon: React.FC<{ className?: string }>; color: string }
> = {
  event: {
    label: 'Nuevo evento',
    href: '/calendario',
    Icon: Calendar,
    color: 'bg-blue-50 text-blue-600',
  },
  task: {
    label: 'Nueva tarea',
    href: '/tareas',
    Icon: KanbanSquare,
    color: 'bg-purple-50 text-purple-600',
  },
  requirement: {
    label: 'Nuevo requerimiento',
    href: '/requerimientos',
    Icon: Package,
    color: 'bg-amber-50 text-amber-600',
  },
}

interface NotificationPanelProps {
  items: NotificationItem[]
  onClose: () => void
}

export function NotificationPanel({ items, onClose }: NotificationPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={[
          'fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100',
          // Desktop: to the right of the sidebar (w-64 = 256px)
          'lg:left-[272px] lg:top-[72px] lg:w-80',
          // Mobile: floating centered card
          'max-lg:left-4 max-lg:right-4 max-lg:top-16 max-lg:w-auto',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-600" />
            <span className="font-semibold text-sm text-gray-900">Notificaciones</span>
            {items.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[360px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Check className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">Todo al día</p>
              <p className="text-xs text-gray-400 mt-1">No hay notificaciones nuevas</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {items.map((item) => {
                const { label, href, Icon, color } = TYPE_META[item.type]
                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-gray-800 font-medium leading-snug mt-0.5 line-clamp-2 group-hover:text-primary-700 transition-colors">
                          {item.title}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Marcar todo como leído
            </button>
            <div className="flex gap-3">
              {Array.from(new Set(items.map((i) => i.type))).map((type) => {
                const { label: _label, href, Icon } = TYPE_META[type]
                const count = items.filter((i) => i.type === type).length
                return (
                  <Link
                    key={type}
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
                  >
                    <Icon className="w-3 h-3" />
                    Ver {count}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
