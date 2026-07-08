import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import type {
  EmotionalAlchemyToolId,
  ToolOutputKind,
  ToolRating,
} from '@/lib/alchemy/tool-registry'
import { composeDeckPracticeCopy, type DeckPracticeCopy, type SatisfactionSpirit } from './practice-copy'
import { recommendDeckCardPractice, type DeckPracticeRecommendationInput } from './practice-recommendations'
import { getDeckCardToolAffinities } from './tool-affinities'
import { getMoveCardById } from './assemble'
import { DOMAINS, MOVES, OPERATIONS } from './move-library'
import type { AllyshipDomain, BasicMove, MoveCard, Operation, OutputBar } from './types'

export type CardPracticeOverlayStatus = 'pilot' | 'reviewed' | 'needs_tuning' | 'blocked'

export type CardPracticeOverlayReviewFlag =
  | 'missing_vector'
  | 'missing_blocker_context'
  | 'next_tier_tool'
  | 'internal_show_up'
  | 'external_show_up'
  | 'no_quick_example'
  | 'same_tool_collapse'
  | 'joy_bliss_sample'
  | 'operation_protocol_modifier_gap'

export type CardPracticeOverlayBlockerShape =
  | 'body_unclear_signal'
  | 'field_confusion'
  | 'belief_story'
  | 'part_projection'
  | 'capture_artifact'
  | 'care_distance'
  | 'commitment_practice'
  | 'action_pressure'
  | 'joy_trust'

export interface CardPracticeOverlayPreferredTool {
  toolId: EmotionalAlchemyToolId
  rating: ToolRating
  reasons: string[]
}

export interface CardPracticeOverlaySampleVector {
  blockerShape: CardPracticeOverlayBlockerShape
  present: AlchemyState
  desired: AlchemyState
  satisfactionSpirit: SatisfactionSpirit
  mode: 'deep'
  expectedFirstToolId: EmotionalAlchemyToolId
  topCandidateToolIds: EmotionalAlchemyToolId[]
}

export interface CardPracticeOverlay {
  version: 'card-practice-overlay-v0'
  cardId: string
  cardTitle: string
  stableCardLens: {
    move: BasicMove
    operation: Operation
    domain: AllyshipDomain
    outputBar: OutputBar
  }
  defaultPracticeIntention: string
  preferredTools: CardPracticeOverlayPreferredTool[]
  sampleVectors: CardPracticeOverlaySampleVector[]
  quickPracticeExample: DeckPracticeCopy | null
  deepPracticeExamples: DeckPracticeCopy[]
  outputPossibilities: ToolOutputKind[]
  reviewFlags: CardPracticeOverlayReviewFlag[]
  reviewStatus: CardPracticeOverlayStatus
}

export const PILOT_CARD_PRACTICE_OVERLAY_IDS = [
  'WAKE-GR-SHAMAN',
  'WAKE-SO-ARCHITECT',
  'OPEN-GR-CHALLENGER',
  'OPEN-GR-DIPLOMAT',
  'CLEAN-RA-SAGE',
  'CLEAN-DA-CHALLENGER',
  'GROW-SO-REGENT',
  'GROW-RA-SAGE',
  'SHOW-DA-CHALLENGER',
  'SHOW-SO-ARCHITECT',
] as const

function labelMove(move: MoveCard['move']): string {
  return MOVES.find((item) => item.key === move)?.label ?? move
}

function labelOperation(operation: MoveCard['operation']): string {
  return OPERATIONS.find((item) => item.key === operation)?.label ?? operation
}

function labelDomain(domain: MoveCard['domain']): string {
  return DOMAINS.find((item) => item.key === domain)?.label ?? domain
}

function satisfactionSpiritFor(desired: AlchemyState): SatisfactionSpirit {
  if (desired.channel === 'anger') return 'triumph'
  if (desired.channel === 'sadness') return 'poignance'
  if (desired.channel === 'joy') return 'bliss'
  if (desired.channel === 'neutrality') return 'peace'
  return 'wonder'
}

function sampleStates(channel: AlchemyState['channel']): { present: AlchemyState; desired: AlchemyState; satisfactionSpirit: SatisfactionSpirit } {
  const desired: AlchemyState = { channel, altitude: 'satisfied' }
  return {
    present: { channel, altitude: 'dissatisfied' },
    desired,
    satisfactionSpirit: satisfactionSpiritFor(desired),
  }
}

interface DiagnosticPracticeSampleSpec {
  channel: AlchemyState['channel']
  blockerShape: CardPracticeOverlayBlockerShape
  blocker: string
}

