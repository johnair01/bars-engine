/**
 * SMB — Spoke move seed beds: move types, blueprint parsing, spoke BAR anchor eligibility.
 * @see .specify/specs/spoke-move-seed-beds/spec.md
 */

export const SPOKE_MOVE_BED_MOVE_TYPES = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const
export type SpokeMoveBedMoveType = (typeof SPOKE_MOVE_BED_MOVE_TYPES)[number]

export function isSpokeMoveBedMoveType(s: string): s is SpokeMoveBedMoveType {
  return (SPOKE_MOVE_BED_MOVE_TYPES as readonly string[]).includes(s)
}

/** Map face-move `blueprintKey` (e.g. face_shaman_move_wakeUp) → bed move. */
export function parsePortalMoveFromBlueprintKey(blueprintKey?: string | null): SpokeMoveBedMoveType | null {
  if (!blueprintKey?.trim()) return null
  const k = blueprintKey.trim()
  if (/_move_wakeUp$/i.test(k)) return 'wakeUp'
  if (/_move_cleanUp$/i.test(k)) return 'cleanUp'
  if (/_move_showUp$/i.test(k)) return 'showUp'
  if (/_move_growUp$/i.test(k)) return 'growUp'
  return null
}

export type SpokePortalStamp = {
  campaignRef: string
  spokeIndex: number
  moveType: SpokeMoveBedMoveType
}

export function parseSpokePortalFromAgentMetadata(agentMetadata: string | null | undefined): SpokePortalStamp | null {
  try {
    const o = JSON.parse(agentMetadata || '{}') as { spokePortal?: unknown }
    const sp = o.spokePortal
    if (!sp || typeof sp !== 'object') return null
    const raw = sp as { campaignRef?: unknown; spokeIndex?: unknown; moveType?: unknown }
    const campaignRef = typeof raw.campaignRef === 'string' ? raw.campaignRef.trim() : ''
    const spokeIndex = typeof raw.spokeIndex === 'number' ? raw.spokeIndex : NaN
    const moveType = typeof raw.moveType === 'string' ? raw.moveType : ''
    if (!campaignRef || !Number.isFinite(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) return null
    if (!isSpokeMoveBedMoveType(moveType)) return null
    return { campaignRef, spokeIndex, moveType }
  } catch {
    return null
  }
}

export function isBarEligibleSpokeAnchor(
  bar: {
    type: string
    agentMetadata: string | null | undefined
    mergedIntoId: string | null | undefined
    archivedAt: Date | null | undefined
  },
  campaignRef: string,
  spokeIndex: number,
  moveType: SpokeMoveBedMoveType,
): boolean {
  if (bar.mergedIntoId || bar.archivedAt) return false
  if (bar.type !== 'vibe') return false
  const meta = parseSpokePortalFromAgentMetadata(bar.agentMetadata)
  if (!meta) return false
  return (
    meta.campaignRef === campaignRef &&
    meta.spokeIndex === spokeIndex &&
    meta.moveType === moveType
  )
}

export const SPOKE_PLANT_MIN_TITLE_LEN = 3
export const SPOKE_PLANT_MIN_DESCRIPTION_LEN = 10

export function passesSpokeKernelQualityGate(title: string, description: string): boolean {
  return title.trim().length >= SPOKE_PLANT_MIN_TITLE_LEN && description.trim().length >= SPOKE_PLANT_MIN_DESCRIPTION_LEN
}
