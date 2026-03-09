/**
 * Archetype Influence Overlay v1
 * Spec: .specify/specs/archetype-influence-overlay/spec.md
 */

import { slugifyName } from '@/lib/avatar-utils'
import { ARCHETYPE_PROFILES } from './profiles'
import { applyArchetypeOverlay } from './overlay'
import type { ArchetypeInfluenceProfile } from './types'
import type { QuestSeed } from '@/lib/transformation-move-registry/types'

export type { ArchetypeInfluenceProfile } from './types'
export { applyArchetypeOverlay } from './overlay'
export { ARCHETYPE_PROFILES } from './profiles'

/** Resolve archetype key from name or slug. */
function resolveArchetypeKey(keyOrName: string): string {
  const trimmed = keyOrName.trim()
  if (!trimmed) return ''
  if (trimmed.includes(' ')) return slugifyName(trimmed)
  return trimmed.toLowerCase()
}

/**
 * Returns the archetype influence profile for a canonical archetype.
 * Accepts archetype key (bold-heart) or name (The Bold Heart).
 */
export function getArchetypeInfluenceProfile(
  archetypeKeyOrName: string
): ArchetypeInfluenceProfile | undefined {
  const key = resolveArchetypeKey(archetypeKeyOrName)
  if (!key) return undefined
  return ARCHETYPE_PROFILES.find((p) => p.archetype_id === key)
}

/**
 * Assembles a quest seed and applies archetype overlay when archetypeKey is provided.
 * Use when archetype context is available in the generation pipeline.
 */
export function assembleQuestSeedWithArchetypeOverlay(
  assembleFn: () => QuestSeed,
  archetypeKeyOrName?: string | null
): QuestSeed {
  const seed = assembleFn()
  if (!archetypeKeyOrName) return seed
  const profile = getArchetypeInfluenceProfile(archetypeKeyOrName)
  if (!profile) return seed
  return applyArchetypeOverlay(seed, profile)
}
