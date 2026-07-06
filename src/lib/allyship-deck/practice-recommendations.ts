import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import {
  allEmotionalAlchemyTools,
  EMOTIONAL_ALCHEMY_TOOLS,
  TOOL_RATING_SCORE,
  type EmotionalAlchemyMoveRole,
  type EmotionalAlchemyTool,
  type EmotionalAlchemyToolId,
  type ToolOutputKind,
  type ToolProtocolStep,
  type ToolRating,
} from '@/lib/alchemy/tool-registry'
import type { VectorMovePracticeLens } from '@/lib/alchemy/vector-move-families'
import { DOMAINS, MOVES, OPERATIONS } from './move-library'
import type { MoveCard } from './types'
import { getDeckCardToolAffinities } from './tool-affinities'

export type DeckPracticeMode = 'quick' | 'deep'
export type DeckPracticeOrientation = 'internal' | 'external'
export type DeckPracticeSubject = 'self' | 'other' | 'collective'

export interface DeckPracticeRecommendationInput {
  card: MoveCard
  mode: DeckPracticeMode
  orientation: DeckPracticeOrientation
  subject: DeckPracticeSubject
  present?: AlchemyState
  desired?: AlchemyState
  blocker?: string
  story?: string
  selectedToolId?: EmotionalAlchemyToolId
}

export interface DeckPracticeRankedTool {
  tool: EmotionalAlchemyTool
  score: number
  reasons: string[]
}

export interface DeckPracticeRecommendation {
  selectedTool: EmotionalAlchemyTool
  rankedTools: DeckPracticeRankedTool[]
  reasons: string[]
  selectedPracticeLens: VectorMovePracticeLens
  expectedOutputKinds: ToolOutputKind[]
  protocol: ToolProtocolStep[]
  completionCriteria: string[]
  summary: string
}

const VECTOR_SCORE: Record<'strong' | 'medium' | 'weak', number> = {
  strong: 100,
  medium: 60,
  weak: 20,
}

const MODE_FIT_SCORE = 15
const BLOCKER_HINT_SCORE = 20
const NEXT_TIER_PENALTY = 12
const CARD_MOVE_SCORE: Record<Exclude<ToolRating, 'not_recommended'>, number> = {
  strong: 10,
  medium: 6,
  weak: 2,
}
const CARD_OPERATION_SCORE: Record<Exclude<ToolRating, 'not_recommended'>, number> = {
  strong: 8,
  medium: 5,
  weak: 1,
}
const CARD_DOMAIN_SCORE: Record<Exclude<ToolRating, 'not_recommended'>, number> = {
  strong: 6,
  medium: 3,
  weak: 1,
}
const OUTPUT_BAR_SCORE: Record<Exclude<ToolRating, 'not_recommended'>, number> = {
  strong: 4,
  medium: 2,
  weak: 1,
}

const QUICK_OUTPUT_KINDS: ToolOutputKind[] = [
  'clean_line',
  'next_action',
  'field_map',
  'ritual_artifact',
  'quest_seed',
  'internal_commitment',
]

const HINT_GROUPS: Array<{
  toolIds: EmotionalAlchemyToolId[]
  patterns: RegExp[]
  reason: string
}> = [
  {
    toolIds: ['story_turnaround'],
    patterns: [/\bbelief\b/i, /\bstory\b/i, /\bshame\b/i, /not enough/i, /\bunworthy\b/i, /\bfail\b/i, /\bperfect\b/i],
    reason: 'blocker/story hints at belief work',
  },
  {
    toolIds: ['clean_line'],
    patterns: [/\bask\b/i, /\bboundary\b/i, /\bno\b/i, /\brecipient\b/i, /\bmessage\b/i],
    reason: 'blocker/story hints at an ask or boundary',
  },
  {
    toolIds: ['put_it_on_the_board'],
    patterns: [/\bunclear\b/i, /\bmap\b/i, /\broles\b/i, /\bresources\b/i, /\bsequence\b/i],
    reason: 'blocker/story hints at mapping the field',
  },
  {
    toolIds: ['make_it_a_game'],
    patterns: [
      /\bfun\b/i,
      /\benjoyable\b/i,
      /\bdead\b/i,
      /\balive\b/i,
      /\baliveness\b/i,
      /\bplay\b/i,
      /\bgame\b/i,
      /\bchallenge\b/i,
      /too many (options|possibilities|paths)/i,
      /\boverpromise\b/i,
      /\binspired\b/i,
      /\bexciting\b/i,
    ],
    reason: 'blocker/story hints at play, aliveness, or a bounded game',
  },
  {
    toolIds: ['bar_capture'],
    patterns: [/\bcapture\b/i, /\blog\b/i, /\bjournal\b/i, /\breflection\b/i, /\bartifact\b/i],
    reason: 'blocker/story hints at reflective capture',
  },
  {
    toolIds: ['felt_thread', 'return_to_body'],
    patterns: [/\bbody\b/i, /\bfelt\b/i, /\bnumb\b/i, /\bheavy\b/i, /\btight\b/i],
    reason: 'blocker/story hints at body or felt-sense work',
  },
  {
    toolIds: ['charge_dialogue_321'],
    patterns: [/\bpart\b/i, /\bshadow\b/i, /\bprojection\b/i, /\btrigger\b/i],
    reason: 'blocker/story hints at part dialogue',
  },
]

