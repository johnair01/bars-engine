/**
 * Seed the 6 Big Schools — one per GameMasterFace.
 *
 * Big Schools are top-level (nationId = null) and represent the canonical
 * face-aligned school entity. Nation gyms (nationId != null) are seeded
 * separately once Nations exist.
 *
 * Each Big School has:
 * - name: "{Face} School"
 * - description: mission/role from the game-master-sects design doc
 * - portraysFace: the GameMasterFace value
 * - nationId: null (Big School sentinel)
 * - sortOrder: 0-5 matching Spiral Dynamics developmental sequence
 *
 * Run: npm run seed:big-schools
 *
 * Idempotent: uses upsert keyed on (portraysFace + nationId IS NULL).
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { BIG_SCHOOLS } from '../src/lib/school/big-schools'

async function seed() {
  console.log('--- Seeding 6 Big Schools ---')

  let created = 0
  let updated = 0

  for (const school of BIG_SCHOOLS) {
    // Find existing Big School for this face (nationId IS NULL)
    const existing = await db.school.findFirst({
      where: {
        portraysFace: school.portraysFace,
        nationId: null,
      },
    })

    if (existing) {
      await db.school.update({
        where: { id: existing.id },
        data: {
          name: school.name,
          description: school.description,
          sortOrder: school.sortOrder,
        },
      })
      updated++
      console.log(`  ↻ Updated: ${school.name} (${school.portraysFace})`)
    } else {
      await db.school.create({
        data: {
          name: school.name,
          description: school.description,
          portraysFace: school.portraysFace,
          nationId: null,
          sortOrder: school.sortOrder,
        },
      })
      created++
      console.log(`  ✅ Created: ${school.name} (${school.portraysFace})`)
    }
  }

  console.log(`\n✅ Big Schools: ${created} created, ${updated} updated`)
  console.log('   Total: 6 Big Schools (one per GameMasterFace)')
}

seed().catch(console.error)
