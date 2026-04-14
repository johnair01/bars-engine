/**
 * Single entry for walkable spritesheet URL selection (precomposed humanoid_v1).
 * Phase 0: delegates to `getWalkableSpriteUrl`; later may branch on `VisualTokenSet` / compositor.
 */
import type { AvatarConfig } from '@/lib/avatar-utils'
import { getWalkableSpriteUrl } from '@/lib/avatar-utils'
import type { CharacterIdentity } from './types'

export type ResolveWalkableSpriteOptions = {
  /** Pipeline demo: force a fixed nation×archetype sheet regardless of identity */
  demoAvatar?: AvatarConfig | null
}

function identityToAvatarConfig(identity: CharacterIdentity): AvatarConfig {
  return {
    nationKey: identity.nationKey,
    archetypeKey: identity.archetypeKey,
    variant: identity.variant ?? 'default',
    domainKey: identity.domainKey,
    genderKey: identity.genderKey,
  }
}

/**
 * @returns Public URL path e.g. `/sprites/walkable/argyra-bold-heart.png`
 */
export function resolveWalkableSpriteUrl(
  identity: CharacterIdentity | null,
  options?: ResolveWalkableSpriteOptions
): string {
  if (options?.demoAvatar) {
    return getWalkableSpriteUrl(options.demoAvatar)
  }
  if (!identity) {
    return getWalkableSpriteUrl(null)
  }
  return getWalkableSpriteUrl(identityToAvatarConfig(identity))
}

export function characterIdentityFromAvatarConfig(config: AvatarConfig | null): CharacterIdentity | null {
  if (!config?.nationKey || !config?.archetypeKey) return null
  return {
    nationKey: config.nationKey,
    archetypeKey: config.archetypeKey,
    variant: config.variant,
    domainKey: config.domainKey,
    genderKey: config.genderKey,
  }
}
