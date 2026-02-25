import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'COMITE' || session.user.role === 'OBSERVADOR') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { title, description, priority, dueDate, assignedToId, status, order, archived } = body

  const task = await prisma.task.findUnique({ where: { id: params.id } })
  if (!task) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })

  // Only ADMIN can archive/unarchive
  if (archived !== undefined && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo el admin puede archivar tareas' }, { status: 403 })
  }

  // Trabajadora can only change status
  if (session.user.role === 'TRABAJADORA') {
    if (title || description || priority || dueDate || assignedToId) {
      return NextResponse.json({ error: 'Solo el admin puede modificar detalles' }, { status: 403 })
    }
  }

  // SOCIALES can only edit tasks from their department
  if (session.user.role === 'SOCIALES' && task.department !== 'SOCIALES') {
    return NextResponse.json({ error: 'Sin permisos para modificar tareas de otro departamento' }, { status: 403 })
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(priority && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(status && { status }),
      ...(order !== undefined && { order }),
      ...(archived !== undefined && {
        archived,
        archivedAt: archived ? new Date() : null,
      }),
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SOCIALES') {
    return NextResponse.json({ error: 'Sin permisos para eliminar tareas' }, { status: 403 })
  }

  if (session.user.role === 'SOCIALES') {
    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task || task.department !== 'SOCIALES') {
      return NextResponse.json({ error: 'Sin permisos para eliminar tareas de otro departamento' }, { status: 403 })
    }
  }

  await prisma.task.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
