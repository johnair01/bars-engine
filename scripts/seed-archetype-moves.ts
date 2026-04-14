#!/usr/bin/env tsx
/**
 * Seed 32 Archetype Moves — 4 per archetype × 8 trigram archetypes.
 *
 * Each archetype has one move per WCGS stage (wake_up, clean_up, grow_up, show_up).
 * Stored as NationMove rows with archetypeId set (nation-agnostic, archetype-scoped).
 *
 * Run: npx tsx scripts/seed-archetype-moves.ts
 *
 * Idempotent: uses upsert keyed on `key`. Safe to re-run.
 * Requires: Archetype rows must exist (run seed-narrative-content.ts or equivalent first).
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { ARCHETYPE_MOVES } from '../src/lib/nation/move-library-accessor'

/** Map archetype source_key from the library to playbook slug patterns in the DB. */
const ARCHETYPE_KEY_TO_DB_NAME: Record<string, string[]> = {
  bold_heart: ['Bold Heart', 'Heaven (Qian)', 'bold-heart'],
  devoted_guardian: ['Devoted Guardian', 'Earth (Kun)', 'devoted-guardian'],
  still_point: ['Still Point', 'Mountain (Gen)', 'still-point'],
  truth_seer: ['Truth Seer', 'Fire (Li)', 'truth-seer'],
  joyful_connector: ['Joyful Connector', 'Lake (Dui)', 'joyful-connector'],
  danger_walker: ['Danger Walker', 'Water (Kan)', 'danger-walker'],
  decisive_storm: ['Decisive Storm', 'Thunder (Zhen)', 'decisive-storm'],
  subtle_influence: ['Subtle Influence', 'Wind (Xun)', 'subtle-influence'],
}

const WCGS_SORT: Record<string, number> = {
  wake_up: 0,
  clean_up: 1,
  grow_up: 2,
  show_up: 3,
}

async function seed() {
  console.log('--- Seeding 32 Archetype Moves ---\n')

  // Load all global archetypes
  const archetypes = await db.archetype.findMany({
    where: { instanceId: null },
    select: { id: true, name: true },
  })

  // Build lookup: try multiple name patterns per library key
  const archetypeMap = new Map<string, { id: string; name: string }>()
  for (const [libKey, dbNames] of Object.entries(ARCHETYPE_KEY_TO_DB_NAME)) {
    const match = archetypes.find(a =>
      dbNames.some(n => a.name.toLowerCase().includes(n.toLowerCase()))
    )
    if (match) {
      archetypeMap.set(libKey, match)
    }
  }

  console.log(`  Found ${archetypeMap.size}/8 archetypes in DB`)
  if (archetypeMap.size === 0) {
    console.error('  No archetypes found. Run seed-narrative-content.ts first.')
    console.error('  Looked for names like:', Object.values(ARCHETYPE_KEY_TO_DB_NAME).flat().slice(0, 8).join(', '))
    process.exit(1)
  }

  // We need a "system" nation to attach archetype moves to.
  // Archetype moves are nation-agnostic but NationMove.nationId is required.
  // Use the first global nation as a placeholder — the archetypeId is what matters for scoping.
  const systemNation = await db.nation.findFirst({
    where: { instanceId: null, archived: false },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!systemNation) {
    console.error('  No nations found. Run seed-nations.ts first.')
    process.exit(1)
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const move of ARCHETYPE_MOVES) {
    const archetype = archetypeMap.get(move.source_key)
    if (!archetype) {
      console.log(`  ⚠ Archetype not found: ${move.source_key} (skipping ${move.move_id})`)
      skipped++
      continue
    }

    const key = move.move_id

    const data = {
      nationId: systemNation.id,
      archetypeId: archetype.id,
      name: move.move_name,
      description: move.description,
      isStartingUnlocked: true,
      appliesToStatus: JSON.stringify(['active', 'dormant']),
      requirementsSchema: JSON.stringify({
        version: 2,
        fields: (move.reflection_schema.required_fields ?? []).map(f => ({
          key: f,
          label: f.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          type: 'string',
          required: true,
        })),
        core_prompt: move.core_prompt,
        move_category: move.move_category,
      }),
      effectsSchema: JSON.stringify({
        version: 2,
        move_id: move.move_id,
        source_type: move.source_type,
        source_key: move.source_key,
        wcgs_stage: move.wcgs_stage,
        move_category: move.move_category,
        core_prompt: move.core_prompt,
        purpose: move.purpose,
        target_effect: move.target_effect,
        artifact_type: move.artifact_type,
        bar_integration: move.bar_integration,
        vibeulon_rules: move.vibeulon_rules,
        reflection_schema: move.reflection_schema,
        domain_translations: move.domain_translations,
      }),
      sortOrder: WCGS_SORT[move.wcgs_stage] ?? 0,
      tier: 'CANONICAL',
      origin: 'GM_AUTHORED',
      channel: null as string | null,
    }

    const existing = await db.nationMove.findUnique({ where: { key } })

    if (existing) {
      await db.nationMove.update({ where: { key }, data })
      updated++
      console.log(`  ↻ Updated: ${move.move_name} (${move.source_key} / ${move.wcgs_stage})`)
    } else {
      await db.nationMove.create({ data: { key, ...data } })
      created++
      console.log(`  ✅ Created: ${move.move_name} (${move.source_key} / ${move.wcgs_stage})`)
    }
  }

  console.log(`\n✅ Archetype Moves: ${created} created, ${updated} updated, ${skipped} skipped`)
  console.log('   Total: 32 moves (4 per archetype × 8 archetypes)')
}

seed().catch(console.error)
