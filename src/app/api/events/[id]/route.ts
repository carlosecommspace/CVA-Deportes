import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      discipline: true,
      createdBy: { select: { id: true, name: true, email: true } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      checklist: {
        include: { completedBy: { select: { id: true, name: true } } },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  return NextResponse.json(event)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { title, description, location, date, endDate, status } = body

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  // Only admin, trabajadora, or the creator can update
  if (
    session.user.role === 'COMITE' &&
    event.createdById !== session.user.id &&
    event.disciplineId !== session.user.disciplineId
  ) {
    return NextResponse.json({ error: 'Sin permisos para modificar este evento' }, { status: 403 })
  }

  const updated = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(location !== undefined && { location }),
      ...(date && { date: new Date(date) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(status && { status }),
    },
    include: {
      discipline: true,
      createdBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'COMITE') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  await prisma.event.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
