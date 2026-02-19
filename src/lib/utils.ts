type ClassValue = string | undefined | null | false | 0 | Record<string, boolean | undefined>

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = []
  for (const input of inputs) {
    if (!input) continue
    if (typeof input === 'string') {
      classes.push(input)
    } else if (typeof input === 'object') {
      for (const [key, val] of Object.entries(input)) {
        if (val) classes.push(key)
      }
    }
  }
  return classes.join(' ')
}

export const EVENT_STATUS = {
  PLANIFICADO: { label: 'Planificado', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  EN_PROGRESO: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  COMPLETADO: { label: 'Completado', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  POSTERGADO: { label: 'Postergado', color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500' },
}

export const PRIORITY = {
  ALTA: { label: 'Alta', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  MEDIA: { label: 'Media', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  BAJA: { label: 'Baja', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
}

export const REQUIREMENT_STATUS = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800' },
  EN_PROCESO: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  ADQUIRIDO: { label: 'Adquirido', color: 'bg-green-100 text-green-800' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
}

export const TASK_STATUS = {
  POR_HACER: { label: 'Por Hacer', color: 'bg-gray-100 text-gray-700' },
  EN_PROGRESO: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700' },
  PARA_REVISAR: { label: 'Para Revisar', color: 'bg-yellow-100 text-yellow-700' },
  COMPLETADA: { label: 'Completada', color: 'bg-green-100 text-green-700' },
}

export const REQUIREMENT_CATEGORIES = [
  { value: 'implementos', label: 'Implementos deportivos' },
  { value: 'insumos', label: 'Insumos' },
  { value: 'equipamiento', label: 'Equipamiento' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'otro', label: 'Otro' },
]

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTimeLocal(date: Date | string): string {
  const d = new Date(date)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDateInput(date: Date | string): string {
  const d = new Date(date)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
