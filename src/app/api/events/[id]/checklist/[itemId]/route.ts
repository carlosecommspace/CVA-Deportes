import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (session.user.role === 'OBSERVADOR') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { completed } = await req.json()

  const updated = await prisma.eventChecklist.update({
    where: { id: params.itemId },
    data: {
      completed,
      completedById: completed ? session.user.id : null,
      completedAt: completed ? new Date() : null,
    },
    include: { completedBy: { select: { id: true, name: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role === 'COMITE' || session.user.role === 'OBSERVADOR') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  await prisma.eventChecklist.delete({ where: { id: params.itemId } })
  return NextResponse.json({ success: true })
}
