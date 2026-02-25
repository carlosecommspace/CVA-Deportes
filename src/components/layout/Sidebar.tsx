'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Calendar,
  Package,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'
import { Toaster } from '@/components/ui/Toaster'

const navItems = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'TRABAJADORA', 'COMITE', 'SOCIALES', 'OBSERVADOR'],
  },
  {
    href: '/calendario',
    label: 'Calendario',
    icon: Calendar,
    roles: ['ADMIN', 'TRABAJADORA', 'COMITE', 'SOCIALES', 'OBSERVADOR'],
  },
  {
    href: '/requerimientos',
    label: 'Requerimientos',
    icon: Package,
    roles: ['ADMIN', 'TRABAJADORA', 'COMITE', 'OBSERVADOR'],
  },
  {
    href: '/tareas',
    label: 'Tareas',
    icon: KanbanSquare,
    roles: ['ADMIN', 'TRABAJADORA', 'SOCIALES', 'OBSERVADOR'],
  },
]

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  TRABAJADORA: 'T. Social y Deportes',
  COMITE: 'Comité',
  SOCIALES: 'Sec. de Sociales',
  OBSERVADOR: 'Observador',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-primary-100 text-primary-700',
  TRABAJADORA: 'bg-green-100 text-green-700',
  COMITE: 'bg-orange-100 text-orange-700',
  SOCIALES: 'bg-purple-100 text-purple-700',
  OBSERVADOR: 'bg-gray-100 text-gray-600',
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { unread, clearUnread } = useNotifications()

  if (!session) return null

  const role = session.user.role
  const filteredItems = navItems.filter((item) => item.roles.includes(role))

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">CVA</p>
            <p className="text-xs text-gray-500">Deportes y Sociales</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{session.user.name}</p>
              {session.user.disciplineName && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{session.user.disciplineName}</p>
              )}
              <span className={cn('inline-flex mt-1.5 rounded-full px-2 py-0.5 text-xs font-medium', roleColors[role])}>
                {roleLabels[role] || role}
              </span>
            </div>
            {unread > 0 && (
              <button
                onClick={clearUnread}
                title={`${unread} notificación${unread !== 1 ? 'es' : ''} nueva${unread !== 1 ? 's' : ''}`}
                className="relative flex-shrink-0 mt-0.5 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Bell className="w-5 h-5 text-primary-600" />
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-0.5">
                  {unread > 9 ? '9+' : unread}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600')} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 text-primary-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 w-full transition-all group"
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-gray-200"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Global toast notifications */}
      <Toaster />
    </>
  )
}
