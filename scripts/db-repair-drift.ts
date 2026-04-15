/**
 * Idempotent fixes for common Prisma `db push` failures when the remote DB
 * diverged from schema (e.g. shared dev DBs, push vs migrate mix).
 *
 * Run automatically from `npm run db:sync` unless SKIP_DB_REPAIR=1.
 * Manual: `npm run db:repair`
 *
 * Fixes:
 * - bar_decks: add nullable instanceId, backfill 1:1 with instances by row order, delete orphan decks
 * - bar_decks: drop legacy columns deckType, libraryId (never in Prisma schema; see docs/architecture/bar-decks-legacy-columns.md)
 * - custom_bars: ensure barCandidateId column exists (matches prisma/migrations/20260317000000_*)
 */
import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })
config({ path: '.env' })

const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
if (!url || url.trim() === '') {
  console.error('[db-repair-drift] DATABASE_URL not set; skipping.')
  process.exit(0)
}

const prisma = new PrismaClient({ datasources: { db: { url } } })

async function tableExists(name: string): Promise<boolean> {
  const r = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) AS exists
  `
  return Boolean(r[0]?.exists)
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const r = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    ) AS exists
  `
  return Boolean(r[0]?.exists)
}

async function repairBarDecks(): Promise<void> {
  if (!(await tableExists('bar_decks'))) {
    console.log('[db-repair-drift] bar_decks: table missing (push will create). Skip.')
    return
  }

  const instN = await prisma.instance.count()
  if (instN === 0) {
    const deckRows = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c FROM bar_decks
    `
    if (Number(deckRows[0]?.c) > 0) {
      console.warn(
        '[db-repair-drift] bar_decks: no instances in DB — cannot assign instanceId. Run `npm run db:seed` (or create an instance), then `npm run db:sync` again.'
      )
    }
    return
  }

  if (!(await columnExists('bar_decks', 'instanceId'))) {
    console.log('[db-repair-drift] bar_decks: adding nullable instanceId for backfill')
    await prisma.$executeRawUnsafe(`ALTER TABLE "bar_decks" ADD COLUMN "instanceId" TEXT`)
  }

  const backfillSql = `
    WITH deck_list AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
      FROM bar_decks
      WHERE "instanceId" IS NULL
    ),
    inst_list AS (
      SELECT i.id, ROW_NUMBER() OVER (ORDER BY i."createdAt") AS rn
      FROM instances i
      WHERE NOT EXISTS (
        SELECT 1 FROM bar_decks bd WHERE bd."instanceId" = i.id
      )
    )
    UPDATE bar_decks bd
    SET "instanceId" = il.id
    FROM deck_list dl
    JOIN inst_list il ON dl.rn = il.rn
    WHERE bd.id = dl.id
  `
  const updated = await prisma.$executeRawUnsafe(backfillSql)
  const n = typeof updated === 'number' ? updated : 0
  if (n > 0) console.log(`[db-repair-drift] bar_decks: backfilled instanceId for ${n} row(s)`)

  const orphanCount = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c FROM bar_decks WHERE "instanceId" IS NULL
  `
  const orphans = Number(orphanCount[0]?.c ?? 0)
  if (orphans > 0) {
    console.warn(
      `[db-repair-drift] bar_decks: removing ${orphans} row(s) with no instanceId (more decks than instances or orphan data). Related cards cascade.`
    )
    await prisma.$executeRawUnsafe(`DELETE FROM bar_decks WHERE "instanceId" IS NULL`)
  }
}

/** Pre-Prisma legacy columns; safe to drop — app never queried them. */
async function dropLegacyBarDeckColumns(): Promise<void> {
  if (!(await tableExists('bar_decks'))) return

  const rows = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bar_decks'
    AND lower(column_name) IN ('decktype', 'libraryid')
  `
  for (const { column_name } of rows) {
    console.log(`[db-repair-drift] bar_decks: dropping legacy column "${column_name}"`)
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "bar_decks" DROP COLUMN IF EXISTS "${column_name.replace(/"/g, '""')}"`
    )
  }
}

async function ensureCustomBarBarCandidateId(): Promise<void> {
  if (!(await tableExists('custom_bars'))) return
  if (await columnExists('custom_bars', 'barCandidateId')) {
    console.log('[db-repair-drift] custom_bars.barCandidateId: already present')
    return
  }
  console.log('[db-repair-drift] custom_bars: adding barCandidateId (nullable)')
  await prisma.$executeRawUnsafe(`ALTER TABLE "custom_bars" ADD COLUMN "barCandidateId" TEXT`)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "custom_bars_barCandidateId_key" ON "custom_bars"("barCandidateId")
  `)
  // FK only if bar_candidates exists
  if (await tableExists('bar_candidates')) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "custom_bars" DROP CONSTRAINT IF EXISTS "custom_bars_barCandidateId_fkey"
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "custom_bars" ADD CONSTRAINT "custom_bars_barCandidateId_fkey"
      FOREIGN KEY ("barCandidateId") REFERENCES "bar_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `)
  }
}

async function main() {
  console.log('--- [db-repair-drift] ---')
  try {
    await prisma.$connect()
    await repairBarDecks()
    await dropLegacyBarDeckColumns()
    await ensureCustomBarBarCandidateId()
    console.log('--- [db-repair-drift] done ---')
  } catch (e) {
    console.error('[db-repair-drift] failed:', e instanceof Error ? e.message : e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
