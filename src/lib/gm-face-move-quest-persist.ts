/**
 * Persist a player-owned quest CustomBar from Kotter grammar + GM face move (Phase B+).
 * @see .specify/specs/kotter-quest-seed-grammar/spec.md
 */

import { db } from '@/lib/db'
import { composeKotterQuestSeedBar, type EmotionalAlchemyStance } from '@/lib/kotter-quest-seed-grammar'
import { resolveGmFaceStageMoveForComposition } from '@/lib/gm-face-stage-moves'
import type { AllyshipDomain } from '@/lib/kotter'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

const VALID_FACES: readonly GameMasterFace[] = [
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
  'sage',
]

/** Normalize optional CYOA / client strings before {@link persistGmFaceMoveQuestBar}. */
export function parseGmFaceQuestAlchemyTag(
  s: string | null | undefined,
): EmotionalAlchemyStance | null {
  if (s === 'aligned' || s === 'curious' || s === 'skeptical') return s
  return null
}

export function parseGmFaceQuestReadingFace(s: string | null | undefined): GameMasterFace | null {
  if (s == null || s === '') return null
  return VALID_FACES.includes(s as GameMasterFace) ? (s as GameMasterFace) : null
}

const VALID_DOMAINS: readonly AllyshipDomain[] = [
  'GATHERING_RESOURCES',
  'SKILLFUL_ORGANIZING',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
]

function clampDomain(d: string | null | undefined): AllyshipDomain {
  const x = d as AllyshipDomain
  return VALID_DOMAINS.includes(x) ? x : 'GATHERING_RESOURCES'
}

export type GmFaceMoveQuestPersistInput = {
  playerId: string
  campaignRef: string
  kotterStage: number
  allyshipDomain: AllyshipDomain
  hexagramId: number
  gmFaceMoveId: string
  portalTheme?: string | null
  emotionalAlchemyTag?: EmotionalAlchemyStance | null
  readingFace?: GameMasterFace | null
  /** Merged into parsed completionEffects (e.g. source, spokeSessionId). */
  provenanceExtra?: Record<string, unknown>
}

/**
 * Validates move vs stage, composes seed BAR, inserts `CustomBar` (type quest, private, active).
 */
export async function persistGmFaceMoveQuestBar(
  input: GmFaceMoveQuestPersistInput,
): Promise<{ success: true; questId: string } | { error: string }> {
  const stage = Math.max(1, Math.min(8, Math.round(input.kotterStage)))
  const hexId = Math.max(1, Math.min(64, Math.round(input.hexagramId)))
  const moveId = String(input.gmFaceMoveId).trim()
  if (!moveId) return { error: 'gmFaceMoveId required' }

  if (!resolveGmFaceStageMoveForComposition(stage, moveId)) {
    return { error: 'Face move does not match this campaign Kotter stage' }
  }

  const domain = clampDomain(input.allyshipDomain)

  const payload = composeKotterQuestSeedBar({
    campaignRef: input.campaignRef,
    kotterStage: stage,
    allyshipDomain: domain,
    hexagramId: hexId,
    gmFaceMoveId: moveId,
    emotionalAlchemyTag: input.emotionalAlchemyTag ?? null,
    readingFace: input.readingFace ?? null,
    portalTheme: input.portalTheme ?? null,
  })

  let completionFx: Record<string, unknown>
  try {
    completionFx = JSON.parse(payload.completionEffects) as Record<string, unknown>
  } catch {
    return { error: 'Invalid composed completionEffects' }
  }
  const merged = { ...completionFx, ...(input.provenanceExtra ?? {}) }

  try {
    const row = await db.customBar.create({
      data: {
        creatorId: input.playerId,
        title: payload.title.slice(0, 200),
        description: payload.description,
        type: 'quest',
        visibility: 'private',
        status: 'active',
        kotterStage: payload.kotterStage,
        campaignRef: input.campaignRef,
        campaignGoal: payload.campaignGoal,
        hexagramId: hexId,
        allyshipDomain: domain,
        emotionalAlchemyTag: payload.emotionalAlchemyTag,
        gameMasterFace: payload.gameMasterFace,
        completionEffects: JSON.stringify(merged),
        reward: 1,
      },
      select: { id: true },
    })
    return { success: true, questId: row.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[persistGmFaceMoveQuestBar]', e)
    return { error: msg }
  }
}
