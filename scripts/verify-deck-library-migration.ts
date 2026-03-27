#!/usr/bin/env npx tsx
/**
 * Verify DeckLibrary migration data integrity.
 *
 * Checks:
 * 1. All BarDecks have valid library_id
 * 2. All DeckLibraries have valid instance references
 * 3. No orphaned records
 * 4. Unique constraints enforced
 * 5. Foreign keys intact
 *
 * Run:
 *   npx tsx scripts/verify-deck-library-migration.ts
 */

import './require-db-env'
import { db } from '../src/lib/db'

interface VerificationResult {
  check: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: Record<string, unknown>
}

async function verify(): Promise<void> {
  const results: VerificationResult[] = []

  console.log('🔍 Verifying DeckLibrary migration data integrity...\n')

  // Check 1: All BarDecks have library_id
  try {
    const decksWithoutLibrary = await db.barDeck.count({
      where: { libraryId: null },
    })

    results.push({
      check: 'All BarDecks have library_id',
      status: decksWithoutLibrary === 0 ? 'PASS' : 'FAIL',
      message: decksWithoutLibrary === 0
        ? 'All BarDecks have valid library_id'
        : `Found ${decksWithoutLibrary} BarDecks without library_id`,
      details: { count: decksWithoutLibrary }
    })
  } catch (e) {
    results.push({
      check: 'All BarDecks have library_id',
      status: 'FAIL',
      message: `Error checking BarDecks: ${e instanceof Error ? e.message : String(e)}`
    })
  }

  // Check 2: All DeckLibraries have valid Instance references
  try {
    const orphanedLibraries = await db.$queryRaw<Array<{ id: string }>>`
      SELECT dl.id
      FROM deck_libraries dl
      LEFT JOIN instances i ON dl.instance_id = i.id
      WHERE i.id IS NULL
    `

    results.push({
      check: 'All DeckLibraries have valid Instance references',
      status: orphanedLibraries.length === 0 ? 'PASS' : 'FAIL',
      message: orphanedLibraries.length === 0
        ? 'All DeckLibraries reference valid Instances'
        : `Found ${orphanedLibraries.length} orphaned DeckLibraries`,
      details: { orphanedIds: orphanedLibraries.map(l => l.id) }
    })
  } catch (e) {
    results.push({
      check: 'All DeckLibraries have valid Instance references',
      status: 'FAIL',
      message: `Error checking DeckLibraries: ${e instanceof Error ? e.message : String(e)}`
    })
  }

  // Check 3: All BarDecks have valid library references
  try {
    const orphanedDecks = await db.$queryRaw<Array<{ id: string }>>`
      SELECT bd.id
      FROM bar_decks bd
      LEFT JOIN deck_libraries dl ON bd.library_id = dl.id
      WHERE dl.id IS NULL
    `

    results.push({
      check: 'All BarDecks have valid library references',
      status: orphanedDecks.length === 0 ? 'PASS' : 'FAIL',
      message: orphanedDecks.length === 0
        ? 'All BarDecks reference valid DeckLibraries'
        : `Found ${orphanedDecks.length} orphaned BarDecks`,
      details: { orphanedIds: orphanedDecks.map(d => d.id) }
    })
  } catch (e) {
    results.push({
      check: 'All BarDecks have valid library references',
      status: 'FAIL',
      message: `Error checking BarDeck references: ${e instanceof Error ? e.message : String(e)}`
    })
  }

  // Check 4: DeckLibrary unique constraint (one per instance)
  try {
    const duplicateLibraries = await db.$queryRaw<Array<{ instance_id: string; count: number }>>`
      SELECT instance_id, COUNT(*) as count
      FROM deck_libraries
      GROUP BY instance_id
      HAVING COUNT(*) > 1
    `

    results.push({
      check: 'DeckLibrary unique constraint (one per instance)',
      status: duplicateLibraries.length === 0 ? 'PASS' : 'FAIL',
      message: duplicateLibraries.length === 0
        ? 'Each Instance has exactly one DeckLibrary'
        : `Found ${duplicateLibraries.length} Instances with multiple DeckLibraries`,
      details: { duplicates: duplicateLibraries }
    })
  } catch (e) {
    results.push({
      check: 'DeckLibrary unique constraint',
      status: 'FAIL',
      message: `Error checking unique constraint: ${e instanceof Error ? e.message : String(e)}`
    })
  }

  // Check 5: BarDeck unique constraint (one of each type per library)
  try {
    const duplicateDecks = await db.$queryRaw<Array<{ library_id: string; deck_type: string; count: number }>>`
      SELECT library_id, deck_type, COUNT(*) as count
      FROM bar_decks
      GROUP BY library_id, deck_type
      HAVING COUNT(*) > 1
    `

    results.push({
      check: 'BarDeck unique constraint (one of each type per library)',
      status: duplicateDecks.length === 0 ? 'PASS' : 'FAIL',
      message: duplicateDecks.length === 0
        ? 'Each DeckLibrary has at most one deck of each type'
        : `Found ${duplicateDecks.length} duplicate deck types`,
      details: { duplicates: duplicateDecks }
    })
  } catch (e) {
    results.push({
      check: 'BarDeck unique constraint',
      status: 'FAIL',
      message: `Error checking unique constraint: ${e instanceof Error ? e.message : String(e)}`
    })
  }

  // Check 6: Count summary
  try {
    const counts = {
      instances: await db.instance.count(),
      deckLibraries: await db.deckLibrary.count(),
      barDecks: await db.barDeck.count(),
      friendshipInvitations: await db.friendshipInvitation.count(),
    }

    results.push({
      check: 'Record counts',
      status: 'PASS',
      message: 'Database record summary',
      details: counts
    })
  } catch (e) {
    results.push({
      check: 'Record counts',
      status: 'WARN',
      message: `Could not get counts: ${e instanceof Error ? e.message : String(e)}`
    })
  }

  // Check 7: Verify Scene Atlas can be loaded
  try {
    const sceneAtlasInstances = await db.instance.findMany({
      where: {
        deckLibrary: {
          decks: {
            some: {
              deckType: 'SCENE_ATLAS'
            }
          }
        }
      },
      select: {
        slug: true,
        deckLibrary: {
          select: {
            decks: {
              where: { deckType: 'SCENE_ATLAS' },
              select: { id: true, deckType: true }
            }
          }
        }
      },
      take: 5
    })

    results.push({
      check: 'Scene Atlas deck queries work',
      status: 'PASS',
      message: `Successfully queried ${sceneAtlasInstances.length} instances with Scene Atlas decks`,
      details: { instances: sceneAtlasInstances.map(i => i.slug) }
    })
  } catch (e) {
    results.push({
      check: 'Scene Atlas deck queries work',
      status: 'FAIL',
      message: `Error querying Scene Atlas: ${e instanceof Error ? e.message : String(e)}`
    })
  }

  // Print results
  console.log('📊 Verification Results:\n')

  let passCount = 0
  let failCount = 0
  let warnCount = 0

  for (const result of results) {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${icon} ${result.check}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
    }
    console.log()

    if (result.status === 'PASS') passCount++
    else if (result.status === 'FAIL') failCount++
    else warnCount++
  }

  // Summary
  console.log('=' .repeat(80))
  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings\n`)

  if (failCount > 0) {
    console.error('❌ Migration verification FAILED')
    process.exit(1)
  } else if (warnCount > 0) {
    console.warn('⚠️  Migration verification passed with warnings')
    process.exit(0)
  } else {
    console.log('✅ Migration verification PASSED')
    process.exit(0)
  }
}

verify()
  .catch((e) => {
    console.error('\n❌ Verification script error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
