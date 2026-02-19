import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const disciplines = [
  { name: 'Tenis', color: '#16a34a', icon: '🎾' },
  { name: 'Tenis de Mesa', color: '#dc2626', icon: '🏓' },
  { name: 'Pickleball', color: '#d97706', icon: '🏸' },
  { name: 'Padel', color: '#7c3aed', icon: '🎾' },
  { name: 'Natación', color: '#0284c7', icon: '🏊' },
  { name: 'Futbolito', color: '#15803d', icon: '⚽' },
  { name: 'Bailoterapia', color: '#db2777', icon: '💃' },
  { name: 'Xtreme Bike', color: '#ea580c', icon: '🚴' },
  { name: 'Gimnasio', color: '#475569', icon: '🏋️' },
  { name: 'Funcionales', color: '#0891b2', icon: '🤸' },
  { name: 'Bolas Criollas', color: '#854d0e', icon: '🎯' },
  { name: 'Dominó', color: '#1e293b', icon: '🁣' },
  { name: 'Barajas', color: '#9f1239', icon: '🃏' },
  { name: 'Pilates', color: '#a21caf', icon: '🧘' },
]

async function main() {
  console.log('🌱 Iniciando seed de base de datos...')

  // Create disciplines
  const createdDisciplines: Record<string, string> = {}
  for (const disc of disciplines) {
    const d = await prisma.discipline.upsert({
      where: { name: disc.name },
      update: {},
      create: disc,
    })
    createdDisciplines[disc.name] = d.id
  }
  console.log(`✅ ${disciplines.length} disciplinas creadas`)

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@cva.com' },
    update: {},
    create: {
      email: 'admin@cva.com',
      password: adminPassword,
      name: 'Administrador CVA',
      role: 'ADMIN',
    },
  })

  // Create Trabajadora
  const trabajadoraPassword = await bcrypt.hash('social123', 10)
  await prisma.user.upsert({
    where: { email: 'social@cva.com' },
    update: {},
    create: {
      email: 'social@cva.com',
      password: trabajadoraPassword,
      name: 'María González',
      role: 'TRABAJADORA',
    },
  })

  // Create committee users for each discipline
  const committeePassword = await bcrypt.hash('comite123', 10)
  const committeeUsers = [
    { name: 'Carlos Pérez', discipline: 'Tenis', email: 'tenis@cva.com' },
    { name: 'Ana Martínez', discipline: 'Tenis de Mesa', email: 'tenismesa@cva.com' },
    { name: 'Luis Rodríguez', discipline: 'Pickleball', email: 'pickleball@cva.com' },
    { name: 'Sofia López', discipline: 'Padel', email: 'padel@cva.com' },
    { name: 'Pedro Gómez', discipline: 'Natación', email: 'natacion@cva.com' },
    { name: 'Valentina Torres', discipline: 'Futbolito', email: 'futbolito@cva.com' },
    { name: 'Rosa Díaz', discipline: 'Bailoterapia', email: 'bailoterapia@cva.com' },
    { name: 'Miguel Herrera', discipline: 'Xtreme Bike', email: 'bike@cva.com' },
    { name: 'Fernando Ruiz', discipline: 'Gimnasio', email: 'gimnasio@cva.com' },
    { name: 'Laura Jiménez', discipline: 'Funcionales', email: 'funcionales@cva.com' },
    { name: 'José Morales', discipline: 'Bolas Criollas', email: 'bolascriollas@cva.com' },
    { name: 'Carmen Vega', discipline: 'Dominó', email: 'domino@cva.com' },
    { name: 'Roberto Castro', discipline: 'Barajas', email: 'barajas@cva.com' },
    { name: 'Patricia Mendoza', discipline: 'Pilates', email: 'pilates@cva.com' },
  ]

  for (const u of committeeUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: committeePassword,
        name: u.name,
        role: 'COMITE',
        disciplineId: createdDisciplines[u.discipline],
      },
    })
  }
  console.log(`✅ ${committeeUsers.length + 2} usuarios creados`)

  // Sample events — only if no events exist yet (avoid duplicates on redeploy)
  const existingEvents = await prisma.event.count()
  const admin = await prisma.user.findUnique({ where: { email: 'admin@cva.com' } })
  const tenisId = createdDisciplines['Tenis']
  const natacionId = createdDisciplines['Natación']
  const bailoterapiaId = createdDisciplines['Bailoterapia']

  if (admin && existingEvents === 0) {
    const event1 = await prisma.event.create({
      data: {
        title: 'Torneo de Tenis Mensual',
        description: 'Torneo interno de tenis para todos los socios del CVA',
        location: 'Canchas de Tenis CVA',
        date: new Date(2026, 1, 25, 9, 0),
        endDate: new Date(2026, 1, 25, 17, 0),
        disciplineId: tenisId,
        status: 'PLANIFICADO',
        createdById: admin.id,
      },
    })

    await prisma.eventChecklist.createMany({
      data: [
        { eventId: event1.id, item: 'Confirmar número de participantes', order: 1 },
        { eventId: event1.id, item: 'Reservar canchas', order: 2 },
        { eventId: event1.id, item: 'Preparar premiación', order: 3 },
        { eventId: event1.id, item: 'Comunicar a los socios', order: 4 },
        { eventId: event1.id, item: 'Confirmar árbitros', order: 5 },
      ],
    })

    await prisma.event.create({
      data: {
        title: 'Clínica de Natación Infantil',
        description: 'Clase especial de natación para niños de 6 a 12 años',
        location: 'Piscina Principal CVA',
        date: new Date(2026, 2, 5, 10, 0),
        endDate: new Date(2026, 2, 5, 12, 0),
        disciplineId: natacionId,
        status: 'PLANIFICADO',
        createdById: admin.id,
      },
    })

    await prisma.event.create({
      data: {
        title: 'Clase de Bailoterapia Especial',
        description: 'Clase de bailoterapia con instructor invitado',
        location: 'Salón Multiuso CVA',
        date: new Date(2026, 1, 22, 8, 0),
        endDate: new Date(2026, 1, 22, 9, 30),
        disciplineId: bailoterapiaId,
        status: 'EN_PROGRESO',
        createdById: admin.id,
      },
    })

    // Sample requirements
    const tenisUser = await prisma.user.findUnique({ where: { email: 'tenis@cva.com' } })
    const natacionUser = await prisma.user.findUnique({ where: { email: 'natacion@cva.com' } })

    if (tenisUser) {
      await prisma.requirement.createMany({
        data: [
          {
            disciplineId: tenisId,
            title: 'Pelotas de tenis HEAD',
            description: 'Necesitamos 20 latas de pelotas HEAD para los entrenamientos',
            category: 'implementos',
            priority: 'ALTA',
            quantity: 20,
            unit: 'latas',
            estimatedDate: new Date(2026, 2, 1),
            status: 'PENDIENTE',
            createdById: tenisUser.id,
          },
          {
            disciplineId: tenisId,
            title: 'Reparación de red cancha 2',
            description: 'La red de la cancha 2 está deteriorada y necesita reemplazo',
            category: 'infraestructura',
            priority: 'ALTA',
            estimatedDate: new Date(2026, 1, 28),
            status: 'EN_PROCESO',
            createdById: tenisUser.id,
          },
        ],
      })
    }

    if (natacionUser) {
      await prisma.requirement.create({
        data: {
          disciplineId: natacionId,
          title: 'Tapones para orejas',
          description: 'Tapones de silicona para nadadores',
          category: 'insumos',
          priority: 'MEDIA',
          quantity: 30,
          unit: 'pares',
          estimatedDate: new Date(2026, 2, 15),
          status: 'PENDIENTE',
          createdById: natacionUser.id,
        },
      })
    }

    // Sample tasks
    const trabajadora = await prisma.user.findUnique({ where: { email: 'social@cva.com' } })

    if (trabajadora) {
      await prisma.task.createMany({
        data: [
          {
            title: 'Elaborar informe mensual de actividades',
            description: 'Preparar el informe de todas las actividades deportivas del mes de febrero',
            status: 'EN_PROGRESO',
            priority: 'ALTA',
            dueDate: new Date(2026, 1, 28),
            createdById: admin.id,
            assignedToId: trabajadora.id,
            order: 0,
          },
          {
            title: 'Coordinar inscripciones torneo de tenis',
            description: 'Gestionar las inscripciones para el torneo mensual de tenis',
            status: 'POR_HACER',
            priority: 'ALTA',
            dueDate: new Date(2026, 1, 24),
            createdById: admin.id,
            assignedToId: trabajadora.id,
            order: 0,
          },
          {
            title: 'Actualizar cartelera deportiva',
            description: 'Actualizar la cartelera con los eventos y horarios del mes',
            status: 'POR_HACER',
            priority: 'MEDIA',
            dueDate: new Date(2026, 2, 1),
            createdById: admin.id,
            assignedToId: trabajadora.id,
            order: 1,
          },
          {
            title: 'Revisar requerimientos de Natación',
            description: 'Verificar y procesar los requerimientos pendientes de la disciplina de natación',
            status: 'PARA_REVISAR',
            priority: 'MEDIA',
            createdById: admin.id,
            assignedToId: trabajadora.id,
            order: 0,
          },
          {
            title: 'Enviar comunicado a comités',
            description: 'Enviar comunicado sobre las nuevas políticas de uso de instalaciones',
            status: 'COMPLETADA',
            priority: 'BAJA',
            createdById: admin.id,
            assignedToId: trabajadora.id,
            order: 0,
          },
        ],
      })
    }
  }

  console.log('✅ Datos de ejemplo creados')
  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📋 Credenciales de acceso:')
  console.log('  Admin:       admin@cva.com     / admin123')
  console.log('  Trabajadora: social@cva.com    / social123')
  console.log('  Comités:     <disciplina>@cva.com / comite123')
  console.log('  Ejemplo:     tenis@cva.com     / comite123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
