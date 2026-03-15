#!/usr/bin/env tsx
/**
 * ANC Verification Script
 *
 * Verifies the Agentic NPC Constitution System end-to-end:
 *   1. Tier-1 static NPC created and activated
 *   2. Tier-4 NPC (Giacomo) created with full constitution + memory
 *   3. Regent blocks unauthorized activation attempts
 *   4. Scene selection returns a template for a known player state
 *
 * Run: npx tsx scripts/verify-anc.ts
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { createNpcConstitution } from '../src/actions/npc-constitution'
import { activateNpcConstitution, validateNpcConstitution, suspendNpcConstitution } from '../src/lib/regent-gm'
import { addNpcMemory, getNpcMemories } from '../src/actions/npc-memory'
import { generateNpcReflection, reviewNpcReflection, getApprovedReflections } from '../src/actions/npc-reflection'
import { validateNpcAction } from '../src/lib/npc-action-validator'
import { selectScene } from '../src/lib/alchemy/select-scene'
import { setPlayerAlchemyState } from '../src/actions/alchemy'

let passed = 0
let failed = 0

function ok(label: string) {
  console.log(`  ✓ ${label}`)
  passed++
}

function fail(label: string, detail?: unknown) {
  console.error(`  ✗ ${label}`)
  if (detail) console.error('    ', detail)
  failed++
}

async function cleanup(names: string[]) {
  await db.npcConstitution.deleteMany({ where: { name: { in: names } } })
}

// ---------------------------------------------------------------------------
async function verifyTier1Npc() {
  console.log('\n[1] Tier-1 NPC — create + activate end-to-end')

  const npc = await createNpcConstitution({
    name: '__verify_tier1__',
    archetypalRole: 'Guide',
    tier: 1,
    identity: { core_nature: 'helpful', voice_style: 'warm', worldview: 'collaborative', mask_type: 'none' },
    values: { protects: ['clarity'], longs_for: ['connection'], refuses: ['deception'] },
    function: { primary_scene_role: 'reveal_lore', quest_affinities: ['GATHERING_RESOURCES'], bar_affinities: [] },
    limits: { can_initiate: ['reveal_lore', 'ask_question'], cannot_do: [], requires_regent_approval_for: [] },
    memoryPolicy: { scope: 'scene', retention_rules: [] },
    reflectionPolicy: { allowed: true, frequency: 'low', max_outputs: 1 },
  })

  if (!npc?.id) return fail('createNpcConstitution returned no id')
  ok('NPC constitution created (draft)')

  const validation = validateNpcConstitution({
    governedBy: npc.governedBy,
    tier: npc.tier,
    limits: npc.limits,
    reflectionPolicy: npc.reflectionPolicy,
  })
  if (!validation.valid) return fail('Validation failed', validation.errors)
  ok(`Constitution validates (warnings: ${validation.warnings.length})`)

  const activation = await activateNpcConstitution(npc.id)
  if (!activation.success) return fail('Activation failed', activation.error)
  ok('Constitution activated')

  const active = await db.npcConstitution.findUnique({ where: { id: npc.id } })
  if (active?.status !== 'active') return fail('Status not active after activation')
  ok('Status = active confirmed in DB')

  return npc.id
}

// ---------------------------------------------------------------------------
async function verifyGiacomo() {
  console.log('\n[2] Tier-4 NPC — Giacomo with full constitution + memory + reflection')

  const npc = await createNpcConstitution({
    name: '__verify_giacomo__',
    archetypalRole: 'Villain / Shadow Merchant',
    tier: 4,
    identity: {
      core_nature: 'calculating opportunist who tests the community\'s integrity',
      voice_style: 'silken, precise, unsettling',
      worldview: 'resources are power; trust is a transaction',
      mask_type: 'charming benefactor',
    },
    values: {
      protects: ['his own leverage', 'the appearance of legitimacy'],
      longs_for: ['to be truly trusted', 'a community that surprises him'],
      refuses: ['direct lies (only misdirection)', 'acts that would fully expose him'],
    },
    function: {
      primary_scene_role: 'challenge_player',
      quest_affinities: ['DIRECT_ACTION', 'GATHERING_RESOURCES'],
      bar_affinities: ['shadow_work', 'courage'],
    },
    limits: {
      can_initiate: ['ask_question', 'challenge_player', 'offer_quest_seed', 'reveal_lore'],
      cannot_do: ['affirm_player_unconditionally', 'self_amend_constitution'],
      requires_regent_approval_for: ['offer_quest_seed'],
    },
    memoryPolicy: { scope: 'campaign', retention_rules: [{ type: 'scene', max: 10 }, { type: 'relationship', max: 5 }, { type: 'campaign', max: 3 }] },
    reflectionPolicy: { allowed: true, background_reflection_allowed: true, frequency: 'medium', max_outputs: 2 },
  })

  if (!npc?.id) return fail('Giacomo creation failed')
  ok('Giacomo constitution created (Tier 4)')

  const validation = validateNpcConstitution({
    governedBy: npc.governedBy,
    tier: npc.tier,
    limits: npc.limits,
    reflectionPolicy: npc.reflectionPolicy,
  })
  if (!validation.valid) return fail('Giacomo validation failed', validation.errors)
  ok('Giacomo constitution validates')

  const activation = await activateNpcConstitution(npc.id)
  if (!activation.success) return fail('Giacomo activation failed', activation.error)
  ok('Giacomo activated')

  // Memory
  const mem = await addNpcMemory(npc.id, null, 'First encounter with the community — they were more suspicious than expected.', 'campaign', ['first_encounter'])
  if (!mem?.id) return fail('Memory creation failed')
  ok('Campaign memory added')

  const memories = await getNpcMemories(npc.id, undefined, 'campaign')
  if (memories.length === 0) return fail('getNpcMemories returned empty')
  ok(`getNpcMemories: ${memories.length} campaign memory retrieved`)

  // Reflection
  const reflResult = await generateNpcReflection(
    npc.id,
    'Observed the community resist his first offer. They have more integrity than anticipated.',
    { stance_update: 'Increase interest — this group is worth more careful handling.', possible_hooks: ['return_with_better_offer'] }
  )
  if ('error' in reflResult) return fail('generateNpcReflection failed', reflResult.error)
  ok('Reflection generated (pending)')
  if (reflResult.reflection.status !== 'pending') return fail('Reflection should be pending')
  ok('Reflection status = pending')

  const reviewed = await reviewNpcReflection(reflResult.reflection.id, 'approve', 'regent_verify')
  if ('error' in reviewed) return fail('reviewNpcReflection failed', reviewed.error)
  if (reviewed.reflection.status !== 'approved') return fail('Reflection not approved after review')
  ok('Reflection approved by Regent')

  const approved = await getApprovedReflections(npc.id)
  if (approved.length === 0) return fail('getApprovedReflections returned empty')
  ok(`getApprovedReflections: ${approved.length} approved reflection`)

  return npc.id
}

// ---------------------------------------------------------------------------
async function verifyRegentBlocking() {
  console.log('\n[3] Regent blocks unauthorized activation')

  // Try to activate a constitution that is missing required fields
  const bad = await createNpcConstitution({
    name: '__verify_bad_constitution__',
    archetypalRole: 'Test',
    tier: 4,
    identity: { core_nature: 'test' },
    values: {},
    function: {},
    limits: {
      can_initiate: ['offer_quest_seed'],
      cannot_do: [],
      requires_regent_approval_for: [], // missing offer_quest_seed — should fail
    },
    memoryPolicy: {},
    reflectionPolicy: { allowed: true }, // tier 4 missing background_reflection_allowed
  })

  const validation = validateNpcConstitution({
    governedBy: bad.governedBy,
    tier: bad.tier,
    limits: bad.limits,
    reflectionPolicy: bad.reflectionPolicy,
  })

  if (validation.valid) return fail('Should have failed validation (missing sovereign approval + tier-4 reflection policy)')
  ok(`Validation correctly rejected (${validation.errors.length} errors)`)

  const activation = await activateNpcConstitution(bad.id)
  if (activation.success) return fail('Should have blocked activation of invalid constitution')
  ok('Activation blocked for invalid constitution')

  // Action verb blocking
  const blockResult = validateNpcAction(
    { verb: 'self_amend_constitution', payload: {} },
    { status: 'active', limits: JSON.stringify({ can_initiate: ['ask_question'] }) }
  )
  if (blockResult.decision !== 'blocked') return fail('self_amend_constitution should be blocked')
  ok('self_amend_constitution verb blocked by validator')

  // Suspended NPC cannot act
  const suspResult = validateNpcAction(
    { verb: 'ask_question', payload: {} },
    { status: 'suspended', limits: JSON.stringify({ can_initiate: ['ask_question'] }) }
  )
  if (suspResult.decision !== 'blocked') return fail('Suspended NPC should be blocked from all actions')
  ok('Suspended NPC actions blocked')

  return bad.id
}

// ---------------------------------------------------------------------------
async function verifySceneSelection() {
  console.log('\n[4] Scene selection for known player state')

  // Find or create a test player
  const player = await db.player.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!player) {
    console.log('  ~ No players in DB — skipping scene selection (needs a player)')
    return null
  }

  await setPlayerAlchemyState(player.id, 'fear', 'dissatisfied')
  ok(`Set player ${player.id.slice(0, 8)}… to fear:dissatisfied`)

  const scene = await selectScene(player.id)
  if (!scene) {
    console.log('  ~ No templates in DB yet — run npm run seed:alchemy-scenes first')
    return null
  }

  ok(`Scene selected: "${scene.title}"`)
  if (!scene.situation || !scene.choices) return fail('Scene missing required fields')
  ok('Scene has situation + choices fields')

  // Try with archetype bias
  const biasedScene = await selectScene(player.id, { archetypeSlug: 'warrior' })
  ok(`Biased scene selected: "${biasedScene?.title ?? 'none (no bias match)'}"`)

  return player.id
}

// ---------------------------------------------------------------------------
async function main() {
  console.log('=== ANC Verification ===')
  const ids: string[] = []

  try {
    const t1Id = await verifyTier1Npc()
    if (t1Id) ids.push(t1Id)

    const giaId = await verifyGiacomo()
    if (giaId) ids.push(giaId)

    const badId = await verifyRegentBlocking()
    if (badId) ids.push(badId)

    await verifySceneSelection()

  } finally {
    // Cleanup test NPCs
    if (ids.length > 0) {
      await db.npcConstitution.deleteMany({
        where: { name: { in: ['__verify_tier1__', '__verify_giacomo__', '__verify_bad_constitution__'] } }
      })
      console.log('\n~ Test NPCs cleaned up')
    }
    await db.$disconnect()
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failed > 0) process.exit(1)
}

main().catch((e) => {
  console.error('Verification script error:', e)
  process.exit(1)
})
