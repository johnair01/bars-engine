/**
 * Deterministic/random portal draws for campaign hub (8 spokes × hex + changing lines).
 * Shared by `campaign-portals` (lazy persist) and allyship intake spawn (ECI-B).
 */
import { getFaceForLine } from '@/lib/portal-context'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { CampaignHubStateV1 } from '@/lib/campaign-hub/types'

export type PortalSpokeCast = {
  hexagramId: number
  changingLines: number[]
  primaryFace: GameMasterFace
}

/**
 * Cast a single hexagram with simulated changing lines (1–3 lines).
 * Only portals with changing lines are revealed per spec.
 */
export function castHexagramWithChangingLines(): PortalSpokeCast {
  const lines = Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 0 : 1))
  const hexagramId = 1 + lines.reduce<number>((acc, bit, i) => acc + bit * Math.pow(2, i), 0)
  const clampedId = Math.max(1, Math.min(64, hexagramId))

  const changeCount = 1 + Math.floor(Math.random() * 3)
  const indices: number[] = []
  while (indices.length < changeCount) {
    const i = Math.floor(Math.random() * 6)
    if (!indices.includes(i)) indices.push(i)
  }
  indices.sort((a, b) => a - b)
  const changingLines = indices.map((i) => i + 1)
  const primaryFace = getFaceForLine(changingLines[0]!)

  return { hexagramId: clampedId, changingLines, primaryFace }
}

/** Draw 8 portal casts for a new hub state (Kotter stage 1 = Create Urgency). */
export function draw8PortalCasts(): PortalSpokeCast[] {
  return Array.from({ length: 8 }, () => castHexagramWithChangingLines())
}

/** Fresh v1 hub JSON for an instance at the given Kotter stage (not yet persisted). */
export function buildFreshCampaignHubState(kotterStage: number): CampaignHubStateV1 {
  const ks = Math.max(1, Math.min(8, kotterStage))
  const spokes = draw8PortalCasts().map((c) => ({
    hexagramId: c.hexagramId,
    changingLines: c.changingLines,
    primaryFace: c.primaryFace,
  }))
  return {
    v: 1,
    kotterStage: ks,
    spokes,
    updatedAt: new Date().toISOString(),
  }
}
