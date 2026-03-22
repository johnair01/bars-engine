/**
 * Archetype Influence Overlay v1
 * Spec: .specify/specs/archetype-influence-overlay/spec.md
 */

import { slugifyName } from '@/lib/avatar-utils'
import { resolvePlaybookArchetypeKey } from '@/lib/archetype-keys'
import { ARCHETYPE_PROFILES } from './profiles'
import { applyArchetypeOverlay } from './overlay'
import type { ArchetypeInfluenceProfile } from './types'
import type { QuestSeed } from '@/lib/transformation-move-registry/types'

export type { ArchetypeInfluenceProfile } from './types'
export { applyArchetypeOverlay } from './overlay'
export { ARCHETYPE_PROFILES } from './profiles'

/**
 * Returns the archetype influence profile for a canonical archetype.
 * Accepts playbook slug (`bold-heart`), display name (`The Bold Heart`), or diagnostic keys (`truth_seer`)
 * per {@link resolvePlaybookArchetypeKey}.
 */
export function getArchetypeInfluenceProfile(
  archetypeKeyOrName: string
): ArchetypeInfluenceProfile | undefined {
  const trimmed = archetypeKeyOrName.trim()
  if (!trimmed) return undefined

  const slug =
    resolvePlaybookArchetypeKey(trimmed) ?? resolvePlaybookArchetypeKey(slugifyName(trimmed))

  if (!slug) return undefined
  return ARCHETYPE_PROFILES.find((p) => p.archetype_id === slug)
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
