import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const events = await prisma.event.findMany({
    include: {
      discipline: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { comments: true, checklist: true } },
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { title, description, location, date, endDate, disciplineId, checklist } = body

  if (!title || !date || !disciplineId) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  if (session.user.role === 'OBSERVADOR') {
    return NextResponse.json({ error: 'Sin permisos para crear eventos' }, { status: 403 })
  }

  // Comités can only create events for their own discipline
  if (session.user.role === 'COMITE' && session.user.disciplineId !== disciplineId) {
    return NextResponse.json({ error: 'Solo puedes crear eventos para tu disciplina' }, { status: 403 })
  }

  // SOCIALES can only create events under "Actividad Social"
  if (session.user.role === 'SOCIALES') {
    const disc = await prisma.discipline.findUnique({ where: { id: disciplineId } })
    if (!disc || disc.name !== 'Actividad Social') {
      return NextResponse.json({ error: 'Solo puedes crear eventos bajo Actividad Social' }, { status: 403 })
    }
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      location,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      disciplineId,
      createdById: session.user.id,
    },
    include: {
      discipline: true,
      createdBy: { select: { id: true, name: true } },
    },
  })

  if (checklist && checklist.length > 0) {
    await prisma.eventChecklist.createMany({
      data: checklist.map((item: string, idx: number) => ({
        eventId: event.id,
        item,
        order: idx,
      })),
    })
  }

  return NextResponse.json(event, { status: 201 })
}
