/**
 * BlessedObjectEarned — inner work unlocks collectibles.
 * EFA, 321, quest completion, campaign participation create BlessedObjectEarned records.
 */
import { db } from '@/lib/db'

export type BlessedObjectSource =
  | 'efa'
  | '321'
  | 'stage_talisman'
  | 'campaign_completion'
  | 'personal'

export type UnlockMetadata = {
  instanceId?: string
  kotterStage?: number
  questId?: string
  loreBarId?: string
  /** IE-13: provenance for daemon-linked unlocks (metadata only; no FK in Phase 2) */
  daemonId?: string
  [key: string]: unknown
}

const STAGE_TALISMAN_NAMES: Record<number, string> = {
  1: 'Talisman of Urgency',
  2: 'Talisman of Coalition',
  3: 'Talisman of Vision',
  4: 'Talisman of the Word',
  5: 'Talisman of the Threshold',
  6: 'Talisman of the First Win',
  7: 'Talisman of Momentum',
  8: 'Talisman of the Anchor',
}

/**
 * Unlock a blessed object for a player. Idempotent for stage_talisman (one per stage per instance).
 */
export async function unlockBlessedObject(
  playerId: string,
  source: BlessedObjectSource,
  metadata?: UnlockMetadata
): Promise<{ id: string } | { error: string }> {
  try {
    if (source === 'stage_talisman' && metadata?.instanceId != null && metadata?.kotterStage != null) {
      const existing = await db.blessedObjectEarned.findFirst({
        where: {
          playerId,
          source: 'stage_talisman',
          instanceId: metadata.instanceId,
          kotterStage: metadata.kotterStage,
        },
      })
      if (existing) {
        return { id: existing.id }
      }
    }

    // Idempotent: one per player for efa and 321
    if (source === 'efa' || source === '321') {
      const existing = await db.blessedObjectEarned.findFirst({
        where: { playerId, source },
      })
      if (existing) return { id: existing.id }
    }

    const record = await db.blessedObjectEarned.create({
      data: {
        playerId,
        source,
        instanceId: metadata?.instanceId ?? null,
        kotterStage: metadata?.kotterStage ?? null,
        questId: metadata?.questId ?? null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    })
    return { id: record.id }
  } catch (e) {
    console.error('[blessed-objects] unlockBlessedObject failed:', e)
    return { error: e instanceof Error ? e.message : 'Failed to unlock blessed object' }
  }
}

/**
 * Get all blessed objects earned by a player, ordered by earnedAt desc.
 */
export async function getBlessedObjectsForPlayer(playerId: string) {
  return db.blessedObjectEarned.findMany({
    where: { playerId },
    orderBy: { earnedAt: 'desc' },
  })
}

/**
 * Get display name for a blessed object based on source and metadata.
 */
export function getBlessedObjectDisplayName(
  source: BlessedObjectSource,
  kotterStage: number | null
): string {
  if (source === 'stage_talisman' && kotterStage != null && kotterStage in STAGE_TALISMAN_NAMES) {
    return STAGE_TALISMAN_NAMES[kotterStage]
  }
  switch (source) {
    case 'efa':
      return 'Emotional First Aid'
    case '321':
      return '321 Shadow Process'
    case 'campaign_completion':
      return 'Campaign Participation'
    case 'personal':
      return 'Personal Blessed Object'
    default:
      return 'Blessed Object'
  }
}
