/**
 * Quest Grammar Compiler — Tests
 *
 * Run with: npx tsx src/lib/quest-grammar/__tests__/compileQuest.test.ts
 */

import { compileQuest } from '../compileQuest'
import type { QuestCompileInput, UnpackingAnswers } from '../types'

const BRUISED_BANANA_ANSWERS: UnpackingAnswers = {
  q1: 'I want people to donate to the Bruised Banana Residency',
  q2: 'I will feel triumphant and poignant and blissful',
  q3: "I haven't received any donations. People don't know about my app...",
  q4: "It's scary to be here. I'm frustrated... I'm anxious...",
  q5: "To be anxious I'd have to be worried about the future... money can protect me...",
  q6: "I'm not ready, and I'm not worthy",
}

const ALIGNED_ACTION =
  'Update the onboarding flow... from confused/curious to excited/triumphant about donating and playing'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function testSignatureExtraction() {
  const input: QuestCompileInput = {
    unpackingAnswers: BRUISED_BANANA_ANSWERS,
    alignedAction: ALIGNED_ACTION,
    segment: 'player',
  }
  const result = compileQuest(input)

  assert(result.signature.primaryChannel === 'Fear', 'Primary channel should be Fear (anxious, scary)')
  assert(result.signature.dissatisfiedLabels.length > 0, 'Should extract dissatisfied labels from Q4')
  assert(result.signature.satisfiedLabels.length > 0, 'Should extract satisfied labels from Q2')
  assert(
    result.signature.shadowVoices.some((v) => v.includes('ready')),
    'Should extract "not ready" from Q6'
  )
  assert(
    result.signature.shadowVoices.some((v) => v.includes('worthy')),
    'Should extract "not worthy" from Q6'
  )
  assert(result.signature.moveType === 'cleanUp', 'Default moveType when alignedAction does not match')

  const showUpResult = compileQuest({
    ...input,
    alignedAction: 'Show Up and complete the donation flow',
  })
  assert(showUpResult.signature.moveType === 'showUp', 'moveType should be showUp when alignedAction starts with Show Up')

  const wakeUpResult = compileQuest({
    ...input,
    alignedAction: 'Wake Up to what is possible',
  })
  assert(wakeUpResult.signature.moveType === 'wakeUp', 'moveType should be wakeUp when alignedAction starts with Wake Up')

  console.log('✅ signature extraction')
}

function testNodeCountAndBeats() {
  const input: QuestCompileInput = {
    unpackingAnswers: BRUISED_BANANA_ANSWERS,
    alignedAction: ALIGNED_ACTION,
    segment: 'player',
  }
  const result = compileQuest(input)

  assert(result.nodes.length === 6, 'Should have exactly 6 nodes')
  const beatOrder = [
    'orientation',
    'rising_engagement',
    'tension',
    'integration',
    'transcendence',
    'consequence',
  ]
  result.nodes.forEach((node, i) => {
    assert(node.beatType === beatOrder[i], `Node ${i} should be ${beatOrder[i]}`)
    assert(node.id === `node_${i}`, `Node ${i} should have id node_${i}`)
  })

  console.log('✅ node count and beat ordering')
}

function testConstraints() {
  const input: QuestCompileInput = {
    unpackingAnswers: BRUISED_BANANA_ANSWERS,
    alignedAction: ALIGNED_ACTION,
    segment: 'player',
  }
  const result = compileQuest(input)

  result.nodes.forEach((node, i) => {
    assert(node.wordCountEstimate >= 10, `Node ${i} should have reasonable word count`)
    if (i < 5) {
      assert(node.choices.length >= 1, `Node ${i} should have at least 1 choice`)
    }
    assert(
      !!(node.anchors.goal || node.anchors.identityCue || node.anchors.consequenceCue),
      `Node ${i} should have at least one anchor`
    )
  })

  console.log('✅ constraints (word count, choices, anchors)')
}

