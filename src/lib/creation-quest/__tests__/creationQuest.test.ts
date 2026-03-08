/**
 * Creation Quest Bootstrap — Tests
 *
 * Run with: npx tsx src/lib/creation-quest/__tests__/creationQuest.test.ts
 */

import { extractCreationIntent } from '../extractCreationIntent'
import { generateCreationQuest } from '../generateCreationQuest'
import { assembleArtifact } from '../assembleArtifact'
import type { UnpackingAnswers } from '@/lib/quest-grammar'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

const ONBOARDING_ANSWERS: UnpackingAnswers & { alignedAction?: string } = {
  q1: 'I want people to donate to the Bruised Banana Residency',
  q2: 'I will feel triumphant and poignant',
  q3: "I haven't received any donations",
  q4: "It's scary. I'm frustrated. I'm anxious",
  q5: "To be anxious I'd have to be worried about the future",
  q6: "I'm not ready, and I'm not worthy",
  alignedAction: 'Show Up — complete the onboarding flow',
}

const COMMUNAL_ANSWERS: UnpackingAnswers & { alignedAction?: string } = {
  q1: 'Build coalition for the campaign and communicate urgency',
  q2: 'Satisfied, clear',
  q3: 'Stuck',
  q4: 'Frustrated',
  q5: 'Clarity would help',
  q6: "I'm not good enough",
  alignedAction: 'Wake Up — see the coalition',
}

function testExtractCreationIntent() {
  const onboarding = extractCreationIntent(ONBOARDING_ANSWERS as unknown as Record<string, unknown>)
  assert(onboarding.creationType === 'onboarding_quest', 'Should detect onboarding_quest from keywords')
  assert(onboarding.domain === 'GATHERING_RESOURCES', 'Should set domain for onboarding')
  assert(onboarding.confidence >= 0.6, 'Should have sufficient confidence with full unpacking')
  assert(onboarding.questModel === 'personal', 'Bruised Banana without coalition keywords → personal')
  assert(onboarding.moveType === 'showUp', 'Should derive showUp from alignedAction')

  const communal = extractCreationIntent(COMMUNAL_ANSWERS as unknown as Record<string, unknown>)
  assert(communal.questModel === 'communal', 'Coalition/campaign/urgency keywords → communal')
  assert(communal.moveType === 'wakeUp', 'Should derive wakeUp from alignedAction')

  const creationQuest = extractCreationIntent({
    q1: 'I want to create a BAR from my 321 shadow work',
    q2: 'Relieved',
    q3: 'Scattered',
    q4: 'Neutral',
    q5: 'Digital input would unblock me',
    q6: "I'm not capable",
    alignedAction: 'Grow Up — build the digital 321 input feature',
  })
  assert(creationQuest.creationType === 'creation_quest', 'Should detect creation_quest from BAR/321 keywords')
  assert(creationQuest.moveType === 'growUp', 'Should derive growUp from alignedAction')

  console.log('✅ extractCreationIntent')
}

async function testGenerateCreationQuest() {
  const intent = extractCreationIntent(ONBOARDING_ANSWERS as unknown as Record<string, unknown>)
  const packet = await generateCreationQuest(intent, {
    segment: 'player',
    unpackingAnswers: ONBOARDING_ANSWERS,
  })

  assert(packet.heuristicVsAi === 'heuristic', 'Should use heuristic path when confidence >= threshold')
  assert(packet.templateMatched === 'epiphany_bridge', 'Personal quest should use epiphany_bridge')
  assert(packet.nodes.length >= 6, 'Epiphany Bridge has 6 nodes')

  const communalIntent = extractCreationIntent(COMMUNAL_ANSWERS as unknown as Record<string, unknown>)
  const communalPacket = await generateCreationQuest(communalIntent, {
    segment: 'player',
    unpackingAnswers: COMMUNAL_ANSWERS,
  })
  assert(communalPacket.templateMatched === 'kotter_8_stages', 'Communal quest should use kotter_8_stages')
  assert(communalPacket.nodes.length >= 8, 'Kotter has 8 nodes')

  console.log('✅ generateCreationQuest')
}

function testAssembleArtifact() {
  const nodes = [
    { id: 'node_0', text: 'Start', choices: [{ text: 'Continue', targetId: 'node_1' }] },
    { id: 'node_1', text: 'End', choices: [] },
  ]

  const passagesArt = assembleArtifact('passages', { nodes })
  assert(passagesArt.type === 'passages', 'Should produce passages artifact')
  if (passagesArt.type === 'passages') {
    assert(passagesArt.passages.length === 2, 'Should have 2 passages')
    assert(passagesArt.passages[0].nodeId === 'node_0', 'First passage nodeId')
  }

  const tweeArt = assembleArtifact('twee', { nodes })
  assert(tweeArt.type === 'twee', 'Should produce twee artifact')
  if (tweeArt.type === 'twee') {
    assert(tweeArt.content.includes(':: node_0'), 'Twee should include node IDs')
    assert(tweeArt.content.includes('[[Continue|node_1]]'), 'Twee should include choice links')
  }

  console.log('✅ assembleArtifact')
}

async function main() {
  testExtractCreationIntent()
  await testGenerateCreationQuest()
  testAssembleArtifact()
  console.log('\n✅ All creation-quest tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
