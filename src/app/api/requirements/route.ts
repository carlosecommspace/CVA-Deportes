import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const disciplineId = searchParams.get('disciplineId')

  const where = disciplineId ? { disciplineId } : {}

  // Comités only see their own discipline
  const finalWhere =
    session.user.role === 'COMITE' && session.user.disciplineId
      ? { disciplineId: session.user.disciplineId }
      : where

  const requirements = await prisma.requirement.findMany({
    where: finalWhere,
    include: {
      discipline: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(requirements)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { title, description, category, priority, estimatedDate, quantity, unit, disciplineId, notes } = body

  if (!title || !disciplineId) {
    return NextResponse.json({ error: 'Título y disciplina son requeridos' }, { status: 400 })
  }

  if (session.user.role === 'OBSERVADOR') {
    return NextResponse.json({ error: 'Sin permisos para crear requerimientos' }, { status: 403 })
  }

  if (session.user.role === 'COMITE' && session.user.disciplineId !== disciplineId) {
    return NextResponse.json({ error: 'Solo puedes crear requerimientos para tu disciplina' }, { status: 403 })
  }

  const requirement = await prisma.requirement.create({
    data: {
      title,
      description,
      category,
      priority: priority || 'MEDIA',
      estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
      quantity: quantity ? parseInt(quantity) : null,
      unit,
      disciplineId,
      notes,
      createdById: session.user.id,
    },
    include: {
      discipline: true,
      createdBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(requirement, { status: 201 })
}
