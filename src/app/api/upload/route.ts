import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const eventId = formData.get('eventId') as string

  if (!file || !eventId) {
    return NextResponse.json({ error: 'Archivo y evento son requeridos' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const path = join(process.cwd(), 'public', 'uploads', uniqueName)

  await writeFile(path, buffer)

  const image = await prisma.eventImage.create({
    data: {
      eventId,
      url: `/uploads/${uniqueName}`,
      name: file.name,
      uploadedById: session.user.id,
    },
  })

  return NextResponse.json(image, { status: 201 })
}
