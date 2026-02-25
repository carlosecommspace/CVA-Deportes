import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { title, description, category, priority, estimatedDate, quantity, unit, status, notes } = body

  if (session.user.role === 'OBSERVADOR') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const req_ = await prisma.requirement.findUnique({ where: { id: params.id } })
  if (!req_) return NextResponse.json({ error: 'Requerimiento no encontrado' }, { status: 404 })

  if (session.user.role === 'COMITE' && req_.disciplineId !== session.user.disciplineId) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const updated = await prisma.requirement.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(priority && { priority }),
      ...(estimatedDate !== undefined && { estimatedDate: estimatedDate ? new Date(estimatedDate) : null }),
      ...(quantity !== undefined && { quantity: quantity ? parseInt(quantity) : null }),
      ...(unit !== undefined && { unit }),
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
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

  if (session.user.role === 'OBSERVADOR') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const req_ = await prisma.requirement.findUnique({ where: { id: params.id } })
  if (!req_) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (session.user.role === 'COMITE' && req_.createdById !== session.user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  await prisma.requirement.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
