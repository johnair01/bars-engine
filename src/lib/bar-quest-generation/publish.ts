/**
 * Publish approved QuestProposal to campaign (create CustomBar quest)
 * @see .specify/specs/bar-quest-generation-engine/spec.md Part 8
 */

import { db } from '@/lib/db'
import { persistQuestTweeModule } from '@/lib/micro-twine-persist'
import { compileQuestProposalIrToTwee } from './twine-ir-bridge'

export interface PublishResult {
  success: true
  questId: string
}

export interface PublishError {
  success: false
  reason: string
}

/**
 * Create a CustomBar quest from an approved QuestProposal.
 * Sets sourceBarId, campaignRef, allyshipDomain, moveType.
 */
export async function publishQuestProposal(
  proposalId: string
): Promise<PublishResult | PublishError> {
  const proposal = await db.questProposal.findUnique({
    where: { id: proposalId },
    include: { bar: true, player: true },
  })

  if (!proposal) {
    return { success: false, reason: 'Proposal not found' }
  }

  if (proposal.reviewStatus !== 'approved') {
    return { success: false, reason: 'Proposal must be approved before publishing' }
  }

  if (proposal.publishedQuestId) {
    return { success: true, questId: proposal.publishedQuestId }
  }

  let moveType: string | null = null
  try {
    const parsed = JSON.parse(proposal.emotionalAlchemy) as { moveId?: string }
    if (parsed?.moveId) {
      const { getMoveById } = await import('@/lib/quest-grammar/move-engine')
      const canonicalMove = getMoveById(parsed.moveId)
      if (canonicalMove?.primaryWaveStage) moveType = canonicalMove.primaryWaveStage
    }
  } catch {
    // ignore
  }

  const quest = await db.customBar.create({
    data: {
      creatorId: proposal.playerId,
      title: proposal.title,
      description: proposal.description,
      type: 'vibe',
      reward: 1,
      visibility: 'public',
      status: 'active',
      inputs: '[]',
      campaignRef: proposal.campaignRef || null,
      allyshipDomain: proposal.domain || null,
      moveType,
      sourceBarId: proposal.barId,
      isSystem: true,
    },
  })

  try {
    const { tweeSource, canonicalJson } = compileQuestProposalIrToTwee(
      {
        title: proposal.title,
        description: proposal.description,
        questType: proposal.questType,
        domain: proposal.domain,
        emotionalAlchemy: proposal.emotionalAlchemy,
      },
      quest.id
    )
    await persistQuestTweeModule({
      questId: quest.id,
      creatorId: proposal.playerId,
      questTitle: quest.title,
      tweeSource,
      canonicalJson,
    })
  } catch (err) {
    console.error('[publishQuestProposal] Twine IR bridge (T4.2) failed:', err)
  }

  await db.questProposal.update({
    where: { id: proposalId },
    data: { publishedQuestId: quest.id },
  })

  return { success: true, questId: quest.id }
}
