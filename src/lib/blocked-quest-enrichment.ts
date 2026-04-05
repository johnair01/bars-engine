/**
 * Enrich blocked quests with the key quest title (tetris key-unlock).
 * Spec: .specify/specs/singleplayer-charge-metabolism/spec.md FR3.5
 */
import { db } from '@/lib/db'

export type QuestWithBlockedKey = {
  id: string
  rootId: string | null
  status: string
  blockedKeyQuestTitle?: string | null
}

/**
 * For blocked quests, fetch the key quest (isKeyUnblocker) in the same cluster and return its title.
 */
export async function getBlockedKeyQuestTitles(
  quests: Array<{ id: string; rootId: string | null; status: string }>
): Promise<Map<string, string>> {
  const blocked = quests.filter((q) => q.status === 'blocked')
  if (blocked.length === 0) return new Map()

  const rootIds = [...new Set(blocked.map((q) => q.rootId || q.id))]
  const keyQuests = await db.customBar.findMany({
    where: { rootId: { in: rootIds }, isKeyUnblocker: true },
    select: { rootId: true, title: true },
  })
  const keyByRoot = new Map(keyQuests.map((k) => [k.rootId, k.title]))

  const result = new Map<string, string>()
  for (const q of blocked) {
    const rootId = q.rootId || q.id
    const title = keyByRoot.get(rootId) ?? null
    if (title) result.set(q.id, title)
  }
  return result
}

/**
 * Enrich thread quests with blockedKeyQuestTitle for blocked quests.
 */
export async function enrichThreadQuestsWithBlockedKey<
  T extends { quest: { id: string; rootId: string | null; status: string } },
>(items: T[],
): Promise<T[]> {
  const quests = items.map((i) => i.quest)
  const titles = await getBlockedKeyQuestTitles(quests)
  if (titles.size === 0) return items

  return items.map((item) => {
    if (item.quest.status !== 'blocked') return item
    const title = titles.get(item.quest.id) ?? null
    return {
      ...item,
      quest: { ...item.quest, blockedKeyQuestTitle: title },
    } as T
  })
}

/**
 * Enrich pack quests with blockedKeyQuestTitle for blocked quests.
 */
export async function enrichPackQuestsWithBlockedKey<
  T extends { quest: { id: string; rootId: string | null; status: string } },
>(items: T[],
): Promise<T[]> {
  const quests = items.map((i) => i.quest)
  const titles = await getBlockedKeyQuestTitles(quests)
  if (titles.size === 0) return items

  return items.map((item) => {
    if (item.quest.status !== 'blocked') return item
    const title = titles.get(item.quest.id) ?? null
    return {
      ...item,
      quest: { ...item.quest, blockedKeyQuestTitle: title },
    } as T
  })
}