function diagnosticSampleSpecsForCard(card: MoveCard): DiagnosticPracticeSampleSpec[] {
  if (card.move === 'wake_up') {
    return [
      { channel: 'fear', blockerShape: 'body_unclear_signal', blocker: 'My body feels tight and the signal is unclear.' },
      { channel: 'neutrality', blockerShape: 'field_confusion', blocker: 'The field is confusing: roles, resources, facts, and sequence are unclear.' },
      { channel: 'fear', blockerShape: 'part_projection', blocker: 'A triggered part is projecting danger onto the situation.' },
      { channel: 'neutrality', blockerShape: 'capture_artifact', blocker: 'I need to capture the current charge, desired satisfaction, and blocker as an awareness artifact.' },
    ]
  }

  if (card.id === 'CLEAN-RA-SAGE') {
    return [
      { channel: 'anger', blockerShape: 'belief_story', blocker: 'I believe this will fail unless I force it.' },
      { channel: 'fear', blockerShape: 'field_confusion', blocker: 'The field is confusing: roles, resources, facts, and sequence are unclear.' },
      { channel: 'sadness', blockerShape: 'part_projection', blocker: 'A triggered part wants to disappear before the care can be named.' },
      { channel: 'neutrality', blockerShape: 'capture_artifact', blocker: 'I need to capture the current charge, desired satisfaction, and insight as a reflection artifact.' },
      { channel: 'joy', blockerShape: 'joy_trust', blocker: 'The joy feels hard to trust or let all the way in.' },
    ]
  }

  if (card.move === 'clean_up') {
    return [
      { channel: 'anger', blockerShape: 'belief_story', blocker: 'I believe this will fail unless I force it.' },
      { channel: 'fear', blockerShape: 'field_confusion', blocker: 'The field is confusing: roles, resources, facts, and sequence are unclear.' },
      { channel: 'sadness', blockerShape: 'part_projection', blocker: 'A triggered part wants to disappear before the care can be named.' },
      { channel: 'neutrality', blockerShape: 'body_unclear_signal', blocker: 'My body feels tight and the signal is unclear.' },
      { channel: 'neutrality', blockerShape: 'capture_artifact', blocker: 'I need to capture the current charge, desired satisfaction, and insight as a reflection artifact.' },
    ]
  }

  if (card.move === 'open_up') {
    return [{ channel: 'sadness', blockerShape: 'care_distance', blocker: `I feel the distance from what I care about in ${labelDomain(card.domain)}.` }]
  }

  if (card.move === 'grow_up') {
    return [
      { channel: 'neutrality', blockerShape: 'commitment_practice', blocker: 'I want steadiness, but I need to choose one practice commitment I can actually keep.' },
      { channel: 'sadness', blockerShape: 'part_projection', blocker: 'A part of me is holding responsibility alone and needs to speak.' },
    ]
  }

  return [{ channel: 'anger', blockerShape: 'action_pressure', blocker: 'I want to act, but the story says I have to force it to matter.' }]
}

function quickBlockerFor(card: MoveCard): string | null {
  if (card.move === 'wake_up') return null
  if (card.move === 'clean_up') return null
  if (card.move === 'open_up' && card.domain === 'GATHERING_RESOURCES') {
    return 'I need to ask for help without overexplaining.'
  }
  if (card.move === 'grow_up') {
    return 'I need to choose one practice commitment I can actually keep.'
  }
  if (card.move === 'show_up' && card.domain === 'DIRECT_ACTION') {
    return 'I need to make the next move without making it bigger than it is.'
  }
  if (card.move === 'show_up' && card.domain === 'SKILLFUL_ORGANIZING') {
    return 'I need to turn this into one clear artifact or coordination step.'
  }
  return null
}

function composePractice(input: DeckPracticeRecommendationInput): DeckPracticeCopy {
  const recommendation = recommendDeckCardPractice(input)
  return composeDeckPracticeCopy(input, recommendation)
}

function buildQuickPracticeExample(card: MoveCard): DeckPracticeCopy | null {
  const blocker = quickBlockerFor(card)
  if (!blocker) return null

  return composePractice({
    card,
    mode: 'quick',
    orientation: card.move === 'grow_up' ? 'internal' : 'external',
    subject: card.domain === 'SKILLFUL_ORGANIZING' || card.domain === 'DIRECT_ACTION' ? 'collective' : 'other',
    blocker,
  })
}

function recommendationInputForDeepSample(card: MoveCard, sample: DiagnosticPracticeSampleSpec): DeckPracticeRecommendationInput {
  const states = sampleStates(sample.channel)
  return {
    card,
    mode: 'deep',
    orientation: card.move === 'show_up' ? 'external' : 'internal',
    subject: card.domain === 'DIRECT_ACTION' || card.domain === 'SKILLFUL_ORGANIZING' ? 'collective' : 'self',
    present: states.present,
    desired: states.desired,
    blocker: sample.blocker,
  }
}

