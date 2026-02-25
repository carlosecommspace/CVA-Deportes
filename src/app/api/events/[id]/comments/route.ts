import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (session.user.role === 'OBSERVADOR') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 })

  const comment = await prisma.eventComment.create({
    data: {
      eventId: params.id,
      userId: session.user.id,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(comment, { status: 201 })
}
