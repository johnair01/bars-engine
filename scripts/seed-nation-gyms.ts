/**
 * Seed the 30 Nation Gyms — one per (nation × GameMasterFace) pair.
 *
 * Each nation gets 6 gyms. A gym is a School with nationId set to the
 * parent nation's DB id. This creates the 5 × 6 = 30 nation gym matrix.
 *
 * Prerequisites:
 * - Nations must be seeded first (npm run seed:nations)
 * - Big Schools should be seeded first (npm run seed:big-schools)
 *
 * Run: npm run seed:nation-gyms
 *
 * Idempotent: uses findFirst + upsert keyed on (portraysFace + nationId).
 * Safe to re-run — updates descriptions/names on existing gyms.
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { NATION_GYMS } from '../src/lib/school/nation-gyms'

async function seed() {
  console.log('--- Seeding 30 Nation Gyms (5 nations × 6 faces) ---\n')

  // Resolve nation names → DB ids
  const nations = await db.nation.findMany({
    where: { instanceId: null, archived: false },
    select: { id: true, name: true },
  })

  const nationMap = new Map(nations.map((n) => [n.name, n.id]))

  if (nationMap.size === 0) {
    console.error('❌ No nations found. Run `npm run seed:nations` first.')
    process.exit(1)
  }

  console.log(`Found ${nationMap.size} nations: ${[...nationMap.keys()].join(', ')}\n`)

  let created = 0
  let updated = 0
  let skipped = 0

  for (const gym of NATION_GYMS) {
    const nationId = nationMap.get(gym.nationName)

    if (!nationId) {
      console.warn(`  ⚠ Skipped: ${gym.name} — nation "${gym.nationName}" not found in DB`)
      skipped++
      continue
    }

    // Find existing gym for this (face + nation) pair
    const existing = await db.school.findFirst({
      where: {
        portraysFace: gym.portraysFace,
        nationId,
      },
    })

    if (existing) {
      await db.school.update({
        where: { id: existing.id },
        data: {
          name: gym.name,
          description: gym.description,
          sortOrder: gym.sortOrder,
        },
      })
      updated++
      console.log(`  ↻ Updated: ${gym.name} (${gym.portraysFace} × ${gym.nationName})`)
    } else {
      await db.school.create({
        data: {
          name: gym.name,
          description: gym.description,
          portraysFace: gym.portraysFace,
          nationId,
          sortOrder: gym.sortOrder,
        },
      })
      created++
      console.log(`  ✅ Created: ${gym.name} (${gym.portraysFace} × ${gym.nationName})`)
    }
  }

  console.log(`\n✅ Nation Gyms: ${created} created, ${updated} updated, ${skipped} skipped`)
  console.log('   Total expected: 30 (5 nations × 6 faces)')
}

seed().catch(console.error)
