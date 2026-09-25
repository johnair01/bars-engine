/**
 * Emotional Alchemy — channel → element visual tokens (the ONE source).
 * Design: .specify/specs/emotional-alchemy-diagnostic/DESIGN_HANDOFF.md (A1–A3)
 *
 * Replaces the ad-hoc CHANNEL_META/CHANNEL_ACCENT color maps the UI covenant
 * forbids (law 7, law 14). Everything derives from ELEMENT_TOKENS via the
 * canonical EMOTION_TO_ELEMENT bridge — no element hex lives in a component.
 *
 * Register discipline (UI_COVENANT law 10 — pre-card must read distinct from
 * post-card): the diagnostic is PRE-CARD. Chips are neutral at rest and carry a
 * muted element *tint* only when selected (no glow — a preview, not a formed
 * card). The threshold accent (the read) is the single place a gem appears.
 */

import type { CSSProperties } from 'react'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import type { ElementKey } from '@/lib/ui/card-tokens'
import { EMOTION_TO_ELEMENT } from './registry'
import type { EmotionChannel } from './types'

export function channelElement(channel: EmotionChannel): ElementKey {
  return EMOTION_TO_ELEMENT[channel]
}

/**
 * Selected-chip tint — muted ELEMENT_TOKENS classes (border + bg + text), no
 * glow. Standard Tailwind utilities from the token module (migration Pattern A),
 * not arbitrary values. Reads as a hint at chip scale, never a formed card.
 */
export function channelChipClasses(channel: EmotionChannel): string {
  const t = ELEMENT_TOKENS[EMOTION_TO_ELEMENT[channel]]
  return `${t.border} ${t.bg} ${t.textAccent}`
}

/** The channel's gem hex (from the token module — kept out of components). */
export function channelGem(channel: EmotionChannel): string {
  return ELEMENT_TOKENS[EMOTION_TO_ELEMENT[channel]].gem
}

/**
 * Selected-chip treatment A (design handoff, recommended): hairline tint —
 * `1px solid {frame}` + a `color-mix({gem} 12%, surface-card)` wash, NO glow.
 * Dissatisfied-altitude weight: reads as "unformed," never a formed card.
 */
export function channelChipStyleA(channel: EmotionChannel): CSSProperties {
  const t = ELEMENT_TOKENS[EMOTION_TO_ELEMENT[channel]]
  return {
    borderColor: t.frame,
    backgroundColor: `color-mix(in srgb, ${t.gem} 12%, #141412)`,
    color: '#e8e6e0',
  }
}

/**
 * Threshold accent for the read — the gem as a bottom-border color with a soft
 * 4px glow (neutral altitude weight, per ALTITUDE_TOKENS.neutral). This is the
 * one pre-practice place element enters: the charge is becoming legible.
 */
export function channelThresholdStyle(channel: EmotionChannel): CSSProperties {
  const t = ELEMENT_TOKENS[EMOTION_TO_ELEMENT[channel]]
  return { borderColor: t.gem, boxShadow: `0 3px 4px -2px ${t.cssVarGlow}66` }
}
