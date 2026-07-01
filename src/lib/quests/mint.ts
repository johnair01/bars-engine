/**
 * mintQuestFromText — the single primitive that turns text into a quest
 * (`CustomBar type='quest'`) plus its `PlayerQuest` assignment.
 *
 * Both entry points into "this becomes a quest" go through here so a quest is
 * ALWAYS minted the same way — in particular, **lens lineage is copied onto the
 * quest** (`lensId` / `lensGoalId` / `plantSnapshot`). The prior `growQuestFromBar`
 * hardcoded these to null, silently severing a quest from the goal it serves; that
 * bug dies here. See .specify/specs/quest-lineage-alignment/ (QLA, Phase 1).
 *
 * This is a server-only lib (imported by server actions); it does no auth/ownership
 * checks — callers are responsible for those before minting.
 */
import { db } from '@/lib/db'
import type { LensGoalTrace } from '@/lib/lenses/lineage-types'

export type MintQuestInput = {
  playerId: string
  title: string
  description: string
  /** Lens lineage carried onto the quest so it stays connected to its goal. */
  lensId?: string | null
  lensGoalId?: string | null
  plantSnapshot?: LensGoalTrace | null
  /** Provenance links. */
  sourceBarId?: string | null
  /** When set, links `TapTheVeinTask.questId` back to the new quest in the same tx. */
  sourceTaskId?: string | null
  /** Quest shape — defaults mirror the historical `growQuestFromBar` behaviour. */
  moveType?: string
  allyshipDomain?: string
  reward?: number
}

/**
 * Create a self-rooted private quest + assign it to the player. Atomic: quest
 * create, self-root, and assignment happen in one transaction. Returns the quest id.
 */
export async function mintQuestFromText(input: MintQuestInput): Promise<{ questId: string }> {
  const title = (input.title || 'Quest').trim().slice(0, 200) || 'Quest'
  const description = (input.description || '').trim() || title

  return db.$transaction(async (tx) => {
    const quest = await tx.customBar.create({
      data: {
        creatorId: input.playerId,
        title,
        description,
        type: 'quest',
        reward: input.reward ?? 1,
        visibility: 'private',
        status: 'active',
        moveType: input.moveType ?? 'showUp',
        allyshipDomain: input.allyshipDomain ?? 'GATHERING_RESOURCES',
        sourceBarId: input.sourceBarId ?? null,
        inputs: '[]',
        rootId: 'temp',
        // Lineage — never null it when a source goal exists.
        lensId: input.lensId ?? null,
        lensGoalId: input.lensGoalId ?? null,
        plantSnapshot: input.plantSnapshot ?? undefined,
      },
      select: { id: true },
    })
    await tx.customBar.update({ where: { id: quest.id }, data: { rootId: quest.id } })

    await tx.playerQuest.upsert({
      where: { playerId_questId: { playerId: input.playerId, questId: quest.id } },
      update: { status: 'assigned' },
      create: { playerId: input.playerId, questId: quest.id, status: 'assigned', assignedAt: new Date() },
    })

    if (input.sourceTaskId) {
      await tx.tapTheVeinTask.update({
        where: { id: input.sourceTaskId },
        data: { questId: quest.id },
      })
    }

    return { questId: quest.id }
  })
}
