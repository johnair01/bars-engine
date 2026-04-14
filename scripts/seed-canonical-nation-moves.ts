/**
 * Seed 20 Canonical Nation Moves — 4 per nation × 5 nations.
 *
 * Each nation has one indigenous move per WAVE stage (Wake Up, Clean Up, Grow Up, Show Up).
 * These are the "native" ways each nation metabolizes emotional charge.
 *
 * Run: npx tsx scripts/seed-canonical-nation-moves.ts
 *
 * Idempotent: uses upsert keyed on `key`. Safe to re-run.
 * Requires: nations must exist (run seed-nations.ts first).
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { CANONICAL_NATION_MOVES } from '../src/lib/nation/nation-moves'
import { NATION_MOVES } from '../src/lib/nation/move-library-accessor'

const CHANNEL_MAP: Record<string, string> = {
  metal: 'METAL',
  water: 'WATER',
  wood: 'WOOD',
  fire: 'FIRE',
  earth: 'EARTH',
}

// Build lookup: nation key + wcgs_stage → full move definition from library
const libraryLookup = new Map(
  NATION_MOVES.map(m => [`${m.source_key}_${m.wcgs_stage}`, m])
)

// Map wave stage names between the two systems
const WAVE_TO_WCGS: Record<string, string> = {
  wakeUp: 'wake_up',
  cleanUp: 'clean_up',
  growUp: 'grow_up',
  showUp: 'show_up',
}

async function seed() {
  console.log('--- Seeding 20 Canonical Nation Moves ---\n')

  // Load all global nations
  const nations = await db.nation.findMany({
    where: { instanceId: null, archived: false },
    select: { id: true, name: true, element: true },
  })
  const nationMap = new Map(nations.map((n) => [n.name, n]))

  if (nations.length < 5) {
    console.error('Expected 5 nations, found', nations.length)
    console.error('Run seed-nations.ts first: npx tsx scripts/seed-nations.ts')
    process.exit(1)
  }

  let created = 0
  let updated = 0

  for (const move of CANONICAL_NATION_MOVES) {
    const nation = nationMap.get(move.nationName)
    if (!nation) {
      console.error(`  Nation not found: ${move.nationName} (skipping ${move.key})`)
      continue
    }

    // Look up full move definition from library
    const wcgsStage = WAVE_TO_WCGS[move.waveStage] ?? move.waveStage
    const nationKey = nation.element // library uses element as key (argyra→metal, etc.)
    // Try by nation name first (library uses source_key like 'argyra')
    const libraryMove = libraryLookup.get(`${move.nationName.toLowerCase()}_${wcgsStage}`)

    const data = {
      nationId: nation.id,
      name: libraryMove?.move_name ?? move.name,
      description: libraryMove?.description ?? move.description,
      isStartingUnlocked: true,
      appliesToStatus: JSON.stringify(['active', 'dormant']),
      requirementsSchema: libraryMove
        ? JSON.stringify({
            version: 2,
            fields: (libraryMove.reflection_schema.required_fields ?? []).map(f => ({
              key: f,
              label: f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              type: 'string',
              required: true,
            })),
            core_prompt: libraryMove.core_prompt,
            move_category: libraryMove.move_category,
          })
        : JSON.stringify({ version: 1, fields: [] }),
      effectsSchema: libraryMove
        ? JSON.stringify({
            version: 2,
            move_id: libraryMove.move_id,
            source_type: libraryMove.source_type,
            source_key: libraryMove.source_key,
            wcgs_stage: libraryMove.wcgs_stage,
            move_category: libraryMove.move_category,
            core_prompt: libraryMove.core_prompt,
            purpose: libraryMove.purpose,
            target_effect: libraryMove.target_effect,
            artifact_type: libraryMove.artifact_type,
            bar_integration: libraryMove.bar_integration,
            vibeulon_rules: libraryMove.vibeulon_rules,
            reflection_schema: libraryMove.reflection_schema,
            domain_translations: libraryMove.domain_translations,
          })
        : JSON.stringify({ version: 1 }),
      sortOrder: move.sortOrder,
      tier: 'CANONICAL',
      origin: 'GM_AUTHORED',
      channel: CHANNEL_MAP[move.channel] ?? null,
    }

    const existing = await db.nationMove.findUnique({ where: { key: move.key } })

    if (existing) {
      await db.nationMove.update({
        where: { key: move.key },
        data,
      })
      updated++
      console.log(`  ↻ Updated: ${move.name} (${move.nationName} / ${move.waveStage})`)
    } else {
      await db.nationMove.create({
        data: { key: move.key, ...data },
      })
      created++
      console.log(`  ✅ Created: ${move.name} (${move.nationName} / ${move.waveStage})`)
    }
  }

  console.log(`\n✅ Nation Moves: ${created} created, ${updated} updated`)
  console.log('   Total: 20 moves (4 per nation × 5 nations)')
  console.log('   Stages: Wake Up → Clean Up → Grow Up → Show Up')
}

seed().catch(console.error)
