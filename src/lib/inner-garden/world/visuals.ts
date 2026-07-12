/**
 * Inner Garden — token-driven visuals (stub).
 *
 * A sprite is COMPOSED from data, never hand-assigned per BAR: element→tint,
 * altitude→glow, stage→frame. This is the same three-channel encoding as
 * `UI_COVENANT.md` (element=color, altitude=border, stage=density), so garden sprites
 * and OS deck cards read as one visual system.
 *
 * This stub carries a local element→tint table so the pure lib has no heavy imports and
 * stays tsx-testable. TODO(v2): source these from `ELEMENT_TOKENS` / `ALTITUDE_TOKENS` /
 * `STAGE_TOKENS` in `@/lib/ui/card-tokens` (+ `channelGem` in
 * `@/lib/emotional-alchemy/channel-visuals`) so DOM cards and garden sprites share one
 * source of truth — closing the gap where the Pixi renderer's flat `ANCHOR_COLORS`
 * (`pixi-room.ts`) is disconnected from the token system.
 */
import { decodeConfig, type AnchorData, type Altitude, type ElementKey, type GrowthStage } from './scene'

export interface VisualSpec {
  /** Pixi tint (0xRRGGBB). */
  tint: number
  /** Glow radius in cells; 0 = none. Encodes altitude, not hue. */
  glow: number
  /** Sprite frame index within the crop atlas row. Encodes growth stage. */
  frame: number
  /** Atlas key the renderer resolves to a texture. */
  atlasKey: string
}

// Mirror of ELEMENT_TOKENS gem hexes — replace with a card-tokens import in v2.
const ELEMENT_TINT: Record<ElementKey, number> = {
  fire: 0xef4444,
  water: 0x3b82f6,
  wood: 0x22c55e,
  metal: 0x94a3b8,
  earth: 0xd4a017,
}

const ALTITUDE_GLOW: Record<Altitude, number> = {
  dissatisfied: 0,
  neutral: 1,
  satisfied: 2,
}

const STAGE_FRAME: Record<GrowthStage, number> = {
  seed: 0,
  growing: 1,
  composted: 2,
}

const NEUTRAL_TINT = 0x8b9467

export function visualSpecFor(anchor: AnchorData): VisualSpec {
  const cfg = decodeConfig(anchor.config)
  const element = (cfg.element ?? null) as ElementKey | null
  const altitude = (cfg.altitude ?? 'neutral') as Altitude
  const stage = (cfg.stage ?? 'seed') as GrowthStage

  return {
    tint: element ? ELEMENT_TINT[element] : NEUTRAL_TINT,
    glow: ALTITUDE_GLOW[altitude] ?? 0,
    frame: anchor.anchorType === 'weed' ? 0 : (STAGE_FRAME[stage] ?? 0),
    atlasKey: cfg.skin ? `skin:${cfg.skin}` : anchor.anchorType,
  }
}
