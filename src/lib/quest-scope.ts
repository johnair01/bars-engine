/**
 * Quest scope helpers: campaign vs personal vs public.
 * Campaign quests (thread.adventure.campaignRef) can only be completed on the gameboard.
 */
import { db } from '@/lib/db'

/**
 * Returns true if the quest is a campaign quest (belongs to a thread whose
 * adventure has campaignRef set). Campaign quests can only be completed on the gameboard.
 */
export async function isCampaignQuest(questId: string): Promise<boolean> {
  const threadQuest = await db.threadQuest.findFirst({
    where: { questId },
    include: {
      thread: {
        include: { adventure: { select: { campaignRef: true } } },
      },
    },
  })
  if (!threadQuest?.thread?.adventure) return false
  const campaignRef = threadQuest.thread.adventure.campaignRef
  return !!campaignRef && campaignRef.trim() !== ''
}