function buildDeepPracticeExample(card: MoveCard, sample: DiagnosticPracticeSampleSpec): DeckPracticeCopy {
  return composePractice(recommendationInputForDeepSample(card, sample))
}

function buildSampleVector(card: MoveCard, sample: DiagnosticPracticeSampleSpec): CardPracticeOverlaySampleVector {
  const states = sampleStates(sample.channel)
  const recommendation = recommendDeckCardPractice(recommendationInputForDeepSample(card, sample))

  return {
    blockerShape: sample.blockerShape,
    ...states,
    mode: 'deep' as const,
    expectedFirstToolId: recommendation.selectedTool.id,
    topCandidateToolIds: recommendation.rankedTools.slice(0, 5).map((ranked) => ranked.tool.id),
  }
}

function uniqueOutputKinds(examples: DeckPracticeCopy[]): ToolOutputKind[] {
  return Array.from(new Set(examples.flatMap((example) => example.expectedOutputKinds)))
}

function aggregateReviewFlags(card: MoveCard, quick: DeckPracticeCopy | null, deepExamples: DeckPracticeCopy[]): CardPracticeOverlayReviewFlag[] {
  const flags = new Set<CardPracticeOverlayReviewFlag>()
  const examples = [quick, ...deepExamples].filter(Boolean) as DeckPracticeCopy[]

  for (const example of examples) {
    for (const flag of example.reviewFlags) flags.add(flag)
    if (example.satisfactionSpirit === 'bliss') flags.add('joy_bliss_sample')
  }

  if (!quick) flags.add('no_quick_example')
  if (deepExamples.length > 1 && new Set(deepExamples.map((example) => example.whyThisTool.split(' is the recommended tool')[0])).size === 1) {
    flags.add('same_tool_collapse')
  }
  if (card.operation) flags.add('operation_protocol_modifier_gap')

  return Array.from(flags)
}

function reviewStatusFor(flags: CardPracticeOverlayReviewFlag[]): CardPracticeOverlayStatus {
  if (flags.includes('same_tool_collapse')) return 'needs_tuning'
  if (flags.includes('next_tier_tool')) return 'needs_tuning'
  return 'pilot'
}

export function buildCardPracticeOverlay(cardId: string): CardPracticeOverlay {
  const card = getMoveCardById(cardId)
  if (!card) throw new Error(`Cannot build practice overlay: move card ${cardId} was not found`)

  const preferredTools = getDeckCardToolAffinities(card)
    .slice(0, 3)
    .map((affinity) => ({
      toolId: affinity.toolId,
      rating: affinity.rating,
      reasons: affinity.reasons,
    }))

  const samples = diagnosticSampleSpecsForCard(card)
  const deepPracticeExamples = samples.map((sample) => buildDeepPracticeExample(card, sample))
  const sampleVectors = samples.map((sample) => buildSampleVector(card, sample))
  const quickPracticeExample = buildQuickPracticeExample(card)
  const reviewFlags = aggregateReviewFlags(card, quickPracticeExample, deepPracticeExamples)

  return {
    version: 'card-practice-overlay-v0',
    cardId: card.id,
    cardTitle: card.title,
    stableCardLens: {
      move: card.move,
      operation: card.operation,
      domain: card.domain,
      outputBar: card.outputBar,
    },
    defaultPracticeIntention: `Practice ${labelMove(card.move)} through ${labelOperation(card.operation)} in ${labelDomain(card.domain)} by producing a ${card.outputBar}-shaped artifact.`,
    preferredTools,
    sampleVectors,
    quickPracticeExample,
    deepPracticeExamples,
    outputPossibilities: uniqueOutputKinds([quickPracticeExample, ...deepPracticeExamples].filter(Boolean) as DeckPracticeCopy[]),
    reviewFlags,
    reviewStatus: reviewStatusFor(reviewFlags),
  }
}

export function buildPilotCardPracticeOverlays(): CardPracticeOverlay[] {
  return PILOT_CARD_PRACTICE_OVERLAY_IDS.map((cardId) => buildCardPracticeOverlay(cardId))
}

export function getCardPracticeOverlay(cardId: string): CardPracticeOverlay | null {
  if (!PILOT_CARD_PRACTICE_OVERLAY_IDS.includes(cardId as (typeof PILOT_CARD_PRACTICE_OVERLAY_IDS)[number])) {
    return null
  }
  return buildCardPracticeOverlay(cardId)
}
