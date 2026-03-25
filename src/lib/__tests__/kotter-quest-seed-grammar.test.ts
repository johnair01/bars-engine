/**
 * Run: npx tsx src/lib/__tests__/kotter-quest-seed-grammar.test.ts
 */

import { assertGmFaceStageMoveRegistry } from '@/lib/gm-face-stage-moves'
import { composeKotterQuestSeedBar, fillKotterQuestSeedSlots } from '@/lib/kotter-quest-seed-grammar'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  assertGmFaceStageMoveRegistry()

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
  assert(p.title.includes('Name what'), 'Phase C: stage-1 play headline in title')
  assert(!p.title.includes('We need resources'), 'Phase C: no deficit headline in title')
  assert(p.description.includes('running out or thin'), 'Phase C: domain beat uses play headline')

  const s1 = fillKotterQuestSeedSlots({
    campaignRef: 'x',
    kotterStage: 1,
    allyshipDomain: 'DIRECT_ACTION',
    hexagramId: 1,
  })
  assert(s1.stageHeadline.includes('smallest honest'), 'slots: stage-1 DIRECT_ACTION play headline')

  const pReading = composeKotterQuestSeedBar({
    campaignRef: 'x',
    kotterStage: 2,
    allyshipDomain: 'GATHERING_RESOURCES',
    hexagramId: 3,
    gameMasterFace: 'sage',
    readingFace: 'diplomat',
  })
  assert(pReading.description.includes('Lens — pattern'), 'structural sage lens')
  assert(pReading.description.includes('Read as Diplomat'), 'reading-face tint label')
  assert(pReading.description.includes('Lens — weave'), 'reading diplomat lens body')
  const fxRead = JSON.parse(pReading.completionEffects) as { readingFace?: string; gameMasterFace?: string }
  assert(fxRead.gameMasterFace === 'sage', 'BAR face stays structural')
  assert(fxRead.readingFace === 'diplomat', 'completionEffects.readingFace')

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

  const pMove = composeKotterQuestSeedBar({
    campaignRef: 'c',
    kotterStage: 1,
    allyshipDomain: 'GATHERING_RESOURCES',
    hexagramId: 2,
    gmFaceMoveId: 'K1_regent',
  })
  assert(pMove.title.includes('Bound one shortage'), 'title uses face-move title')
  assert(pMove.description.includes('concrete shortage'), 'description uses move action')
  const fxMove = JSON.parse(pMove.completionEffects) as { moveId?: string; gameMasterFace?: string }
  assert(fxMove.moveId === 'K1_regent', 'completionEffects.moveId')
  assert(fxMove.gameMasterFace === 'regent', 'gameMasterFace from move when omitted')

  const pWrongStage = composeKotterQuestSeedBar({
    campaignRef: 'c',
    kotterStage: 1,
    allyshipDomain: 'GATHERING_RESOURCES',
    hexagramId: 2,
    gmFaceMoveId: 'K2_regent',
  })
  assert(!JSON.parse(pWrongStage.completionEffects).moveId, 'ignore move when stage mismatch')

  const slotsMove = fillKotterQuestSeedSlots({
    campaignRef: 'c',
    kotterStage: 4,
    allyshipDomain: 'DIRECT_ACTION',
    hexagramId: 10,
    gmFaceMoveId: 'K4_architect',
  })
  assert(slotsMove.faceMove?.id === 'K4_architect', 'slots.faceMove')
  assert(slotsMove.microBeat.includes('Headline'), 'microBeat from move')

  console.log('kotter-quest-seed-grammar: ok')
}

run()
