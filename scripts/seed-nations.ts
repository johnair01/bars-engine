/**
 * Seed the 5 Canonical Nations — one per Wuxing element.
 *
 * Nations are the top-level geographical/elemental groupings. Each nation
 * gets 6 gyms (one per GameMasterFace), seeded separately by seed-nation-gyms.
 *
 * Nation face affinity is emergent through play — no prescribed alignment.
 *
 * Run: npm run seed:nations
 *
 * Idempotent: uses findFirst + upsert keyed on (name + instanceId IS NULL).
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { NATIONS } from '../src/lib/nation/nations'

async function seed() {
  console.log('--- Seeding 5 Canonical Nations ---')

  let created = 0
  let updated = 0

  for (const nation of NATIONS) {
    const { sortOrder: _sortOrder, ...data } = nation

    // Find existing global nation by name (instanceId IS NULL)
    const existing = await db.nation.findFirst({
      where: {
        name: nation.name,
        instanceId: null,
      },
    })

    if (existing) {
      await db.nation.update({
        where: { id: existing.id },
        data,
      })
      updated++
      console.log(`  \u21BB Updated: ${nation.name} (${nation.element})`)
    } else {
      await db.nation.create({ data })
      created++
      console.log(`  \u2705 Created: ${nation.name} (${nation.element})`)
    }
  }

  console.log(`\n\u2705 Nations: ${created} created, ${updated} updated`)
  console.log('   Total: 5 Nations (one per Wuxing element)')
  console.log('   Cycle: Metal \u2192 Water \u2192 Wood \u2192 Fire \u2192 Earth')
}

seed().catch(console.error)
