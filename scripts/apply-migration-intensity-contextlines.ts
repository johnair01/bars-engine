/**
 * Applies intensity + contextLines columns to custom_bars.
 * Safe to run multiple times — idempotent.
 * Uses DATABASE_URL (direct) for DDL, not PRISMA_DATABASE_URL (Accelerate).
 */
import './require-db-env'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function exec(sql: string, label: string) {
  try {
    await db.$executeRawUnsafe(sql)
    console.log(`  ✅ ${label}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('already exists') || msg.includes('duplicate column')) {
      console.log(`  ⏭️  ${label} (already applied)`)
    } else {
      console.error(`  ❌ ${label}: ${msg}`)
      throw e
    }
  }
}

async function main() {
  console.log('Applying migration: intensity + contextLines on custom_bars...')
  await exec(`ALTER TABLE "custom_bars" ADD COLUMN "intensity" TEXT`, 'ADD intensity')
  await exec(`ALTER TABLE "custom_bars" ADD COLUMN "contextLines" TEXT`, 'ADD contextLines')
  console.log('✅ Migration complete.')
  await db.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
