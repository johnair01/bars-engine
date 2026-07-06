import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import type { ToolOutputKind } from '@/lib/alchemy/tool-registry'
import { DOMAINS, MOVES, OPERATIONS } from './move-library'
import type { DeckPracticeRecommendation, DeckPracticeRecommendationInput } from './practice-recommendations'
import type { MoveCard } from './types'

export type DeckPracticeCopyVersion = 'deck-practice-copy-v0'

export type SatisfactionSpirit = 'peace' | 'triumph' | 'poignance' | 'bliss' | 'wonder'

export type PracticeCopyReviewFlag =
  | 'missing_vector'
  | 'missing_blocker_context'
  | 'next_tier_tool'
  | 'internal_show_up'
  | 'external_show_up'

export interface DeckPracticeStepCopy {
  n: number
  instruction: string
  expectedOutput: string
}

export interface DeckPracticeCopy {
  version: DeckPracticeCopyVersion
  cardId: string
  mode: DeckPracticeRecommendationInput['mode']
  orientation: DeckPracticeRecommendationInput['orientation']
  subject: DeckPracticeRecommendationInput['subject']
  satisfactionSpirit: SatisfactionSpirit | null
  playerSituationSummary: string
  emotionalVector: string | null
  whyThisTool: string
  protocolIntro: string
  stepCopy: DeckPracticeStepCopy[]
  expectedOutputKinds: ToolOutputKind[]
  expectedOutput: string
  completionCriteria: string[]
  saveOrShareSummary: string
  reviewFlags: PracticeCopyReviewFlag[]
}

function labelMove(move: MoveCard['move']): string {
  return MOVES.find((item) => item.key === move)?.label ?? move
}

function labelOperation(operation: MoveCard['operation']): string {
  return OPERATIONS.find((item) => item.key === operation)?.label ?? operation
}

function labelDomain(domain: MoveCard['domain']): string {
  return DOMAINS.find((item) => item.key === domain)?.label ?? domain
}

export function inferSatisfactionSpirit(desired?: AlchemyState): SatisfactionSpirit | null {
  if (!desired || desired.altitude !== 'satisfied') return null
  if (desired.channel === 'anger') return 'triumph'
  if (desired.channel === 'sadness') return 'poignance'
  if (desired.channel === 'joy') return 'bliss'
  if (desired.channel === 'neutrality') return 'peace'
  if (desired.channel === 'fear') return 'wonder'
  return null
}

function describeVector(present?: AlchemyState, desired?: AlchemyState): string | null {
  if (!present || !desired) return null
  return `${present.channel}:${present.altitude} -> ${desired.channel}:${desired.altitude}`
}

function describeContext(input: DeckPracticeRecommendationInput): string {
  const card = input.card
  const cardFrame = `${card.title} asks for ${labelMove(card.move)} through ${labelOperation(card.operation)} in ${labelDomain(card.domain)}`
  const blocker = input.blocker?.trim()
  const story = input.story?.trim()

  if (blocker && story) return `${cardFrame}. The named blocker is "${blocker}" and the story is "${story}".`
  if (blocker) return `${cardFrame}. The named blocker is "${blocker}".`
  if (story) return `${cardFrame}. The story being tested is "${story}".`
  return `${cardFrame}.`
}

function describeOutput(kinds: ToolOutputKind[]): string {
  if (
    kinds.includes('next_action') &&
    kinds.includes('quest_seed') &&
    kinds.includes('internal_commitment') &&
    kinds.includes('bar_reflection')
  ) {
    return 'A tiny game card with a next action, quest seed, internal commitment, and BAR-ready reflection.'
  }
  if (kinds.includes('felt_handle')) return 'A felt handle: a phrase, image, sensation, or memory that fits the charge.'
  if (kinds.includes('part_dialogue')) return 'A named part, a first-person quote from it, and one owned clean-energy sentence.'
  if (kinds.includes('belief_reframe')) return 'A blocker belief, its cost, and one testable replacement.'
  if (kinds.includes('field_map')) return 'A visible map of the situation with one work location circled.'
  if (kinds.includes('clean_line')) return 'A clean ask, boundary, offer, repair line, or internal line.'
  if (kinds.includes('bar_reflection')) return 'A BAR-ready reflection that names charge, desired satisfaction, and next artifact.'
  if (kinds.includes('ritual_artifact')) return 'A small ritual artifact or symbolic action with an integration note.'
  if (kinds.includes('appreciation_scan')) return 'Three specific goods that are real without pretending they fix everything.'
  if (kinds.includes('regulation_signal')) return 'A before/after regulation signal and the next available cue.'
  if (kinds.includes('next_action')) return 'One next action that can be done, scheduled, delegated, or consciously declined.'
  if (kinds.includes('internal_commitment')) return 'An internal commitment that can be held or practiced today.'
  if (kinds.includes('quest_seed')) return 'A quest seed that can become future action.'
  return 'One inspectable practice artifact.'
}

