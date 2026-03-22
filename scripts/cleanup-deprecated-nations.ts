/**
 * DN-1 through DN-4: Remove deprecated nations (Veritas + Metal) from the database.
 *
 * Safe to run multiple times (idempotent).
 *
 * Run with:
 *   npx tsx scripts/cleanup-deprecated-nations.ts
 *
 * Pass --dry-run to audit without making changes.
 * Pass --apply to actually execute deletions/updates.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const DEPRECATED_NATION_IDS = [
  'cmlsprx5s00003i34izxhq4la', // Veritas
  'cmlsweszd0001xsgpoe9jaoii', // Metal (placeholder)
]

const DEPRECATED_NATION_NAMES = ['Veritas', 'Metal']

const isDryRun = !process.argv.includes('--apply')

async function main() {
  console.log(isDryRun ? '=== DRY RUN (pass --apply to execute) ===' : '=== APPLYING CHANGES ===')
  console.log()

  // -------------------------------------------------------------------------
  // DN-1: Players assigned to deprecated nations
  // -------------------------------------------------------------------------
  const affectedPlayers = await db.player.findMany({
    where: { nationId: { in: DEPRECATED_NATION_IDS } },
    select: { id: true, name: true, nationId: true },
  })

  console.log(`DN-1: Players with deprecated nationId: ${affectedPlayers.length}`)
  for (const p of affectedPlayers) {
    console.log(`  - ${p.name} (${p.id}) → nationId: ${p.nationId}`)
  }

  if (!isDryRun && affectedPlayers.length > 0) {
    await db.player.updateMany({
      where: { nationId: { in: DEPRECATED_NATION_IDS } },
      data: { nationId: null },
    })
    console.log(`  → Nulled nationId for ${affectedPlayers.length} player(s)`)
  }

  // -------------------------------------------------------------------------
  // DN-2: CustomBars with thematic nation tag = 'Veritas' or 'Metal'
  // -------------------------------------------------------------------------
  const affectedBars = await db.customBar.findMany({
    where: { nation: { in: DEPRECATED_NATION_NAMES } },
    select: { id: true, title: true, nation: true },
  })

  console.log(`\nDN-2: CustomBars with deprecated nation tag: ${affectedBars.length}`)
  for (const b of affectedBars) {
    console.log(`  - "${b.title}" (${b.id}) → nation: ${b.nation}`)
  }

  if (!isDryRun && affectedBars.length > 0) {
    await db.customBar.updateMany({
      where: { nation: { in: DEPRECATED_NATION_NAMES } },
      data: { nation: null },
    })
    console.log(`  → Cleared nation tag on ${affectedBars.length} BAR(s)`)
  }

  // -------------------------------------------------------------------------
  // DN-3: NationMoves tied to deprecated nations (cascades to PlayerNationMoveUnlock)
  // -------------------------------------------------------------------------
  // Find deprecated nation records by both known id and by name (in case ids differ in this env)
  const deprecatedNations = await db.nation.findMany({
    where: {
      OR: [
        { id: { in: DEPRECATED_NATION_IDS } },
        { name: { in: DEPRECATED_NATION_NAMES }, instanceId: null },
      ],
    },
    select: { id: true, name: true },
  })

  console.log(`\nDN-3/4: Deprecated nation records found: ${deprecatedNations.length}`)
  for (const n of deprecatedNations) {
    console.log(`  - "${n.name}" (${n.id})`)

    const moves = await db.nationMove.findMany({
      where: { nationId: n.id },
      select: { id: true, key: true, name: true },
    })
    console.log(`    NationMoves: ${moves.length}`)
    for (const m of moves) {
      const unlockCount = await db.playerNationMoveUnlock.count({ where: { moveId: m.id } })
      console.log(`      - ${m.key} (${m.id}) — ${unlockCount} player unlock(s) [CASCADE]`)
    }
  }

  // -------------------------------------------------------------------------
  // DN-4: Delete the Nation records (cascades NationMoves + PlayerNationMoveUnlock)
  // -------------------------------------------------------------------------
  if (!isDryRun && deprecatedNations.length > 0) {
    const ids = deprecatedNations.map((n) => n.id)
    await db.nation.deleteMany({ where: { id: { in: ids } } })
    console.log(`\n  → Deleted ${deprecatedNations.length} nation record(s) (NationMoves + unlocks cascaded)`)
  }

  if (deprecatedNations.length === 0) {
    console.log('  → Already clean — no deprecated nation records found.')
  }

  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
