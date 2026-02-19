import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [
    totalEvents,
    eventsThisMonth,
    totalRequirements,
    pendingRequirements,
    highPriorityReqs,
    upcomingEvents,
    eventsByStatus,
    requirementsByPriority,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.requirement.count(),
    prisma.requirement.count({ where: { status: 'PENDIENTE' } }),
    prisma.requirement.count({ where: { priority: 'ALTA', status: { in: ['PENDIENTE', 'EN_PROCESO'] } } }),
    prisma.event.findMany({
      where: { date: { gte: now }, status: { not: 'CANCELADO' } },
      include: { discipline: true },
      orderBy: { date: 'asc' },
      take: 5,
    }),
    prisma.event.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.requirement.groupBy({
      by: ['priority'],
      _count: true,
      where: { status: { in: ['PENDIENTE', 'EN_PROCESO'] } },
    }),
  ])

  return NextResponse.json({
    totalEvents,
    eventsThisMonth,
    totalRequirements,
    pendingRequirements,
    highPriorityReqs,
    upcomingEvents,
    eventsByStatus,
    requirementsByPriority,
  })
}
