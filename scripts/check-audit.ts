import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function main() {
  // Check if audit tables exist
  const tables = await db.$queryRaw<any[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('audit_logs', 'admin_audit_log', 'audit_log')
  `
  console.log('Audit tables found:', tables.map((t:any) => t.table_name))

  for (const { table_name } of tables) {
    const rows = await db.$queryRawUnsafe<any[]>(`SELECT * FROM "${table_name}" ORDER BY 1 DESC LIMIT 20`)
    console.log(`\n${table_name} (last 20):`, JSON.stringify(rows, null, 2))
  }
}
main().catch(e => console.error(e.message)).finally(() => db.$disconnect())
