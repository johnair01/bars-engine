import {
  allEmotionalAlchemyTools,
  TOOL_RATING_SCORE,
  type EmotionalAlchemyTool,
  type EmotionalAlchemyToolId,
  type ToolRating,
} from '@/lib/alchemy/tool-registry'
import type { MoveCard } from './types'

export interface DeckCardToolAffinity {
  toolId: EmotionalAlchemyToolId
  tool: EmotionalAlchemyTool
  rating: ToolRating
  score: number
  reasons: string[]
  source: {
    move: MoveCard['move']
    operation: MoveCard['operation']
    domain: MoveCard['domain']
    outputBar: MoveCard['outputBar']
  }
}

const CARD_MOVE_WEIGHT = 10
const CARD_OPERATION_WEIGHT = 8
const CARD_DOMAIN_WEIGHT = 6
const OUTPUT_BAR_WEIGHT = 4

function ratingPoints(rating: ToolRating | undefined, weight: number): number {
  if (!rating || rating === 'not_recommended') return 0
  if (rating === 'strong') return weight
  if (rating === 'medium') return Math.ceil(weight * 0.6)
  return Math.max(1, Math.ceil(weight * 0.2))
}

function combineRatings(ratings: ToolRating[]): ToolRating {
  if (ratings.includes('strong')) return 'strong'
  if (ratings.includes('medium')) return 'medium'
  if (ratings.includes('weak')) return 'weak'
  return 'not_recommended'
}

function describeRating(rating: ToolRating, label: string): string {
  if (rating === 'not_recommended') return ''
  return `${rating} ${label} fit`
}

function scoreToolForCard(tool: EmotionalAlchemyTool, card: MoveCard): DeckCardToolAffinity {
  const moveRating = tool.waveRatings[card.move]
  const operationRating = tool.operationAffinity[card.operation]
  const domainRating = tool.domainAffinity[card.domain]
  const outputBarRating = tool.outputBarAffinity[card.outputBar]
  const ratings = [moveRating, operationRating, domainRating, outputBarRating].filter(Boolean) as ToolRating[]

  const reasons = [
    describeRating(moveRating, `${card.move} move`),
    operationRating ? describeRating(operationRating, `${card.operation} operation`) : '',
    domainRating ? describeRating(domainRating, `${card.domain} domain`) : '',
    outputBarRating ? describeRating(outputBarRating, `${card.outputBar} BAR`) : '',
  ].filter(Boolean)

  return {
    toolId: tool.id,
    tool,
    rating: combineRatings(ratings),
    score:
      ratingPoints(moveRating, CARD_MOVE_WEIGHT) +
      ratingPoints(operationRating, CARD_OPERATION_WEIGHT) +
      ratingPoints(domainRating, CARD_DOMAIN_WEIGHT) +
      ratingPoints(outputBarRating, OUTPUT_BAR_WEIGHT),
    reasons,
    source: {
      move: card.move,
      operation: card.operation,
      domain: card.domain,
      outputBar: card.outputBar,
    },
  }
}

export function getDeckCardToolAffinities(card: MoveCard): DeckCardToolAffinity[] {
  return allEmotionalAlchemyTools()
    .map((tool) => scoreToolForCard(tool, card))
    .filter((affinity) => affinity.score > 0 && affinity.rating !== 'not_recommended')
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const ratingDelta = TOOL_RATING_SCORE[b.rating] - TOOL_RATING_SCORE[a.rating]
      if (ratingDelta !== 0) return ratingDelta
      return a.tool.barsName.localeCompare(b.tool.barsName)
    })
}

export function validateDeckCardToolAffinities(cards: MoveCard[]): string[] {
  const errors: string[] = []
  for (const card of cards) {
    const affinities = getDeckCardToolAffinities(card)
    if (affinities.length < 2) {
      errors.push(`${card.id} has fewer than two viable tool affinities`)
    }
    if (affinities.some((affinity) => affinity.reasons.length === 0)) {
      errors.push(`${card.id} has affinity without reasons`)
    }
  }
  return errors
}

