/**
 * Archetype Influence Overlay v1 — Tests
 * Run with: npx tsx src/lib/archetype-influence-overlay/__tests__/overlay.test.ts
 */

import {
  getArchetypeInfluenceProfile,
  applyArchetypeOverlay,
  ARCHETYPE_PROFILES,
} from '../index'
import { assembleQuestSeed } from '@/lib/transformation-move-registry'
import type { ParsedNarrative } from '@/lib/transformation-move-registry/types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

const narrative: ParsedNarrative = {
  raw_text: 'I am afraid of failing',
  actor: 'I',
  state: 'afraid',
  object: 'failing',
}

function testGetArchetypeInfluenceProfile() {
  const dangerWalker = getArchetypeInfluenceProfile('danger-walker')
  assert(dangerWalker !== undefined, 'danger-walker profile exists')
  assert(dangerWalker!.archetype_name === 'The Danger Walker', 'Correct name')
  assert(dangerWalker!.trigram === 'Water', 'Correct trigram')
  assert(dangerWalker!.agency_pattern.includes('risk navigation'), 'Has risk navigation')

  const byName = getArchetypeInfluenceProfile('The Danger Walker')
  assert(byName !== undefined, 'Resolves by name')
  assert(byName!.archetype_id === 'danger-walker', 'Resolves to slug')

  const boldHeart = getArchetypeInfluenceProfile('bold-heart')
  assert(boldHeart !== undefined, 'bold-heart exists')
  assert(boldHeart!.prompt_modifiers[0].includes('courageous'), 'Has prompt modifier')

  const unknown = getArchetypeInfluenceProfile('unknown-archetype')
  assert(unknown === undefined, 'Unknown returns undefined')

  console.log('✓ testGetArchetypeInfluenceProfile')
}

function testApplyArchetypeOverlay() {
  const seed = assembleQuestSeed(narrative, 'emotional_lock', {
    wake: 'observe',
    clean: 'feel',
    grow: 'invert',
    show: 'experiment',
    integrate: 'integrate',
  })

  const profile = getArchetypeInfluenceProfile('danger-walker')!
  const overlayed = applyArchetypeOverlay(seed, profile)

  assert(overlayed.arc.show !== undefined, 'Show stage exists')
  assert(
    overlayed.arc.show!.prompt.includes('What small risk could safely reveal'),
    'Experiment prompt includes archetype modifier'
  )

  if (overlayed.arc.integrate) {
    assert(
      overlayed.arc.integrate.bar_prompt.includes('Danger Walker'),
      'Integration includes archetype name'
    )
  }

  console.log('✓ testApplyArchetypeOverlay')
}

function testAssembleQuestSeedWithArchetypeOption() {
  const seedWithout = assembleQuestSeed(narrative, 'emotional_lock', {
    wake: 'observe',
    clean: 'feel',
    grow: 'invert',
    show: 'experiment',
    integrate: 'integrate',
  })

  const seedWith = assembleQuestSeed(
    narrative,
    'emotional_lock',
    {
      wake: 'observe',
      clean: 'feel',
      grow: 'invert',
      show: 'experiment',
      integrate: 'integrate',
    },
    { archetypeKey: 'danger-walker' }
  )

  assert(seedWith.arc.show !== undefined, 'Show exists')
  assert(
    seedWith.arc.show!.prompt.length >= seedWithout.arc.show!.prompt.length,
    'Overlayed prompt is longer or equal'
  )
  assert(
    seedWith.arc.show!.prompt.includes('What small risk') ||
      seedWith.arc.show!.prompt !== seedWithout.arc.show!.prompt,
    'Overlay modified experiment prompt'
  )

  const seedWithUnknown = assembleQuestSeed(
    narrative,
    'emotional_lock',
    {
      wake: 'observe',
      clean: 'feel',
      grow: 'invert',
      show: 'experiment',
      integrate: 'integrate',
    },
    { archetypeKey: 'unknown' }
  )
  assert(
    seedWithUnknown.arc.show!.prompt === seedWithout.arc.show!.prompt,
    'Unknown archetype leaves seed unchanged'
  )

  console.log('✓ testAssembleQuestSeedWithArchetypeOption')
}

function testAllEightProfiles() {
  assert(ARCHETYPE_PROFILES.length === 8, 'All 8 profiles defined')
  const ids = new Set(ARCHETYPE_PROFILES.map((p) => p.archetype_id))
  assert(ids.size === 8, 'All unique IDs')
  const trigrams = ['Heaven', 'Water', 'Fire', 'Mountain', 'Wind', 'Earth', 'Thunder', 'Lake']
  for (const t of trigrams) {
    assert(
      ARCHETYPE_PROFILES.some((p) => p.trigram === t),
      `Trigram ${t} has profile`
    )
  }
  console.log('✓ testAllEightProfiles')
}

function main() {
  testGetArchetypeInfluenceProfile()
  testApplyArchetypeOverlay()
  testAssembleQuestSeedWithArchetypeOption()
  testAllEightProfiles()
  console.log('\nAll archetype influence overlay tests passed.')
}

main()
