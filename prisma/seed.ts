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

const committeeUsers = [
  { name: 'Carlos Pérez',     discipline: 'Tenis',          email: 'tenis@webcva.net',         password: 'raqueta3752' },
  { name: 'Ana Martínez',     discipline: 'Tenis de Mesa',  email: 'tenismesa@webcva.net',      password: 'paleta9148' },
  { name: 'Luis Rodríguez',   discipline: 'Pickleball',     email: 'pickleball@webcva.net',     password: 'pala6283' },
  { name: 'Sofia López',      discipline: 'Padel',          email: 'padel@webcva.net',          password: 'pista5417' },
  { name: 'Pedro Gómez',      discipline: 'Natación',       email: 'natacion@webcva.net',       password: 'piscina8036' },
  { name: 'Valentina Torres', discipline: 'Futbolito',      email: 'futbolito@webcva.net',      password: 'cancha2795' },
  { name: 'Rosa Díaz',        discipline: 'Bailoterapia',   email: 'bailoterapia@webcva.net',   password: 'ritmo4862' },
  { name: 'Miguel Herrera',   discipline: 'Xtreme Bike',    email: 'bike@webcva.net',           password: 'pedal7319' },
  { name: 'Fernando Ruiz',    discipline: 'Gimnasio',       email: 'gimnasio@webcva.net',       password: 'pesas1647' },
  { name: 'Laura Jiménez',    discipline: 'Funcionales',    email: 'funcionales@webcva.net',    password: 'circuito9253' },
  { name: 'José Morales',     discipline: 'Bolas Criollas', email: 'bolascriollas@webcva.net',  password: 'bola3481' },
  { name: 'Carmen Vega',      discipline: 'Dominó',         email: 'domino@webcva.net',         password: 'ficha7926' },
  { name: 'Roberto Castro',   discipline: 'Barajas',        email: 'barajas@webcva.net',        password: 'carta5138' },
  { name: 'Patricia Mendoza', discipline: 'Pilates',        email: 'pilates@webcva.net',        password: 'esterilla8472' },
]

async function main() {
  console.log('🌱 Iniciando seed de base de datos...')

  // Disciplinas — datos de catálogo, seguros de upsertear en cada deploy
  const createdDisciplines: Record<string, string> = {}
  for (const disc of disciplines) {
    const d = await prisma.discipline.upsert({
      where: { name: disc.name },
      update: {},
      create: disc,
    })
    createdDisciplines[disc.name] = d.id
  }
  console.log(`✅ ${disciplines.length} disciplinas procesadas`)

  // Usuarios — solo en primera vez; en deploys posteriores no se tocan
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'secdeportes@webcva.net' } })

  if (!existingAdmin) {
    console.log('👤 Primera vez: creando usuarios iniciales...')

    const adminPassword = await bcrypt.hash('gestion4821', 10)
    await prisma.user.create({
      data: {
        email: 'secdeportes@webcva.net',
        password: adminPassword,
        name: 'Administrador CVA',
        role: 'ADMIN',
      },
    })

    const trabajadoraPassword = await bcrypt.hash('bienestar7364', 10)
    await prisma.user.create({
      data: {
        email: 'social@webcva.net',
        password: trabajadoraPassword,
        name: 'María González',
        role: 'TRABAJADORA',
      },
    })

    for (const u of committeeUsers) {
      const hashed = await bcrypt.hash(u.password, 10)
      await prisma.user.create({
        data: {
          email: u.email,
          password: hashed,
          name: u.name,
          role: 'COMITE',
          disciplineId: createdDisciplines[u.discipline],
        },
      })
    }
    console.log(`✅ ${committeeUsers.length + 2} usuarios base creados`)
  } else {
    console.log('⏭️  Usuarios base ya existen — omitiendo creación')
  }

  // Usuarios nuevos por rol — se crean individualmente si aún no existen
  const existingSociales = await prisma.user.findUnique({ where: { email: 'secsociales@webcva.net' } })
  if (!existingSociales) {
    const socialesPassword = await bcrypt.hash('sociales5290', 10)
    await prisma.user.create({
      data: {
        email: 'secsociales@webcva.net',
        password: socialesPassword,
        name: 'Secretaría de Sociales',
        role: 'SOCIALES',
      },
    })
    console.log('✅ Usuario Secretaría de Sociales creado')
  }

  console.log('\n🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
