/**
 * Script de deploy de migraciones con soporte de baseline automático.
 *
 * Casos que maneja:
 * - BD vacía (fresh deploy): migrate deploy crea todas las tablas normalmente.
 * - BD existente sin historial (P3005): hace baseline de la migración inicial
 *   y luego corre migrate deploy sin tocar datos.
 * - BD con historial de migraciones: migrate deploy aplica solo las pendientes.
 */

import { spawnSync } from 'child_process'

const INITIAL_MIGRATION = '20260219000000_init'

function run(cmd: string): void {
  const result = spawnSync(cmd, { shell: true, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function runCapture(cmd: string): { output: string; ok: boolean } {
  const result = spawnSync(cmd, { shell: true, stdio: ['inherit', 'pipe', 'pipe'] })
  const output = (result.stdout?.toString() ?? '') + (result.stderr?.toString() ?? '')
  process.stdout.write(output)
  return { output, ok: result.status === 0 }
}

const deploy = runCapture('prisma migrate deploy')

if (!deploy.ok) {
  if (deploy.output.includes('P3005')) {
    console.log('\n📌 BD existente sin historial de migraciones — aplicando baseline...')
    run(`prisma migrate resolve --applied "${INITIAL_MIGRATION}"`)
    console.log('✅ Baseline aplicado. Corriendo migrate deploy...')
    run('prisma migrate deploy')
  } else {
    process.exit(1)
  }
}