function describeToolReason(recommendation: DeckPracticeRecommendation): string {
  const firstUsefulReason = recommendation.reasons.find(
    (reason) => !reason.startsWith('card operation lens:') && !reason.startsWith('next-tier tool held'),
  )
  const reasonSuffix = firstUsefulReason ? ` The strongest reason is: ${firstUsefulReason}.` : ''
  return `${recommendation.selectedTool.barsName} is the recommended tool because its protocol can produce ${describeOutput(recommendation.expectedOutputKinds).toLowerCase()}${reasonSuffix}`
}

function buildProtocolIntro(input: DeckPracticeRecommendationInput, recommendation: DeckPracticeRecommendation, spirit: SatisfactionSpirit | null): string {
  const lens = recommendation.selectedPracticeLens.replace('_', ' ')
  const spiritPhrase = spirit ? ` in the spirit of ${spirit}` : ''
  if (input.mode === 'quick') {
    return `Use this as a ${lens} rep${spiritPhrase}: complete the tool far enough to create the output, then stop.`
  }
  return `Use this as the first ${lens} rep${spiritPhrase}: work the charge until the output exists, then decide whether another card or tool is needed.`
}

function buildSaveSummary(input: DeckPracticeRecommendationInput, recommendation: DeckPracticeRecommendation, vector: string | null, spirit: SatisfactionSpirit | null): string {
  const vectorPhrase = vector ? ` while moving ${vector}` : ''
  const spiritPhrase = spirit ? ` toward ${spirit}` : ''
  return `I worked ${input.card.id} with ${recommendation.selectedTool.barsName}${vectorPhrase}${spiritPhrase} and produced: ${describeOutput(recommendation.expectedOutputKinds)}`
}

function buildReviewFlags(input: DeckPracticeRecommendationInput, recommendation: DeckPracticeRecommendation): PracticeCopyReviewFlag[] {
  const flags: PracticeCopyReviewFlag[] = []
  if (!input.present || !input.desired) flags.push('missing_vector')
  if (!input.blocker?.trim() && !input.story?.trim()) flags.push('missing_blocker_context')
  if (recommendation.selectedTool.tier === 'next') flags.push('next_tier_tool')
  if (input.orientation === 'internal' && recommendation.selectedPracticeLens === 'show_up') flags.push('internal_show_up')
  if (input.orientation === 'external' && recommendation.selectedPracticeLens === 'show_up') flags.push('external_show_up')
  return flags
}

export function composeDeckPracticeCopy(
  input: DeckPracticeRecommendationInput,
  recommendation: DeckPracticeRecommendation,
  satisfactionSpirit: SatisfactionSpirit | null = inferSatisfactionSpirit(input.desired),
): DeckPracticeCopy {
  const vector = describeVector(input.present, input.desired)

  return {
    version: 'deck-practice-copy-v0',
    cardId: input.card.id,
    mode: input.mode,
    orientation: input.orientation,
    subject: input.subject,
    satisfactionSpirit,
    playerSituationSummary: describeContext(input),
    emotionalVector: vector,
    whyThisTool: describeToolReason(recommendation),
    protocolIntro: buildProtocolIntro(input, recommendation, satisfactionSpirit),
    stepCopy: recommendation.protocol.map((step, index) => ({
      n: index + 1,
      instruction: step.prompt,
      expectedOutput: step.output,
    })),
    expectedOutputKinds: recommendation.expectedOutputKinds,
    expectedOutput: describeOutput(recommendation.expectedOutputKinds),
    completionCriteria: recommendation.completionCriteria,
    saveOrShareSummary: buildSaveSummary(input, recommendation, vector, satisfactionSpirit),
    reviewFlags: buildReviewFlags(input, recommendation),
  }
}
