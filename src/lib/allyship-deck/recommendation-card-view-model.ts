import { DOMAIN_LABELS, MOVE_LABELS, OPERATION_LABELS } from '@/lib/allyship-deck/card-visuals'
import type { MoveCard } from '@/lib/allyship-deck/types'
import type { ShowUpRecommendation } from '@/lib/alchemy/show-up-primitives'
import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import type { CardSubject } from '@/components/deck/AllyshipCard'
import type { MoveAttemptDraft, MoveRecommendationRole } from '@/lib/charge-metabolism/types'

export type RecommendationSaveTargetId = 'move_attempt' | 'bar_reflection' | 'share_card'

export interface RecommendationSaveTarget {
  id: RecommendationSaveTargetId
  label: string
  enabled: boolean
}

export interface RecommendationCardViewModel {
  id: string
  kicker: string
  title: string
  whyThisCard: string
  vectorLabel: string
  blockerLabel: string
  protocolSteps: string[]
  tracePrompt: string
  completionLabel: string
  saveTargets: RecommendationSaveTarget[]
}

export function recommendationRoleLabel(role: MoveRecommendationRole): string {
  if (role === 'single') return 'practice'
  if (role === 'satisfaction') return 'transcend'
  return role
}

export function formatAlchemyState(state: AlchemyState): string {
  if (state.altitude === 'satisfied') return satisfiedLabelFor(state.channel)
  if (state.altitude === 'neutral') return cleanChannelLabel(state.channel)
  return dissatisfiedLabelFor(state.channel)
}

export function buildRecommendationCardViewModel(input: {
  card: MoveCard
  subject: CardSubject
  recommendation: ShowUpRecommendation
  role: MoveRecommendationRole
  attemptDraft?: MoveAttemptDraft | null
}): RecommendationCardViewModel {
  const move = input.recommendation.move
  const present = input.attemptDraft?.vectorSnapshot?.present ?? input.recommendation.edge.from
  const desired = input.attemptDraft?.vectorSnapshot?.desired ?? input.recommendation.edge.to
  const blocker = input.attemptDraft?.vectorSnapshot?.blocker ?? move.blocker
  const roleLabel = recommendationRoleLabel(input.role)

  return {
    id: `${input.card.id}:${move.stateVector}:${roleLabel}`,
    kicker: roleLabel,
    title: move.title,
    whyThisCard: whyThisCard(input.card, input.subject, input.recommendation),
    vectorLabel: `${formatAlchemyState(present)} -> ${formatAlchemyState(desired)}`,
    blockerLabel: blockerLabelFor(blocker),
    protocolSteps: protocolStepsFor(input.card, input.recommendation),
    tracePrompt: tracePromptFor(input.recommendation),
    completionLabel: move.completion,
    saveTargets: [
      { id: 'move_attempt', label: 'Save move attempt', enabled: false },
      { id: 'bar_reflection', label: 'Save as BAR reflection', enabled: false },
      { id: 'share_card', label: 'Share card image', enabled: false },
    ],
  }
}

function whyThisCard(card: MoveCard, subject: CardSubject, recommendation: ShowUpRecommendation): string {
  const moveLabel = MOVE_LABELS[card.move]
  const domainLabel = DOMAIN_LABELS[card.domain]
  const operationLabel = OPERATION_LABELS[card.operation]
  const subjectLabel = subject === 'campaign' ? 'collective work' : 'your own practice'
  return `${moveLabel} in ${domainLabel}, through the ${operationLabel} face, turns this into ${subjectLabel}: ${recommendation.move.domainOutput}.`
}

function protocolStepsFor(card: MoveCard, recommendation: ShowUpRecommendation): string[] {
  const move = recommendation.move
  const primitive = recommendation.primitiveMatch.primitive
  const steps = [
    `Name the charge: ${move.vectorMechanic}`,
    `Use the card lens: ${MOVE_LABELS[card.move]} in ${DOMAIN_LABELS[card.domain]}.`,
    move.instruction,
    `Make it inspectable: ${primitive.completionLogic}`,
  ]

  if (recommendation.mechanicOperation?.steps.length) {
    steps.splice(2, 0, ...recommendation.mechanicOperation.steps)
  }

  return steps.filter(Boolean).slice(0, 5)
}

function tracePromptFor(recommendation: ShowUpRecommendation): string {
  const move = recommendation.move
  return `Leave one trace: ${move.completion}`
}

function blockerLabelFor(blocker: string): string {
  const trimmed = blocker.trim()
  if (!trimmed || trimmed === 'The blocker has not been named yet.') {
    return 'No blocker named yet; work from the vector and the card.'
  }
  return trimmed
}

function cleanChannelLabel(channel: AlchemyState['channel']): string {
  if (channel === 'neutrality') return 'Clean Neutrality'
  return `Clean ${capitalize(channel)}`
}

function dissatisfiedLabelFor(channel: AlchemyState['channel']): string {
  const labels: Record<AlchemyState['channel'], string> = {
    anger: 'Frustration',
    sadness: 'Depression',
    fear: 'Anxiety',
    joy: 'Restlessness',
    neutrality: 'Numbness',
  }
  return labels[channel]
}

function satisfiedLabelFor(channel: AlchemyState['channel']): string {
  const labels: Record<AlchemyState['channel'], string> = {
    anger: 'Triumph',
    sadness: 'Poignance',
    fear: 'Excitement',
    joy: 'Bliss',
    neutrality: 'Peace',
  }
  return labels[channel]
}

function capitalize(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1)
}