function testSegmentInvariant() {
  const baseInput = {
    unpackingAnswers: BRUISED_BANANA_ANSWERS,
    alignedAction: ALIGNED_ACTION,
  }
  const playerResult = compileQuest({ ...baseInput, segment: 'player' })
  const sponsorResult = compileQuest({ ...baseInput, segment: 'sponsor' })

  assert(
    playerResult.signature.primaryChannel === sponsorResult.signature.primaryChannel,
    'Spine: primary channel should be same'
  )
  assert(
    playerResult.nodes.length === sponsorResult.nodes.length,
    'Spine: node count should be same'
  )
  playerResult.nodes.forEach((node, i) => {
    assert(
      node.beatType === sponsorResult.nodes[i].beatType,
      `Spine: beat type should match at ${i}`
    )
    assert(
      node.emotional.channel === sponsorResult.nodes[i].emotional.channel,
      `Spine: emotional channel should match at ${i}`
    )
  })

  const playerText = playerResult.nodes[0].text
  const sponsorText = sponsorResult.nodes[0].text
  assert(playerText !== sponsorText, 'Framing should differ between player and sponsor')
  assert(
    playerText.includes('living world') || playerText.includes('participation'),
    'Player should have participation framing'
  )
  assert(
    sponsorText.includes('emergence') || sponsorText.includes('stewardship'),
    'Sponsor should have stewardship framing'
  )

  console.log('✅ segment lens invariants (spine preserved, framing differs)')
}

function testDeterminism() {
  const input: QuestCompileInput = {
    unpackingAnswers: BRUISED_BANANA_ANSWERS,
    alignedAction: ALIGNED_ACTION,
    segment: 'player',
  }
  const a = compileQuest(input)
  const b = compileQuest(input)

  assert(a.signature.primaryChannel === b.signature.primaryChannel, 'Determinism: signature')
  assert(a.nodes.length === b.nodes.length, 'Determinism: node count')
  a.nodes.forEach((node, i) => {
    assert(node.text === b.nodes[i].text, `Determinism: node ${i} text`)
  })

  console.log('✅ determinism')
}

function testKotterCommunalModel() {
  const input: QuestCompileInput = {
    unpackingAnswers: BRUISED_BANANA_ANSWERS,
    alignedAction: ALIGNED_ACTION,
    segment: 'player',
    questModel: 'communal',
  }
  const result = compileQuest(input)

  assert(result.nodes.length === 8, 'Communal model should have exactly 8 nodes')
  const kotterOrder = [
    'urgency',
    'coalition',
    'vision',
    'communicate',
    'obstacles',
    'wins',
    'build_on',
    'anchor',
  ]
  result.nodes.forEach((node, i) => {
    assert(node.beatType === kotterOrder[i], `Node ${i} should be ${kotterOrder[i]}`)
    assert(node.id === `node_${i}`, `Node ${i} should have id node_${i}`)
  })

  const winsNode = result.nodes.find((n) => n.beatType === 'wins')
  if (!winsNode) throw new Error('Should have wins node')
  assert(winsNode.isDonationNode === true, 'Wins (stage 6) should be donation node for Kotter')

  const anchorNode = result.nodes.find((n) => n.beatType === 'anchor')
  if (!anchorNode) throw new Error('Should have anchor node')
  assert(
    anchorNode.text.includes('Early Believer') || anchorNode.text.includes('Catalyst'),
    'Anchor should have identity flag'
  )

  console.log('✅ Kotter communal model (8 stages)')
}

function testDonationNode() {
  const input: QuestCompileInput = {
    unpackingAnswers: BRUISED_BANANA_ANSWERS,
    alignedAction: ALIGNED_ACTION,
    segment: 'player',
  }
  const result = compileQuest(input)

  const transcendenceNode = result.nodes.find((n) => n.beatType === 'transcendence')
  if (!transcendenceNode) throw new Error('Should have transcendence node')
  assert(transcendenceNode.isDonationNode === true, 'Transcendence should be donation node')
  assert(
    transcendenceNode.text.includes('threshold') || transcendenceNode.text.includes('Ritual'),
    'Donation node should have ritual framing'
  )
  assert(
    transcendenceNode.text.includes('Transaction') || transcendenceNode.text.includes('contribution'),
    'Donation node should have transaction language'
  )

  const consequenceNode = result.nodes.find((n) => n.beatType === 'consequence')
  if (!consequenceNode) throw new Error('Should have consequence node')
  assert(
    consequenceNode.text.includes('Early Believer') || consequenceNode.text.includes('Catalyst'),
    'Consequence should have identity flag'
  )
  assert(
    !!(consequenceNode.anchors.consequenceCue || consequenceNode.text.includes('logged')),
    'Consequence should have system event'
  )

  console.log('✅ donation node (ritual + transaction) and consequence')
}

function runTests() {
  console.log('--- Quest Grammar Compiler Tests ---\n')
  try {
    testSignatureExtraction()
    testNodeCountAndBeats()
    testKotterCommunalModel()
    testConstraints()
    testSegmentInvariant()
    testDeterminism()
    testDonationNode()
    console.log('\n✅ All tests passed')
  } catch (e) {
    console.error('\n❌', e)
    process.exit(1)
  }
}

runTests()
