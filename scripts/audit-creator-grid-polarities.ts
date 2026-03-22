#!/usr/bin/env npx tsx
/**
 * Scene Atlas — print derived pair1/pair2 for each archetype × sample nation per element
 * so authors can review labels in one matrix.
 *
 *   npm run audit:scene-atlas-polarities
 *   npx tsx scripts/audit-creator-grid-polarities.ts
 *
 * @see .specify/specs/creator-scene-grid-deck/POLARITY_DERIVATION.md
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { derivePolaritiesFromNationArchetype } from '../src/lib/creator-scene-grid-deck/polarities'

async function main() {
  const archetypes = await db.archetype.findMany({
    where: { instanceId: null },
    select: { name: true, description: true, primaryWaveStage: true },
    orderBy: { name: 'asc' },
  })

  const nations = await db.nation.findMany({
    where: { archived: false, instanceId: null },
    select: { name: true, element: true },
    orderBy: { name: 'asc' },
  })

  const byEl = new Map<string, (typeof nations)[0]>()
  for (const n of nations) {
    if (!byEl.has(n.element)) byEl.set(n.element, n)
  }

  console.log('=== Per archetype (first nation per element as pair1 sample) ===\n')

  for (const a of archetypes) {
    console.log(`— ${a.name} (wave: ${a.primaryWaveStage ?? 'null'})`)
    for (const el of ['wood', 'fire', 'earth', 'metal', 'water']) {
      const nation = byEl.get(el)
      if (!nation) continue
      const r = derivePolaritiesFromNationArchetype(
        { name: nation.name, element: nation.element },
        { name: a.name, description: a.description, primaryWaveStage: a.primaryWaveStage }
      )
      if (!r) continue
      console.log(
        `    ${el.padEnd(6)} ${nation.name.padEnd(12)} | pair1: ${r.pair1.negativeLabel}↔${r.pair1.positiveLabel} | pair2: ${r.pair2.negativeLabel}↔${r.pair2.positiveLabel} | ${r.provenance}`
      )
    }
    console.log('')
  }

  console.log(`Done. ${archetypes.length} archetypes, ${nations.length} nations.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
