/**
 * ARDS Register 6 (Zone/Texture) — tileable backgrounds + SURFACE_TOKENS base.
 * @see docs/SEMANTIC_REGISTERS.md
 */

import type { CSSProperties } from 'react'

import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'

export const ZONE_TEXTURE_URLS = {
  vault: '/textures/zone-vault.png',
  lobby: '/textures/zone-lobby.png',
  quest: '/textures/zone-quest.png',
} as const

export type ZoneTextureId = keyof typeof ZONE_TEXTURE_URLS

/** Full-screen zone backdrop (repeat tile + canonical base color). */
export function zoneBackgroundStyle(kind: ZoneTextureId): CSSProperties {
  return {
    backgroundColor: SURFACE_TOKENS.bgBase,
    backgroundImage: `url(${ZONE_TEXTURE_URLS[kind]})`,
    backgroundRepeat: 'repeat',
  }
}
