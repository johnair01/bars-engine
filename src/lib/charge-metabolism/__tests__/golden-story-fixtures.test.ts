import * as assert from 'node:assert'
import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import type { VectorMovePracticeLens, VectorMovePracticeVariant } from '@/lib/alchemy/vector-move-families'
import { recommendChargeMetabolismMove } from '../recommendation-service'

interface GoldenStoryFixture {
  name: string
  circumstance: string
  present: AlchemyState
  desired: AlchemyState
  blocker: string
  expectedRoute: string[]
  expectedTranslateVector: string
  expectedOperation: string
  expectedLens: VectorMovePracticeLens
  expectedRole: VectorMovePracticeVariant['role']
  expectedCardCount: number
}

const authoredTranslateFixtures: GoldenStoryFixture[] = [
  {
    name: 'anger to fear locates risk before adding force',
    circumstance: 'I want to call this out in the group chat right now, but if I do it badly someone vulnerable may get exposed.',
    present: { channel: 'anger', altitude: 'neutral' },
    desired: { channel: 'fear', altitude: 'satisfied' },
    blocker: 'I need to hold this from a more mature level before I act.',
    expectedRoute: [
      'anger:neutral->fear:neutral',
      'fear:neutral->fear:satisfied',
    ],
    expectedTranslateVector: 'anger:neutral->fear:neutral',
    expectedOperation: 'Risk Before Force',
    expectedLens: 'grow_up',
    expectedRole: 'bridge',
    expectedCardCount: 2,
  },
  {
    name: 'fear to joy turns exposure into experiment',
    circumstance: 'I want to tell the story publicly, not just survive being seen. I want it to become a shared experiment instead of a private fear test.',
    present: { channel: 'fear', altitude: 'neutral' },
    desired: { channel: 'joy', altitude: 'satisfied' },
    blocker: 'I know what is true and need to act.',
    expectedRoute: [
      'fear:neutral->joy:neutral',
      'joy:neutral->joy:satisfied',
    ],
    expectedTranslateVector: 'fear:neutral->joy:neutral',
    expectedOperation: 'Turn The Edge Into An Experiment',
    expectedLens: 'show_up',
    expectedRole: 'action',
    expectedCardCount: 2,
  },
  {
    name: 'joy to fear maps exposure inside possibility',
    circumstance: 'This opportunity lights me up, but saying yes would make my actual limits visible. I keep wanting to overpromise so nobody sees the gap.',
    present: { channel: 'joy', altitude: 'neutral' },
    desired: { channel: 'fear', altitude: 'satisfied' },
    blocker: 'This is tangled with a self-sabotage belief that I have to overpromise.',
    expectedRoute: [
      'joy:neutral->fear:neutral',
      'fear:neutral->fear:satisfied',
    ],
    expectedTranslateVector: 'joy:neutral->fear:neutral',
    expectedOperation: 'Map The Exposure In The Possibility',
    expectedLens: 'clean_up',
    expectedRole: 'processing',
    expectedCardCount: 2,
  },
  {
    name: 'neutrality to anger finds where force belongs',
    circumstance: 'I can see everyone’s side so clearly that I keep saying nothing while the same harmful decision keeps moving forward.',
    present: { channel: 'neutrality', altitude: 'neutral' },
    desired: { channel: 'anger', altitude: 'satisfied' },
    blocker: 'I need to hold this from a more mature level before choosing force.',
    expectedRoute: [
      'neutrality:neutral->anger:neutral',
      'anger:neutral->anger:satisfied',
    ],
    expectedTranslateVector: 'neutrality:neutral->anger:neutral',
    expectedOperation: 'Find Where Force Belongs',
    expectedLens: 'grow_up',
    expectedRole: 'bridge',
    expectedCardCount: 2,
  },
  {
    name: 'neutrality to fear finds the field edge',
    circumstance: 'The plan looks stable from a distance, but one unknown keeps pulling my attention and nobody has named it.',
    present: { channel: 'neutrality', altitude: 'neutral' },
    desired: { channel: 'fear', altitude: 'satisfied' },
    blocker: 'I do not know what edge actually matters yet.',
    expectedRoute: [
      'neutrality:neutral->fear:neutral',
      'fear:neutral->fear:satisfied',
    ],
    expectedTranslateVector: 'neutrality:neutral->fear:neutral',
    expectedOperation: 'Find The Field Edge',
    expectedLens: 'wake_up',
    expectedRole: 'processing',
    expectedCardCount: 2,
  },
  {
    name: 'neutrality to joy finds the live part',
    circumstance: 'The meeting is calm and orderly, but everyone feels flat. Nothing is wrong enough to fix, and yet nobody wants to be there.',
    present: { channel: 'neutrality', altitude: 'neutral' },
    desired: { channel: 'joy', altitude: 'satisfied' },
    blocker: 'I do not know where the energy is.',
    expectedRoute: [
      'neutrality:neutral->joy:neutral',
      'joy:neutral->joy:satisfied',
    ],
    expectedTranslateVector: 'neutrality:neutral->joy:neutral',
    expectedOperation: 'Find The Live Part',
    expectedLens: 'wake_up',
    expectedRole: 'processing',
    expectedCardCount: 2,
  },
  {
    name: 'joy to sadness finds care inside joy',
    circumstance: 'I got invited into a collaboration I really want, and suddenly I miss the person I used to dream with.',
    present: { channel: 'joy', altitude: 'neutral' },
    desired: { channel: 'sadness', altitude: 'satisfied' },
    blocker: 'I cannot receive the care inside this joy yet.',
    expectedRoute: [
      'joy:neutral->sadness:neutral',
      'sadness:neutral->sadness:satisfied',
    ],
    expectedTranslateVector: 'joy:neutral->sadness:neutral',
    expectedOperation: 'Find The Care In The Joy',
    expectedLens: 'open_up',
    expectedRole: 'processing',
    expectedCardCount: 2,
  },
  {
    name: 'neutrality to sadness finds what matters in the field',
    circumstance: 'When I look at the whole family situation, I can explain everyone’s position. When I think about one neglected relationship, I go quiet.',
    present: { channel: 'neutrality', altitude: 'neutral' },
    desired: { channel: 'sadness', altitude: 'satisfied' },
    blocker: 'I cannot let myself feel what matters in this field yet.',
    expectedRoute: [
      'neutrality:neutral->sadness:neutral',
      'sadness:neutral->sadness:satisfied',
    ],
    expectedTranslateVector: 'neutrality:neutral->sadness:neutral',
    expectedOperation: 'Find What Matters In The Field',
    expectedLens: 'open_up',
    expectedRole: 'processing',
    expectedCardCount: 2,
  },
]

