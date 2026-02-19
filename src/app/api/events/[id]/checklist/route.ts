import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { item } = await req.json()
  if (!item?.trim()) return NextResponse.json({ error: 'El ítem no puede estar vacío' }, { status: 400 })

  const count = await prisma.eventChecklist.count({ where: { eventId: params.id } })

  const checkItem = await prisma.eventChecklist.create({
    data: {
      eventId: params.id,
      item: item.trim(),
      order: count,
    },
    include: { completedBy: { select: { id: true, name: true } } },
  })

  return NextResponse.json(checkItem, { status: 201 })
}
