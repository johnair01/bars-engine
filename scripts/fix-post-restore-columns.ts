/**
 * Adds columns that exist in schema.prisma but were missing from the March 15 backup.
 * These were added via db push after March 15 without migration files.
 * Safe to run multiple times — all statements use IF NOT EXISTS.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function exec(sql: string, label: string) {
  try {
    await db.$executeRawUnsafe(sql)
    console.log(`  ✅ ${label}`)
  } catch (e: any) {
    if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
      console.log(`  ⏭️  ${label} (already exists)`)
    } else {
      console.error(`  ❌ ${label}: ${e.message}`)
      throw e
    }
  }
}

async function main() {
  console.log('Adding post-restore columns...\n')

  // custom_bars.inviteId (added after March 15 backup)
  await exec(`ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "inviteId" TEXT`, 'custom_bars.inviteId')
  await exec(`ALTER TABLE "custom_bars" ADD CONSTRAINT "custom_bars_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites"("id") ON DELETE SET NULL ON UPDATE CASCADE`, 'custom_bars_inviteId_fkey')

  // Check for other potentially missing columns by querying information_schema
  // vs what the schema expects — run prisma migrate status to confirm
  console.log('\nVerifying...')
  const col = await db.$queryRaw<any[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='custom_bars' AND column_name='inviteId'
  `
  console.log('custom_bars.inviteId exists:', col.length > 0)
}
main().catch(e => console.error('Fatal:', e.message)).finally(() => db.$disconnect())
