/**
 * Nation move profiles EF — overlay + quest flavor
 */
import assert from 'node:assert'
import {
  applyNationOverlay,
  applyNationQuestFlavor,
  getNationMoveProfile,
  NATION_MOVE_PROFILES,
} from '../nation-profiles'
import { generateQuestSeed } from '../selectMoves'
import { parseNarrative } from '../../parse'

const sampleNarrative = 'I feel stuck facing a conflict at work about my role.'

function testGetNationMoveProfile() {
  const a = getNationMoveProfile('argyra')
  assert(a?.emotionChannel === 'fear', 'Argyra fear')
  assert(a?.element === 'metal', 'Argyra metal')
  assert(a?.developmentalEmphasis.includes('wake_up'), 'Argyra emphasizes wake')

  const byName = getNationMoveProfile('Pyrakanth')
  assert(byName?.nationId === 'pyrakanth', 'case-insensitive lookup')

  assert(getNationMoveProfile(undefined) === undefined, 'empty id')
}

function testApplyNationOverlay() {
  const profile = NATION_MOVE_PROFILES.argyra
  const healed = applyNationOverlay(
    { wake: 'observe', clean: 'wrong_id', grow: 'reframe', show: 'experiment', integrate: 'integrate' },
    profile
  )
  assert(healed.wake === 'observe', 'wake stays in preference list')
  assert(healed.clean === 'externalize', 'clean coerced to first nation pref for clean_up')
}

function testApplyNationQuestFlavor() {
  const seed = applyNationQuestFlavor(
    {
      questSeedType: 'narrative_transformation',
      wake_prompt: 'x',
      cleanup_prompt: 'x',
      grow_prompt: 'x',
      show_objective: 'x',
      bar_prompt: 'x',
    },
    NATION_MOVE_PROFILES.virelune
  )
  assert(seed.emotion_channel === 'joy', 'emotion channel')
  assert(seed.nation_move_profile_id === 'virelune', 'profile id')
  assert(seed.quest_flavor_tags?.includes('creative_quests'), 'flavor tags')
}

function testGenerateQuestSeedVariesByNation() {
  const parsed = parseNarrative(sampleNarrative)
  const argyra = generateQuestSeed(parsed, { nationId: 'argyra' })
  const pyr = generateQuestSeed(parsed, { nationId: 'pyrakanth' })
  assert(argyra.nation_flavor !== pyr.nation_flavor, 'nation one-liners differ')
  assert(argyra.emotion_channel === 'fear' && pyr.emotion_channel === 'anger', 'channels differ')
}

function testAllFiveProfiles() {
  const ids = ['argyra', 'pyrakanth', 'lamenth', 'meridia', 'virelune'] as const
  for (const id of ids) {
    assert(NATION_MOVE_PROFILES[id], `profile ${id}`)
    assert(getNationMoveProfile(id)?.nationId === id, `get ${id}`)
  }
}

testGetNationMoveProfile()
testApplyNationOverlay()
testApplyNationQuestFlavor()
testGenerateQuestSeedVariesByNation()
testAllFiveProfiles()

console.log('✅ nation-profiles tests passed')
