/**
 * Campaign Lead Forge — claim a forged lead when its invitee creates a character.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * This closes the "dead wire": a manual lead records the starter quests the owner
 * matched to the invitee, but the invite-acceptance path never assigned them.
 * Called server-side from createCharacter (trusted — the invite was already
 * validated there), so it is a plain server-only function, NOT a callable action.
 */
import 'server-only'
import { db } from '@/lib/db'
import { parseJsonStringArray } from './types'

export interface ClaimLeadResult {
  claimed: boolean
  assignedQuestIds: string[]
}

/**
 * If `inviteId` has a linked CampaignLead, mark it onboarded (claimed by the new
 * player) and assign each still-existing matched starter quest as a PlayerQuest.
 * Best-effort and idempotent (PlayerQuest upsert on the unique [playerId, questId]).
 */
export async function claimCampaignLeadForPlayer(
  inviteId: string,
  playerId: string,
): Promise<ClaimLeadResult> {
  const lead = await db.campaignLead.findFirst({
    where: { inviteId },
    select: { id: true, starterQuestIdsJson: true },
  })
  if (!lead) return { claimed: false, assignedQuestIds: [] }

  const questIds = parseJsonStringArray(lead.starterQuestIdsJson)
  const assignedQuestIds: string[] = []

  if (questIds.length > 0) {
    const existing = await db.customBar.findMany({
      where: { id: { in: questIds } },
      select: { id: true },
    })
    const valid = new Set(existing.map((b) => b.id))
    for (const questId of questIds) {
      if (!valid.has(questId)) continue
      await db.playerQuest.upsert({
        where: { playerId_questId: { playerId, questId } },
        update: {},
        create: { playerId, questId, status: 'assigned' },
      })
      assignedQuestIds.push(questId)
    }
  }

  await db.campaignLead.update({
    where: { id: lead.id },
    data: { claimedByPlayerId: playerId, status: 'onboarded' },
  })

  return { claimed: true, assignedQuestIds }
}
