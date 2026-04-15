/**
 * Introspect spec_kit_backlog_items table structure.
 * Run: tsx scripts/introspect-spec-kit-backlog.ts
 */
import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })
config({ path: '.env' })

const prisma = new PrismaClient()

async function main() {
  const columns = await prisma.$queryRaw<
    { column_name: string; data_type: string; is_nullable: string }[]
  >`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'spec_kit_backlog_items'
    ORDER BY ordinal_position
  `
  if (columns.length === 0) {
    console.error('Table spec_kit_backlog_items not found')
    process.exit(1)
  }
  console.log(JSON.stringify(columns, null, 2))

  const sample = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM spec_kit_backlog_items LIMIT 1`
  if (sample.length > 0) {
    console.log('\nSample row keys:', Object.keys(sample[0]))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
