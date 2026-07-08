import assert from 'node:assert/strict'
import {
  buildRecommendationCardViewModel,
  formatAlchemyState,
  recommendationRoleLabel,
} from '../recommendation-card-view-model'
import type { MoveCard } from '../types'
import type { ShowUpRecommendation } from '@/lib/alchemy/show-up-primitives'

const card: MoveCard = {
  id: 'SHOW-DA-SAGE',
  num: '120',
  kind: 'move',
  move: 'show_up',
  operation: 'sage',
  domain: 'DIRECT_ACTION',
  outputBar: 'artifact',
  title: 'Show Up Through Direct Action',
  submovePrompt: 'Create a concrete artifact.',
  primaryQuestion: 'What action wants to become real?',
  campaignQuestion: 'What action does this campaign need?',
  defaultSubject: 'self',
  optimizesFor: 'movement',
  forbiddenMoves: [],
  failureModes: [],
  remediation: 'Make it smaller.',
  capabilities: ['agency'],
  status: 'authored',
}

const recommendation: ShowUpRecommendation = {
  edge: {
    operation: 'stabilize',
    from: { channel: 'anger', altitude: 'dissatisfied' },
    to: { channel: 'anger', altitude: 'neutral' },
    vector: 'anger:dissatisfied->anger:neutral',
    moveId: 'anger_stabilize',
    moveName: 'Clean Anger',
    prompt: 'Stabilize anger.',
  },
  primitiveMatch: {
    primitive: {
      id: 'interrupt_pattern',
      label: 'Interrupt Pattern',
      vectorTypes: ['stabilize'],
      preferredOperations: ['stabilize'],
      chargeMechanic: 'Desire and boundary become precise force.',
      baseAct: 'Stop the next repetition.',
      innerArtifactFamilies: ['line statement'],
      outerActFamilies: ['boundary'],
      completionLogic: 'The next repetition is interrupted or the line is placed before it repeats.',
      driftReflection: 'Did it protect the named value?',
      proofPrototypeIds: [],
    },
    vectorType: 'stabilize',
    score: 10,
    reasons: ['channel match'],
  },
  move: {
    primitiveId: 'interrupt_pattern',
    stateVector: 'anger:dissatisfied->anger:neutral',
    vectorMechanic: 'Frustration becomes clean boundary signal.',
    orientation: 'external',
    subject: 'self',
    superpower: 'coach',
    domain: 'DIRECT_ACTION',
    domainOutput: 'a direct-action line',
    blocker: 'The work needs direct action.',
    title: 'Place The Line',
    instruction: 'Write one sentence that names the line and the next action.',
    completion: 'A boundary sentence or action artifact exists.',
    reflectionPrompt: 'What did the line protect?',
  },
}

function testFormatsStates() {
  assert.equal(formatAlchemyState({ channel: 'anger', altitude: 'dissatisfied' }), 'Frustration')
  assert.equal(formatAlchemyState({ channel: 'sadness', altitude: 'neutral' }), 'Clean Sadness')
  assert.equal(formatAlchemyState({ channel: 'neutrality', altitude: 'satisfied' }), 'Peace')
}

function testRoleLabels() {
  assert.equal(recommendationRoleLabel('single'), 'practice')
  assert.equal(recommendationRoleLabel('metabolize'), 'metabolize')
  assert.equal(recommendationRoleLabel('satisfaction'), 'transcend')
}

function testBuildsRecommendationCardViewModel() {
  const vm = buildRecommendationCardViewModel({
    card,
    subject: 'campaign',
    recommendation,
    role: 'metabolize',
  })

  assert.equal(vm.kicker, 'metabolize')
  assert.equal(vm.title, 'Place The Line')
  assert.equal(vm.vectorLabel, 'Frustration -> Clean Anger')
  assert.equal(vm.blockerLabel, 'The work needs direct action.')
  assert.ok(vm.whyThisCard.includes('Show Up'))
  assert.ok(vm.whyThisCard.includes('collective work'))
  assert.ok(vm.protocolSteps.length >= 4)
  assert.ok(vm.protocolSteps[0].includes('Frustration becomes clean boundary signal'))
  assert.ok(vm.tracePrompt.includes('A boundary sentence'))
  assert.deepEqual(vm.saveTargets.map((target) => target.id), ['move_attempt', 'bar_reflection', 'share_card'])
  assert.ok(vm.saveTargets.every((target) => !target.enabled))
}

function testBlockerFallback() {
  const vm = buildRecommendationCardViewModel({
    card,
    subject: 'self',
    recommendation: {
      ...recommendation,
      move: {
        ...recommendation.move,
        blocker: 'The blocker has not been named yet.',
      },
    },
    role: 'single',
  })

  assert.equal(vm.blockerLabel, 'No blocker named yet; work from the vector and the card.')
}

testFormatsStates()
testRoleLabels()
testBuildsRecommendationCardViewModel()
testBlockerFallback()

console.log('recommendation-card-view-model tests passed')
