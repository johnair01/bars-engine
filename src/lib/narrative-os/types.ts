/**
 * Narrative OS Map v0 — shared domain types.
 * @see .specify/specs/narrative-os-map-v0/spec.md
 */

export const SPACE_IDS = ['library', 'dojo', 'forest', 'forge'] as const
export type SpaceId = (typeof SPACE_IDS)[number]

export function isSpaceId(value: string): value is SpaceId {
  return (SPACE_IDS as readonly string[]).includes(value)
}

/** Single deep link on the game map (GUI card). */
export type NarrativeMapLink = {
  id: string
  label: string
  description: string
  href: string
  accent: string
  tag: string
  /** Optional WCGS throughput hint — orthogonal to space. */
  moveTag?: 'Wake Up' | 'Clean Up' | 'Grow Up' | 'Show Up'
}

/** One narrative space region with child links. */
export type NarrativeSpaceSection = {
  id: SpaceId
  title: string
  subtitle: string
  narrativeDescription: string
  mechanicalDescription: string
  accentBar: string
  items: NarrativeMapLink[]
}

/** API + UI summary for a space (subset of download spec fields). */
export type WorldMapSpaceSummary = {
  id: SpaceId
  title: string
  subtitle: string
  narrativeDescription: string
  mechanicalDescription: string
  isUnlocked: boolean
  isHighlighted: boolean
  recentActivityCount: number
  recommendedAction: string | null
  availableContentCounts: Record<string, number>
  campaignOverlayCount: number
}

export type CampaignOverlay = {
  id: string
  sourceCampaignId: string
  targetSpaceId: SpaceId
  title: string
  summary: string
  priority: number
}

export type WorldMapTransition = {
  from: SpaceId
  to: SpaceId
  reason: string
  narrativeHint: string
}

export type WorldMapState = {
  playerId: string | null
  currentSpace: SpaceId | null
  unlockedSpaces: SpaceId[]
  recentTransitions: Array<{ from: SpaceId; to: SpaceId; at: string }>
  recommendedTransitions: WorldMapTransition[]
  activeOverlays: CampaignOverlay[]
  starterWorldReady: boolean
}

/** GET /api/world/map */
export type WorldMapPayload = {
  version: 1
  spaces: WorldMapSpaceSummary[]
  /** Global next-step hints (deterministic v0). */
  recommendations: string[]
  activeOverlays: CampaignOverlay[]
  starterPlayAvailable: boolean
}

/** POST /api/world/map/transition (Phase 3 mock). */
export type MapTransitionRequest = {
  fromSpace: SpaceId
  toSpace: SpaceId
  reason?: string
  context?: string
}

export type MapTransitionResponse = {
  ok: boolean
  error?: string
  fromSpace: SpaceId
  toSpace: SpaceId
  /** Deep link to target space home */
  targetHref: string
  gameMapHash: `space-${SpaceId}`
  narrativeCopy: string
  mechanicalReason: string
  /** Deterministic idempotency-style token (no server store in v0) */
  transitionToken: string
  variant: 'stay' | 'forward' | 'return' | 'invalid'
}

/** GET /api/{library|dojo|forest|forge}/home — space home shell (Phase 2). */
export type SpaceHomePayload = {
  spaceId: SpaceId
  title: string
  subtitle: string
  narrativeDescription: string
  mechanicalDescription: string
  accentBar: string
  primaryCta: { label: string; href: string }
  destinations: NarrativeMapLink[]
  recommendations: string[]
  /** Hash target on /game-map for deep links */
  gameMapHash: `space-${SpaceId}`
}
