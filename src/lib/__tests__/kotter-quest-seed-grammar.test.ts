/**
 * Run: npx tsx src/lib/__tests__/kotter-quest-seed-grammar.test.ts
 */

import { composeKotterQuestSeedBar, fillKotterQuestSeedSlots } from '@/lib/kotter-quest-seed-grammar'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  const p = composeKotterQuestSeedBar({
    campaignRef: 'bruised-banana',
    kotterStage: 1,
    allyshipDomain: 'GATHERING_RESOURCES',
    hexagramId: 1,
    portalTheme: 'Test portal',
  })
  assert(p.title.includes('Urgency'), 'title has Urgency')
  assert(p.title.includes('H1'), 'title has H1')
  assert(p.description.includes('Heaven over Heaven'), 'hex structure')
  assert(p.description.includes('bruised-banana'), 'campaign ref')
  assert(p.kotterStage === 1, 'stage 1')
  assert(p.emotionalAlchemyTag === null, 'no alchemy')
  assert(JSON.parse(p.completionEffects).grammar === 'kotter-seed-v1', 'grammar tag')

  const p2 = composeKotterQuestSeedBar({
    campaignRef: 'x',
    kotterStage: 3,
    allyshipDomain: 'RAISE_AWARENESS',
    hexagramId: 8,
    emotionalAlchemyTag: 'curious',
    gameMasterFace: 'sage',
  })
  assert(p2.description.includes('Stance'), 'stance')
  assert(p2.description.includes('Lens — pattern'), 'sage lens')
  assert(p2.emotionalAlchemyTag === 'curious', 'alchemy passthrough')

  const s = fillKotterQuestSeedSlots({
    campaignRef: 'x',
    kotterStage: 99,
    allyshipDomain: 'DIRECT_ACTION',
    hexagramId: 0,
  })
  assert(s.kotterStage === 8, 'clamp stage high')
  assert(s.hexagramId === 1, 'clamp hex low')

  console.log('kotter-quest-seed-grammar: ok')
}

run()
