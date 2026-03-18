/**
 * Avatar parts — lock-step phase → layer mapping tests
 * Run with: npx tsx src/lib/__tests__/avatar-parts.test.ts
 */

import {
  getUnlockedLayersForProgress,
  getAvatarPartSpecsForProgress,
  getUnlockedLayersForNode,
  type CharacterCreatorPhase,
  type PartLayer,
} from '../avatar-parts'
import type { AvatarConfig } from '../avatar-utils'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function assertLayersEqual(actual: PartLayer[], expected: PartLayer[], label: string) {
  const a = [...actual].sort()
  const e = [...expected].sort()
  assert(
    JSON.stringify(a) === JSON.stringify(e),
    `${label}: expected [${e.join(', ')}], got [${a.join(', ')}]`
  )
}

// ---------------------------------------------------------------------------
// Character Creator phase → layer mapping
// ---------------------------------------------------------------------------

const PHASE_EXPECTATIONS: Array<{ phase: CharacterCreatorPhase; expected: PartLayer[] }> = [
  { phase: 'landing', expected: ['base'] },
  { phase: 'discovery', expected: ['base'] },
  { phase: 'archetype_reveal', expected: ['base', 'archetype_outfit'] },
  { phase: 'archetype_alternatives', expected: ['base', 'archetype_outfit'] },
  { phase: 'archetype_moves', expected: ['base', 'archetype_outfit'] },
  {
    phase: 'nation_discovery',
    expected: ['base', 'nation_body', 'archetype_outfit'],
  },
  {
    phase: 'nation_moves',
    expected: ['base', 'nation_body', 'nation_accent', 'archetype_outfit'],
  },
  {
    phase: 'story_community',
    expected: ['base', 'nation_body', 'nation_accent', 'archetype_outfit', 'archetype_accent'],
  },
  {
    phase: 'story_dreams',
    expected: ['base', 'nation_body', 'nation_accent', 'archetype_outfit', 'archetype_accent'],
  },
  {
    phase: 'story_fears',
    expected: ['base', 'nation_body', 'nation_accent', 'archetype_outfit', 'archetype_accent'],
  },
  {
    phase: 'complete',
    expected: ['base', 'nation_body', 'nation_accent', 'archetype_outfit', 'archetype_accent'],
  },
]

function testCharacterCreatorPhaseMapping() {
  for (const { phase, expected } of PHASE_EXPECTATIONS) {
    const layers = getUnlockedLayersForProgress('character-creator', {
      phase,
      resolvedArchetypeName: 'The Bold Heart',
      resolvedNationName: 'Argyra',
    })
    assertLayersEqual(layers, expected, `phase ${phase}`)
  }
  console.log('✓ testCharacterCreatorPhaseMapping')
}

// ---------------------------------------------------------------------------
// BB node → layer mapping (delegation)
// ---------------------------------------------------------------------------

function testBBNodeMapping() {
  const base = getUnlockedLayersForNode('BB_Start', {})
  assertLayersEqual(base, ['base'], 'BB_Start empty state')

  const nationChosen = getUnlockedLayersForNode('BB_ChooseNation', { nationId: 'nation-1' })
  assertLayersEqual(nationChosen, ['base', 'nation_body'], 'BB_ChooseNation with nationId')

  const playbookChosen = getUnlockedLayersForNode('BB_SetPlaybook_1', { archetypeId: 'pb-1' })
  assertLayersEqual(playbookChosen, ['base', 'archetype_outfit'], 'BB_SetPlaybook with archetypeId')

  const domainChosen = getUnlockedLayersForNode('BB_ChooseDomain', {
    nationId: 'n1',
    archetypeId: 'p1',
    campaignDomainPreference: ['GATHERING_RESOURCES'],
  })
  assertLayersEqual(domainChosen, ['base', 'nation_body', 'nation_accent', 'archetype_outfit'], 'BB_ChooseDomain')

  const movesNode = getUnlockedLayersForNode('BB_Moves_1', {
    nationId: 'n1',
    archetypeId: 'p1',
  })
  assertLayersEqual(movesNode, ['base', 'nation_body', 'archetype_outfit', 'archetype_accent'], 'BB_Moves')
  console.log('✓ testBBNodeMapping')
}

// ---------------------------------------------------------------------------
// getAvatarPartSpecsForProgress filters correctly
// ---------------------------------------------------------------------------

function testGetAvatarPartSpecsForProgress() {
  const config: AvatarConfig = {
    nationKey: 'argyra',
    archetypeKey: 'bold-heart',
    variant: 'default',
    genderKey: 'default',
  }

  const allLayers: PartLayer[] = ['base', 'nation_body', 'nation_accent', 'archetype_outfit', 'archetype_accent']
  const partialLayers: PartLayer[] = ['base', 'archetype_outfit']

  const fullSpecs = getAvatarPartSpecsForProgress(config, allLayers)
  assert(fullSpecs.length === 5, 'Full config yields 5 specs')
  assert(fullSpecs.some((s) => s.layer === 'base'), 'Has base')
  assert(fullSpecs.some((s) => s.layer === 'nation_body'), 'Has nation_body')
  assert(fullSpecs.some((s) => s.layer === 'archetype_outfit'), 'Has archetype_outfit')

  const partialSpecs = getAvatarPartSpecsForProgress(config, partialLayers)
  assert(partialSpecs.length === 2, 'Partial layers yields 2 specs')
  assert(partialSpecs.every((s) => partialLayers.includes(s.layer)), 'Only unlocked layers')

  const baseOnly = getAvatarPartSpecsForProgress(config, ['base'])
  assert(baseOnly.length === 1 && baseOnly[0].layer === 'base', 'Base only')

  console.log('✓ testGetAvatarPartSpecsForProgress')
}

// ---------------------------------------------------------------------------
// Onboarding profile source
// ---------------------------------------------------------------------------

function testOnboardingProfileMapping() {
  const empty = getUnlockedLayersForProgress('onboarding-profile', {})
  assertLayersEqual(empty, ['base'], 'Profile empty')

  const withNation = getUnlockedLayersForProgress('onboarding-profile', {
    nationId: 'n1',
    resolvedNationName: 'Argyra',
  })
  assertLayersEqual(withNation, ['base', 'nation_body', 'nation_accent'], 'Profile with nation')

  const full = getUnlockedLayersForProgress('onboarding-profile', {
    nationId: 'n1',
    archetypeId: 'p1',
    resolvedNationName: 'Argyra',
    resolvedArchetypeName: 'The Bold Heart',
  })
  assertLayersEqual(full, ['base', 'nation_body', 'nation_accent', 'archetype_outfit', 'archetype_accent'], 'Profile full')
  console.log('✓ testOnboardingProfileMapping')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('Avatar parts — lock-step tests\n')
  testCharacterCreatorPhaseMapping()
  testBBNodeMapping()
  testGetAvatarPartSpecsForProgress()
  testOnboardingProfileMapping()
  console.log('\n✅ All avatar-parts tests passed')
}

main()
