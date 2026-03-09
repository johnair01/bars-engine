/**
 * Build QuestProposal from interpretation + emotional alchemy
 * @see .specify/specs/bar-quest-generation-engine/spec.md Part 4
 */

import { db } from '@/lib/db'
import type { BarInterpretation, EmotionalAlchemyResult } from './types'

export interface BuildProposalInput {
  interpretation: BarInterpretation
  emotionalAlchemy: EmotionalAlchemyResult
  barId: string
  playerId: string
  campaignRef: string | null
}

/**
 * Create a QuestProposal record from interpretation and emotional alchemy result.
 * Does not publish; proposal enters admin review queue.
 */
export async function buildQuestProposalFromInterpretation(
  input: BuildProposalInput
): Promise<{ proposalId: string }> {
  const { interpretation, emotionalAlchemy, barId, playerId, campaignRef } = input

  const completionConditions = [
    `Complete the ${interpretation.questType} quest`,
    interpretation.suggestedPrompt.slice(0, 100) + (interpretation.suggestedPrompt.length > 100 ? '...' : ''),
  ]

  const emotionalAlchemyJson = JSON.stringify({
    status: emotionalAlchemy.status,
    moveId: emotionalAlchemy.moveId,
    moveName: emotionalAlchemy.moveName,
    prompt: emotionalAlchemy.prompt,
    completionReflection: emotionalAlchemy.completionReflection,
  })

  const proposal = await db.questProposal.create({
    data: {
      barId,
      campaignRef: campaignRef || undefined,
      playerId,
      title: interpretation.suggestedTitle,
      description: interpretation.suggestedPrompt,
      domain: interpretation.domain,
      questType: interpretation.questType,
      completionConditions: JSON.stringify(completionConditions),
      emotionalAlchemy: emotionalAlchemyJson,
      reviewStatus: 'pending',
      confidenceScore: interpretation.confidenceScore,
    },
  })

  return { proposalId: proposal.id }
}
