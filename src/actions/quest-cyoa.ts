'use server'

import { dbBase } from '@/lib/db'

/**
 * Get CYOA metadata for a quest (CustomBar) — used by cyoa_quest anchors.
 * Returns storyId and title if the quest has a linked Twine story.
 */
export async function getQuestCyoaMeta(questId: string) {
  const quest = await dbBase.customBar.findUnique({
    where: { id: questId },
    select: {
      id: true,
      title: true,
      description: true,
      twineStoryId: true,
    },
  })
  if (!quest || !quest.twineStoryId) return null
  return {
    questId: quest.id,
    storyId: quest.twineStoryId,
    title: quest.title,
    description: quest.description,
  }
}
