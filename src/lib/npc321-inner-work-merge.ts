/**
 * Shared helpers for NPC 321 inner-work merge (used by server action + tests).
 * Spec: .specify/specs/321-suggest-name/spec.md
 */

import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import type { Shadow321NameFields } from '@/lib/shadow321-name-resolution'

/** Max length for q1-derived excerpt stored on merge rows (privacy). */
export const NPC321_MERGE_CHARGE_EXCERPT_MAX = 200

export function truncateChargeExcerpt(
  text: string | undefined | null,
  max: number = NPC321_MERGE_CHARGE_EXCERPT_MAX
): string | null {
  const t = (text ?? '').trim()
  if (!t) return null
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

type Phase3Snap = {
  nationName?: string
  archetypeName?: string
  identityFreeText?: string
}

type Phase2Snap = {
  q1?: string
  alignedAction?: string
  moveType?: string
}

export type Merge321NameParams = {
  humanPlayerId: string
  shadow321SessionId: string
  shadow321Name: Shadow321NameFields
  phase2Snapshot: string
  phase3Snapshot: string
  humanNationId?: string | null
  humanArchetypeId?: string | null
}

/**
 * Resolve nation + archetype IDs for matching NPCs.
 * Prefers explicit phase3 taxonomic fields; falls back to the human player's profile.
 */
export async function resolve321MatchNationArchetype(
  phase3: Phase3Snap,
  humanNationId: string | null | undefined,
  humanArchetypeId: string | null | undefined
): Promise<{ nationId: string; archetypeId: string } | null> {
  let nationId: string | undefined
  let archetypeId: string | undefined

  if (phase3.nationName?.trim()) {
    const n = await db.nation.findFirst({
      where: {
        archived: false,
        name: { equals: phase3.nationName.trim(), mode: 'insensitive' },
      },
      select: { id: true },
    })
    if (n) nationId = n.id
  }
  if (!nationId && humanNationId) nationId = humanNationId

  if (phase3.archetypeName?.trim()) {
    const a = await db.archetype.findFirst({
      where: { name: { equals: phase3.archetypeName.trim(), mode: 'insensitive' } },
      select: { id: true },
    })
    if (a) archetypeId = a.id
  }
  if (!archetypeId && humanArchetypeId) archetypeId = humanArchetypeId

  if (!nationId || !archetypeId) return null
  return { nationId, archetypeId }
}

/**
 * Create one merge row per matching NPC (same nation + archetype as match key).
 * Idempotent per (shadow321SessionId, npcPlayerId) via DB unique + skipDuplicates.
 */
export async function merge321NameIntoMatchingNpcs(params: Merge321NameParams): Promise<{ merged: number }> {
  const {
    humanPlayerId,
    shadow321SessionId,
    shadow321Name,
    phase2Snapshot,
    phase3Snapshot,
    humanNationId,
    humanArchetypeId,
  } = params

  let phase3: Phase3Snap = {}
  let phase2: Phase2Snap = {}
  try {
    phase3 = JSON.parse(phase3Snapshot || '{}') as Phase3Snap
  } catch {
    /* ignore */
  }
  try {
    phase2 = JSON.parse(phase2Snapshot || '{}') as Phase2Snap
  } catch {
    /* ignore */
  }

  const match = await resolve321MatchNationArchetype(phase3, humanNationId, humanArchetypeId)
  if (!match) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[npc321-merge] skip: no nation+archetype match key', {
        humanPlayerId,
        shadow321SessionId,
      })
    }
    return { merged: 0 }
  }

  const chargeExcerpt = truncateChargeExcerpt(phase2.q1)
  const alignedActionRaw = phase2.alignedAction?.trim()
  const alignedAction = alignedActionRaw ? truncateChargeExcerpt(alignedActionRaw, 120) : null
  const moveType = phase2.moveType?.trim() ? truncateChargeExcerpt(phase2.moveType, 64) : null

  const metadataKeys: Prisma.JsonObject = {
    nationId: match.nationId,
    archetypeId: match.archetypeId,
    ...(alignedAction ? { alignedAction } : {}),
    ...(moveType ? { moveType } : {}),
  }

  const npcs = await db.player.findMany({
    where: {
      creatorType: 'agent',
      nationId: match.nationId,
      archetypeId: match.archetypeId,
      NOT: { id: humanPlayerId },
    },
    select: { id: true },
  })

  if (npcs.length === 0) return { merged: 0 }

  const result = await db.npc321InnerWorkMerge.createMany({
    data: npcs.map((npc) => ({
      humanPlayerId,
      npcPlayerId: npc.id,
      shadow321SessionId,
      finalShadowName: shadow321Name.finalShadowName,
      nameResolution: shadow321Name.nameResolution,
      suggestionCount: shadow321Name.suggestionCount,
      metadataKeys,
      chargeExcerpt,
    })),
    skipDuplicates: true,
  })

  return { merged: result.count }
}
