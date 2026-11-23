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
import type { AllyshipDomainKey } from '@/lib/allyship-domains'
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
  /** Origin hint (e.g. 'tap_the_vein') so surfaces can group born-as-quest work. */
  questSource?: string | null
  /** Quest shape — defaults mirror the historical `growQuestFromBar` behaviour. */
  moveType?: string
  /**
   * The domain this quest serves. Required, deliberately.
   *
   * Wendell, 2026-11-20: "A default here is exactly how Gather Resources silently became every quest's answer."
   * This was `allyshipDomain?: string` defaulted to 'GATHERING_RESOURCES' below, and neither caller passed one — so
   * every quest minted through this primitive was silently Gathering Resources. A domain is carried from a real
   * source (the quest's single campaign, or the lens it operates from) or picked by a person; never inferred.
   *
   * The DB column stays nullable (CustomBar.allyshipDomain String?), because a legacy row may have none. What is
   * not allowed is NEW work inventing one.
   */
  allyshipDomain: AllyshipDomainKey
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
        allyshipDomain: input.allyshipDomain,
        sourceBarId: input.sourceBarId ?? null,
        questSource: input.questSource ?? null,
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
