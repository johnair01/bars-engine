/**
 * Visual Identity Engine (VIE) — Phase 0 types.
 * @see .specify/specs/pixel-identity-system-v0/spec.md
 */

import type { AvatarConfig } from '@/lib/avatar-utils'

/**
 * Who this body is for walkable + future layer resolution.
 * Superset of the nation×archetype key used for precomposed `humanoid_v1` sheets.
 */
export type CharacterIdentity = {
  nationKey: string
  archetypeKey: string
  variant?: string
  domainKey?: string
  genderKey?: AvatarConfig['genderKey']
}

/**
 * Future: equipment / BAR overlays modulate composed output.
 * Phase 0: optional empty; resolver ignores this for URL selection.
 */
export type VisualTokenSet = {
  equipmentBySlot?: Partial<Record<string, string>>
  /** BAR / emotional modifier ids — no runtime effect on walkable URL in v0 */
  effectTokens?: string[]
}
