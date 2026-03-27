/**
 * Merge hub/spoke journey fields into Player.storyProgress.state for continuity
 * (alchemy, deck filtering, downstream quest context).
 * @see .specify/specs/campaign-hub-spoke-landing-architecture/spec.md
 */

import { db } from '@/lib/db'

export const GM_FACE_KEYS = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const

export type HubJourneyStatePatch = {
  campaignRef: string
  spokeIndex: number
  hexagramId: number
  portalPrimaryFace: string
  kotterStage?: number
  lastSpokeMove?: string
}

/** Keys written under storyProgress.state */
export function hubJourneyPatchToStateFields(patch: HubJourneyStatePatch): Record<string, unknown> {
  const out: Record<string, unknown> = {
    campaign_hub_ref: patch.campaignRef,
    hub_spoke_index: patch.spokeIndex,
    hub_hexagram_id: patch.hexagramId,
    hub_portal_face: patch.portalPrimaryFace,
  }
  if (patch.kotterStage != null) out.hub_kotter_stage = patch.kotterStage
  if (patch.lastSpokeMove != null) out.last_spoke_move = patch.lastSpokeMove
  return out
}

/**
 * Shallow-merge `patch` into `storyProgress.state`, preserving other top-level keys.
 */
export function mergeStoryProgressStatePatch(
  prevJson: string | null | undefined,
  patch: Record<string, unknown>,
): string {
  let parsed: Record<string, unknown> = {}
  if (prevJson) {
    try {
      parsed = JSON.parse(prevJson) as Record<string, unknown>
    } catch {
      parsed = {}
    }
  }
  const prevState =
    parsed.state && typeof parsed.state === 'object' && !Array.isArray(parsed.state)
      ? { ...(parsed.state as Record<string, unknown>) }
      : {}
  const nextState = { ...prevState, ...patch }
  return JSON.stringify({ ...parsed, state: nextState })
}

/**
 * Parse hub journey from query params when entering a portal spoke from `/campaign/hub`.
 * `spoke` may be omitted if `nodeId` is `Portal_1` … `Portal_8` (index = N - 1).
 */
export function parseHubJourneyFromSearchParams(
  sp: URLSearchParams,
  nodeId: string,
): HubJourneyStatePatch | null {
  const ref = sp.get('ref')?.trim()
  const faceRaw = sp.get('face')?.trim().toLowerCase()
  if (!ref || !faceRaw || !(GM_FACE_KEYS as readonly string[]).includes(faceRaw)) return null

  const hexRaw = sp.get('hexagram')
  const hexagramId = hexRaw != null && hexRaw !== '' ? parseInt(hexRaw, 10) : NaN
  if (!Number.isFinite(hexagramId) || hexagramId < 1 || hexagramId > 64) return null

  let spokeIndex: number | undefined
  const spokeRaw = sp.get('spoke')
  if (spokeRaw != null && spokeRaw !== '') {
    spokeIndex = parseInt(spokeRaw, 10)
    if (!Number.isFinite(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) return null
  } else {
    const m = nodeId.match(/^Portal_(\d+)$/)
    if (m) {
      const n = parseInt(m[1]!, 10)
      if (n >= 1 && n <= 8) spokeIndex = n - 1
    }
  }
  if (spokeIndex === undefined) return null

  const kotterRaw = sp.get('kotterStage')
  let kotterStage: number | undefined
  if (kotterRaw != null && kotterRaw !== '') {
    const k = parseInt(kotterRaw, 10)
    if (Number.isFinite(k)) kotterStage = Math.max(1, Math.min(8, k))
  }

  return {
    campaignRef: ref,
    spokeIndex,
    hexagramId,
    portalPrimaryFace: faceRaw,
    kotterStage,
  }
}

export async function persistPlayerHubJourneyPatch(
  playerId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { storyProgress: true },
  })
  const merged = mergeStoryProgressStatePatch(player?.storyProgress ?? null, patch)
  await db.player.update({
    where: { id: playerId },
    data: { storyProgress: merged },
  })
}
