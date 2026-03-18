import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function main() {
  // Check global_state
  const gs = await db.$queryRaw<any[]>`SELECT * FROM global_state LIMIT 5`
  console.log('global_state:', JSON.stringify(gs, null, 2))

  // Check app_config full row
  const cfg = await db.$queryRaw<any[]>`SELECT * FROM app_config LIMIT 1`
  console.log('app_config:', JSON.stringify(cfg, null, 2))

  // Check every table for actual row counts (exact, not estimates)
  const tables = await db.$queryRaw<any[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  console.log('\nExact row counts:')
  for (const { table_name } of tables) {
    const result = await db.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as c FROM "${table_name}"`)
    const count = Number(result[0].c)
    if (count > 0) console.log(`  ${table_name}: ${count}`)
  }
  console.log('(zero-row tables omitted)')
}
main().catch(e => console.error('Error:', e.message)).finally(() => db.$disconnect())
