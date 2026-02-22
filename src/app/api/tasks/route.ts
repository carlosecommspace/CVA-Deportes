import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'COMITE') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const tasks = await prisma.task.findMany({
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ status: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SOCIALES') {
    return NextResponse.json({ error: 'Sin permisos para crear tareas' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, priority, dueDate, assignedToId } = body

  if (!title) return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })

  const count = await prisma.task.count({ where: { status: 'POR_HACER' } })
  const department = session.user.role === 'SOCIALES' ? 'SOCIALES' : 'DEPORTES'

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || 'MEDIA',
      department,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedToId: assignedToId || undefined,
      createdById: session.user.id,
      order: count,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(task, { status: 201 })
}
