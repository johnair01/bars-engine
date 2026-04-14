/**
 * Seed all 36 schools: 6 Big Schools + 30 Nation Gyms.
 *
 * This is the unified seed/validation script for the full school matrix.
 * It ensures nations exist first, then seeds Big Schools and Nation Gyms,
 * and validates the final count is exactly 36.
 *
 * Breakdown:
 *   6  Big Schools  — one per GameMasterFace (nationId = null)
 *   30 Nation Gyms  — 5 nations × 6 faces  (nationId ≠ null)
 *   ──
 *   36 Total Schools
 *
 * Run: npm run seed:all-schools
 *
 * Idempotent: safe to re-run. Uses findFirst + create/update pattern
 * consistent with seed-big-schools.ts and seed-nation-gyms.ts.
 *
 * Prerequisites: DATABASE_URL must be set.
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { BIG_SCHOOLS } from '../src/lib/school/big-schools'
import { NATIONS } from '../src/lib/nation/nations'
import { NATION_GYMS } from '../src/lib/school/nation-gyms'

const EXPECTED_BIG_SCHOOLS = 6
const EXPECTED_NATION_GYMS = 30
const EXPECTED_TOTAL = EXPECTED_BIG_SCHOOLS + EXPECTED_NATION_GYMS // 36

async function seedNations(): Promise<Map<string, string>> {
  console.log('── Step 1: Ensuring 5 Canonical Nations exist ──\n')

  let created = 0
  let updated = 0

  for (const nation of NATIONS) {
    const { sortOrder: _sortOrder, ...data } = nation

    const existing = await db.nation.findFirst({
      where: { name: nation.name, instanceId: null },
    })

    if (existing) {
      await db.nation.update({ where: { id: existing.id }, data })
      updated++
      console.log(`  ↻ Updated: ${nation.name} (${nation.element})`)
    } else {
      await db.nation.create({ data })
      created++
      console.log(`  ✅ Created: ${nation.name} (${nation.element})`)
    }
  }

  console.log(`\n  Nations: ${created} created, ${updated} updated\n`)

  // Build name → id map for gym seeding
  const nations = await db.nation.findMany({
    where: { instanceId: null, archived: false },
    select: { id: true, name: true },
  })

  return new Map(nations.map((n) => [n.name, n.id]))
}

async function seedBigSchools(): Promise<number> {
  console.log('── Step 2: Seeding 6 Big Schools ──\n')

  let created = 0
  let updated = 0

  for (const school of BIG_SCHOOLS) {
    const existing = await db.school.findFirst({
      where: { portraysFace: school.portraysFace, nationId: null },
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

  console.log(`\n  Big Schools: ${created} created, ${updated} updated\n`)
  return created + updated
}

async function seedNationGyms(nationMap: Map<string, string>): Promise<number> {
  console.log('── Step 3: Seeding 30 Nation Gyms (5 nations × 6 faces) ──\n')

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

    const existing = await db.school.findFirst({
      where: { portraysFace: gym.portraysFace, nationId },
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

  if (skipped > 0) {
    console.warn(`\n  ⚠ ${skipped} gyms skipped due to missing nations`)
  }

  console.log(`\n  Nation Gyms: ${created} created, ${updated} updated, ${skipped} skipped\n`)
  return created + updated
}

async function validateCount(): Promise<void> {
  console.log('── Step 4: Validating school count ──\n')

  const bigSchoolCount = await db.school.count({
    where: { nationId: null, archived: false },
  })

  const nationGymCount = await db.school.count({
    where: { nationId: { not: null }, archived: false },
  })

  const totalCount = bigSchoolCount + nationGymCount

  console.log(`  Big Schools:  ${bigSchoolCount} (expected ${EXPECTED_BIG_SCHOOLS})`)
  console.log(`  Nation Gyms:  ${nationGymCount} (expected ${EXPECTED_NATION_GYMS})`)
  console.log(`  Total:        ${totalCount} (expected ${EXPECTED_TOTAL})`)

  const errors: string[] = []

  if (bigSchoolCount !== EXPECTED_BIG_SCHOOLS) {
    errors.push(
      `Big School count mismatch: got ${bigSchoolCount}, expected ${EXPECTED_BIG_SCHOOLS}`,
    )
  }

  if (nationGymCount !== EXPECTED_NATION_GYMS) {
    errors.push(
      `Nation Gym count mismatch: got ${nationGymCount}, expected ${EXPECTED_NATION_GYMS}`,
    )
  }

  if (totalCount !== EXPECTED_TOTAL) {
    errors.push(`Total school count mismatch: got ${totalCount}, expected ${EXPECTED_TOTAL}`)
  }

  if (errors.length > 0) {
    console.error('\n❌ Validation FAILED:')
    for (const err of errors) {
      console.error(`  - ${err}`)
    }
    process.exit(1)
  }

  console.log(`\n✅ Validation PASSED: ${EXPECTED_TOTAL} schools (6 Big Schools + 30 Nation Gyms)`)
}

async function seed() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  Seeding All 36 Schools (6 Big + 30 Nation Gyms) ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // Step 1: Ensure nations exist (prerequisite for nation gyms)
  const nationMap = await seedNations()

  if (nationMap.size === 0) {
    console.error('❌ No nations found after seeding. Cannot continue.')
    process.exit(1)
  }

  // Step 2: Seed 6 Big Schools
  await seedBigSchools()

  // Step 3: Seed 30 Nation Gyms
  await seedNationGyms(nationMap)

  // Step 4: Validate final count
  await validateCount()
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