for (const fixture of authoredTranslateFixtures) {
  const result = recommendChargeMetabolismMove({
    sourceSurface: 'allyship_deck',
    present: fixture.present,
    desired: fixture.desired,
    blocker: fixture.blocker,
  })

  assert.strictEqual(result.vectorStatus, 'full', `${fixture.name}: vector resolves`)
  assert.strictEqual(result.routeHandRecommendations.length, fixture.expectedCardCount, `${fixture.name}: card count`)
  assert.strictEqual(result.routeHandAttemptDrafts.length, fixture.expectedCardCount, `${fixture.name}: draft count`)
  assert.deepStrictEqual(
    result.routes[0].moves.map((move) => move.vector),
    fixture.expectedRoute,
    `${fixture.name}: route`,
  )

  const translateRecommendation = result.routeHandRecommendations.find((recommendation) =>
    recommendation.edge.vector === fixture.expectedTranslateVector
  )
  assert.ok(translateRecommendation, `${fixture.name}: translate recommendation exists`)
  assert.strictEqual(translateRecommendation.mechanicOperation?.title, fixture.expectedOperation, `${fixture.name}: operation`)
  assert.strictEqual(translateRecommendation.selectedPracticeLens, fixture.expectedLens, `${fixture.name}: lens`)
  assert.strictEqual(translateRecommendation.selectedPracticeVariant?.role, fixture.expectedRole, `${fixture.name}: role`)
  assert.ok(translateRecommendation.selectedPracticeVariant?.prompt.trim(), `${fixture.name}: selected variant prompt`)
  assert.ok(translateRecommendation.selectedPracticeVariant?.output.trim(), `${fixture.name}: selected variant output`)

  const translateDraft = result.routeHandAttemptDrafts.find((draft) =>
    draft.translationSnapshot?.stateVector === fixture.expectedTranslateVector
  )
  assert.ok(translateDraft, `${fixture.name}: translate draft exists`)
  assert.strictEqual(translateDraft.mechanicOperationSnapshot?.title, fixture.expectedOperation, `${fixture.name}: draft operation`)
  assert.strictEqual(translateDraft.selectedPracticeLens, fixture.expectedLens, `${fixture.name}: draft lens`)
  assert.strictEqual(translateDraft.selectedPracticeVariant?.role, fixture.expectedRole, `${fixture.name}: draft role`)
}

const careInJoyLensVariants = [
  {
    blocker: 'I do not know why this good thing makes me sad.',
    expectedLens: 'wake_up',
    expectedRole: 'processing',
  },
  {
    blocker: 'I cannot let myself receive the care in this.',
    expectedLens: 'open_up',
    expectedRole: 'processing',
  },
  {
    blocker: 'I think needing this means I am weak.',
    expectedLens: 'clean_up',
    expectedRole: 'processing',
  },
  {
    blocker: 'I need to honor this without clinging.',
    expectedLens: 'grow_up',
    expectedRole: 'bridge',
  },
  {
    blocker: 'I know what this means and need to make contact.',
    expectedLens: 'show_up',
    expectedRole: 'action',
  },
] as const

for (const variant of careInJoyLensVariants) {
  const result = recommendChargeMetabolismMove({
    sourceSurface: 'allyship_deck',
    present: { channel: 'joy', altitude: 'neutral' },
    desired: { channel: 'sadness', altitude: 'satisfied' },
    blocker: variant.blocker,
  })
  const translateRecommendation = result.routeHandRecommendations[0]

  assert.strictEqual(translateRecommendation.edge.vector, 'joy:neutral->sadness:neutral')
  assert.strictEqual(translateRecommendation.mechanicOperation?.title, 'Find The Care In The Joy')
  assert.strictEqual(translateRecommendation.selectedPracticeLens, variant.expectedLens)
  assert.strictEqual(translateRecommendation.selectedPracticeVariant?.role, variant.expectedRole)
}

console.log('Golden story fixture tests passed')
