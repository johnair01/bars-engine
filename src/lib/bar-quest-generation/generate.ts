/**
 * Orchestrate BAR → Quest proposal generation (Pipeline Stages 1–5)
 * @see .specify/specs/bar-quest-generation-engine/spec.md
 */

import { db } from '@/lib/db'
import { getKotterStageForCampaignRef, kotterStageToCampaignPhaseKey } from './campaign-phase'
import { checkBarEligibilityForQuestGeneration } from './eligibility'
import { interpretBarForQuestGeneration } from './interpretation'
import { resolveEmotionalAlchemyForBar } from './emotional-alchemy'
import { buildQuestProposalFromInterpretation } from './proposal-builder'

export interface GenerateQuestProposalResult {
  success: true
  proposalId: string
  reviewStatus: string
}

export interface GenerateQuestProposalError {
  success: false
  reason: string
}

/**
 * Full pipeline: eligibility → interpretation → emotional alchemy → proposal.
 * Returns proposal ID for admin review, or error reason.
 */
export async function generateQuestProposalFromBar(
  barId: string,
  options?: { allowRepeat?: boolean }
): Promise<GenerateQuestProposalResult | GenerateQuestProposalError> {
  const eligibility = await checkBarEligibilityForQuestGeneration(barId, options)
  if (!eligibility.eligible) {
    return { success: false, reason: eligibility.reason }
  }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: {
      id: true,
      title: true,
      description: true,
      allyshipDomain: true,
      campaignRef: true,
      creatorId: true,
      type: true,
      moveType: true,
    },
  })

  if (!bar) {
    return { success: false, reason: 'BAR not found' }
  }

  const kotterStage = await getKotterStageForCampaignRef(bar.campaignRef)
  const campaignPhaseKey = kotterStageToCampaignPhaseKey(kotterStage)

  const interpretation = interpretBarForQuestGeneration({
    id: bar.id,
    title: bar.title,
    description: bar.description,
    allyshipDomain: bar.allyshipDomain,
    campaignRef: bar.campaignRef,
    type: bar.type,
    moveType: bar.moveType,
    kotterStage,
    campaignPhaseKey,
  })

  const emotionalAlchemy = await resolveEmotionalAlchemyForBar({
    allyshipDomain: interpretation.domain,
    playerId: bar.creatorId,
    campaignPhase: kotterStage,
  })

  const { proposalId } = await buildQuestProposalFromInterpretation({
    interpretation,
    emotionalAlchemy,
    barId: bar.id,
    playerId: bar.creatorId,
    campaignRef: bar.campaignRef,
    campaignPhaseContext: { kotterStage, phaseKey: campaignPhaseKey },
  })

  return {
    success: true,
    proposalId,
    reviewStatus: 'pending',
  }
}
