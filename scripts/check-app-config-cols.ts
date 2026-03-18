import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function main() {
  const cols = await db.$queryRaw<any[]>`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_config'
    ORDER BY ordinal_position
  `
  console.log('app_config columns in DB:', cols.map((c:any) => c.column_name))
}
main().catch(e => console.error(e.message)).finally(() => db.$disconnect())