function ratingScore(rating: ToolRating | undefined, scoreTable: Record<Exclude<ToolRating, 'not_recommended'>, number>): number {
  if (!rating || rating === 'not_recommended') return 0
  return scoreTable[rating]
}

function ratingReason(rating: ToolRating | undefined, label: string): string | null {
  if (!rating || rating === 'not_recommended') return null
  return `${rating} ${label} fit`
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

function inferPracticeLens(input: DeckPracticeRecommendationInput): VectorMovePracticeLens {
  if (input.mode === 'quick') return 'show_up'
  if (input.present?.altitude === 'dissatisfied') return 'clean_up'
  if (input.present?.altitude === 'neutral' && input.desired?.altitude === 'neutral') return 'clean_up'
  if (input.desired?.altitude === 'satisfied') return 'grow_up'
  return input.card.move
}

function inferRoles(present?: AlchemyState, desired?: AlchemyState): EmotionalAlchemyMoveRole[] {
  if (!present || !desired) return []
  if (present.altitude === 'dissatisfied' && desired.altitude === 'neutral') return ['metabolize']
  if (present.altitude === 'neutral' && desired.altitude === 'satisfied') return ['transcend']
  if (present.altitude === 'neutral' && desired.altitude === 'neutral' && present.channel !== desired.channel) return ['translate']
  if (present.altitude === 'dissatisfied' && desired.altitude === 'satisfied' && present.channel === desired.channel) {
    return ['metabolize', 'transcend']
  }
  if (present.channel !== desired.channel) return ['translate']
  return []
}

function vectorTier(tool: EmotionalAlchemyTool, roles: EmotionalAlchemyMoveRole[], present?: AlchemyState, desired?: AlchemyState): 'strong' | 'medium' | 'weak' | null {
  if (!present || !desired || roles.length === 0) return null
  const roleScores = roles.map((role) => TOOL_RATING_SCORE[tool.moveRoleRatings[role]])
  const channelScores = [tool.channelRatings[present.channel], tool.channelRatings[desired.channel]].map((rating) => TOOL_RATING_SCORE[rating])
  const roleMax = Math.max(...roleScores)
  const channelMax = Math.max(...channelScores)

  if (roleMax >= TOOL_RATING_SCORE.strong && channelMax >= TOOL_RATING_SCORE.strong) return 'strong'
  if (roleMax >= TOOL_RATING_SCORE.medium && channelMax >= TOOL_RATING_SCORE.medium) return 'medium'
  if (roleMax >= TOOL_RATING_SCORE.weak && channelMax >= TOOL_RATING_SCORE.weak) return 'weak'
  return null
}

function vectorReason(tier: 'strong' | 'medium' | 'weak', roles: EmotionalAlchemyMoveRole[], present: AlchemyState, desired: AlchemyState): string {
  return `${tier} vector fit for ${present.channel}:${present.altitude} -> ${desired.channel}:${desired.altitude} (${roles.join(' + ')})`
}

function blockerText(input: DeckPracticeRecommendationInput): string {
  return [input.blocker, input.story].filter(Boolean).join(' ')
}

function blockerHintScore(tool: EmotionalAlchemyTool, input: DeckPracticeRecommendationInput): { score: number; reason: string | null } {
  const text = blockerText(input)
  if (!text.trim()) return { score: 0, reason: null }
  for (const group of HINT_GROUPS) {
    if (!group.toolIds.includes(tool.id)) continue
    if (group.patterns.some((pattern) => pattern.test(text))) {
      return { score: BLOCKER_HINT_SCORE, reason: group.reason }
    }
  }
  return { score: 0, reason: null }
}

function modeFitScore(tool: EmotionalAlchemyTool, mode: DeckPracticeMode): { score: number; reason: string | null } {
  if (mode === 'quick') {
    const hasOutputFit = tool.outputKinds.some((kind) => QUICK_OUTPUT_KINDS.includes(kind))
    const waveFit = tool.waveRatings.show_up
    if (hasOutputFit && (waveFit === 'strong' || waveFit === 'medium')) {
      return { score: MODE_FIT_SCORE, reason: 'quick mode favors concrete Show Up outputs' }
    }
    return { score: 0, reason: null }
  }

  if (tool.waveRatings.clean_up === 'strong' || tool.waveRatings.open_up === 'strong' || tool.waveRatings.grow_up === 'strong') {
    return { score: MODE_FIT_SCORE, reason: 'deep mode favors charge-processing tools' }
  }
  return { score: 0, reason: null }
}

function scoreTool(tool: EmotionalAlchemyTool, input: DeckPracticeRecommendationInput): DeckPracticeRankedTool {
  const reasons: string[] = []
  let score = 0
  const roles = inferRoles(input.present, input.desired)

  if (tool.tier === 'next') {
    score -= NEXT_TIER_PENALTY
    reasons.push('next-tier tool held behind MVP tools unless fit is stronger')
  }

  if (input.present && input.desired) {
    const tier = vectorTier(tool, roles, input.present, input.desired)
    if (tier) {
      score += VECTOR_SCORE[tier]
      reasons.push(vectorReason(tier, roles, input.present, input.desired))
    }
  } else if (input.mode === 'deep') {
    reasons.push('vector data was not supplied')
  }

  const blockerHint = blockerHintScore(tool, input)
  score += blockerHint.score
  if (blockerHint.reason) reasons.push(blockerHint.reason)

  const modeFit = modeFitScore(tool, input.mode)
  score += modeFit.score
  if (modeFit.reason) reasons.push(modeFit.reason)

  const moveRating = tool.waveRatings[input.card.move]
  score += ratingScore(moveRating, CARD_MOVE_SCORE)
  const moveReason = ratingReason(moveRating, `${input.card.move} card move`)
  if (moveReason) reasons.push(moveReason)

  const operationRating = tool.operationAffinity[input.card.operation]
  score += ratingScore(operationRating, CARD_OPERATION_SCORE)
  const operationReason = ratingReason(operationRating, `${input.card.operation} operation`)
  if (operationReason) reasons.push(operationReason)

  const domainRating = tool.domainAffinity[input.card.domain]
  score += ratingScore(domainRating, CARD_DOMAIN_SCORE)
  const domainReason = ratingReason(domainRating, `${input.card.domain} domain`)
  if (domainReason) reasons.push(domainReason)

  const outputRating = tool.outputBarAffinity[input.card.outputBar]
  score += ratingScore(outputRating, OUTPUT_BAR_SCORE)
  const outputReason = ratingReason(outputRating, `${input.card.outputBar} BAR output`)
  if (outputReason) reasons.push(outputReason)

  return { tool, score, reasons }
}

function isValidToolId(value: string | undefined): value is EmotionalAlchemyToolId {
  return Boolean(value && EMOTIONAL_ALCHEMY_TOOLS[value as EmotionalAlchemyToolId])
}

function buildSummary(input: DeckPracticeRecommendationInput, selectedTool: EmotionalAlchemyTool): string {
  const vectorPhrase = input.present && input.desired ? 'Given this charge' : 'For this practice'
  return `This card is asking you to ${labelMove(input.card.move)} through ${labelOperation(input.card.operation)} in ${labelDomain(input.card.domain)}. ${vectorPhrase}, start with ${selectedTool.barsName}.`
}

export function recommendDeckCardPractice(input: DeckPracticeRecommendationInput): DeckPracticeRecommendation {
  const cardAffinities = getDeckCardToolAffinities(input.card)
  const cardAffinityReasons = new Map(cardAffinities.map((affinity) => [affinity.toolId, affinity.reasons]))
  const rankedTools = allEmotionalAlchemyTools()
    .map((tool) => {
      const ranked = scoreTool(tool, input)
      const affinityReasons = cardAffinityReasons.get(tool.id) ?? []
      return {
        ...ranked,
        reasons: Array.from(new Set([...ranked.reasons, ...affinityReasons])),
      }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.tool.barsName.localeCompare(b.tool.barsName)
    })

  let selected = rankedTools[0]
  const overrideReason: string[] = []
  if (input.selectedToolId) {
    if (isValidToolId(input.selectedToolId)) {
      const override = rankedTools.find((candidate) => candidate.tool.id === input.selectedToolId)
      if (override) {
        selected = { ...override, reasons: ['tool selected by player', ...override.reasons] }
        overrideReason.push('tool selected by player')
      }
    } else {
      overrideReason.push(`selected tool ${input.selectedToolId} was not found; using ranked recommendation`)
    }
  }

  const selectedPracticeLens = inferPracticeLens(input)
  const operationLensReason = `card operation lens: ${input.card.operation} operation`
  const reasons = Array.from(new Set([...overrideReason, operationLensReason, ...selected.reasons]))

  return {
    selectedTool: selected.tool,
    rankedTools,
    reasons,
    selectedPracticeLens,
    expectedOutputKinds: selected.tool.outputKinds,
    protocol: selected.tool.protocol,
    completionCriteria: selected.tool.completionCriteria,
    summary: buildSummary(input, selected.tool),
  }
}
