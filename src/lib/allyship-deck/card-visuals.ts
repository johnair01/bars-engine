/**
 * Allyship Deck — card visual system (pure).
 *
 * The single source of truth for how a move card *looks*: move→element channel,
 * the reserved liminal palette for Open Up, operation ("face") monogram colors, the
 * move glyph SVG paths, and brand constants (gold edge, inset-top highlight). All values
 * trace to `card-tokens.ts` (`ELEMENT_TOKENS`) so the deck stays in the engine's palette.
 *
 * Recreated from the design handoff (`Deck Experience` prototype: theme/pip/faceBadge/
 * cardRoot). No React, no DB — safe to unit-test and import anywhere.
 *
 * @see .specify/specs/allyship-deck-experience/spec.md
 */

import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import type { BasicMove, Operation, AllyshipDomain } from './types'

/** Brand gold — the 2px card edge + ♦ accent, constant across every card. */
export const DECK_GOLD = '#C9A84C'

/** Inset-top highlight on every card body — do not remove (handoff brand constant). */
export const INSET_TOP = 'inset 0 1px 0 rgba(255,255,255,.06)'

/**
 * Reserved liminal/threshold purple — Open Up is the 5th move and has authored cards,
 * but it is *not* an element; purple is the engine's reserved action/threshold color.
 */
export const LIMINAL = {
  frame: '#7c3aed',
  glow: '#a855f7',
  gradFrom: '#241a3e',
  gradTo: '#100a1f',
} as const

/** Font stacks from the handoff (graceful fallback until the webfonts are wired). */
export const DECK_FONTS = {
  display: "'Jost', 'Futura PT', system-ui, sans-serif",
  body: "'Nunito', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
} as const

/** Move → element color channel. Open Up uses the reserved liminal purple. */
export const MOVE_ELEMENT: Record<BasicMove, ElementKey | 'liminal'> = {
  show_up: 'fire',
  grow_up: 'wood',
  clean_up: 'water',
  wake_up: 'earth',
  open_up: 'liminal',
}

export interface CardTheme {
  gradFrom: string
  gradTo: string
  glow: string
  gem: string
  frame: string
}

/** Resolve a move's card theme — element tokens, or the reserved liminal palette. */
export function themeForMove(move: BasicMove): CardTheme {
  const el = MOVE_ELEMENT[move]
  if (el === 'liminal') {
    return {
      gradFrom: LIMINAL.gradFrom,
      gradTo: LIMINAL.gradTo,
      glow: LIMINAL.glow,
      gem: LIMINAL.glow,
      frame: LIMINAL.frame,
    }
  }
  const t = ELEMENT_TOKENS[el]
  return { gradFrom: t.gradFrom, gradTo: t.gradTo, glow: t.glow, gem: t.gem, frame: t.frame }
}

// ─── Card back — "Struck Gold" treatment ─────────────────────────────────────
// The premium print-and-store back of every card (design handoff: Struck Gold /
// Back A). Built in the canonical 460×644 card space; scale the whole thing with a
// CSS transform to keep every layer pixel-faithful at any size.

/** Canonical card-back geometry (2.5:3.5). All back layers are authored in this space. */
export const CARD_BACK = { width: 460, height: 644 } as const

/** The MTGOA mark used on every back surface (transparent PNG, served from /public). */
export const MTGOA_MARK_SRC = '/allyship-deck/mtgoa-logo-transparent.png'

/** Simulated gold-foil gradient (115°) — the frame ring + foil chrome. */
export const FOIL_GRADIENT =
  'linear-gradient(115deg,#7d5f22,#e9d290,#fff7da,#c9a14a,#fdf2c0,#b8862e,#f1e2a0,#8a6d28)'

/**
 * Woven-rosette guilloché ring as an SVG path. `r(θ) = baseR + amp·cos(petals·θ + phase)`,
 * sampled around the circle. The engraved field is a stack of these (see `guillocheField`).
 */
export function rosettePath(
  cx: number,
  cy: number,
  baseR: number,
  amp: number,
  petals: number,
  phase: number,
): string {
  const steps = 260
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const rr = baseR + amp * Math.cos(petals * t + phase)
    pts.push(`${(cx + rr * Math.cos(t)).toFixed(1)},${(cy + rr * Math.sin(t)).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
}

/**
 * The engraved guilloché field behind the mark — concentric woven rings, alternating
 * phase. Defaults match the Struck Gold back (`guilloche(230,322, r0 64→r1 250, 11 rings,
 * amp 9, petals 18)`).
 */
export function guillocheField(
  cx = 230,
  cy = 322,
  r0 = 64,
  r1 = 250,
  rings = 11,
  amp = 9,
  petals = 18,
): string[] {
  const out: string[] = []
  for (let i = 0; i < rings; i++) {
    const f = rings === 1 ? 0 : i / (rings - 1)
    const baseR = r0 + (r1 - r0) * f
    out.push(rosettePath(cx, cy, baseR, amp, petals, ((i % 2) * Math.PI) / petals))
  }
  return out
}

/** Operation ("face") monogram color. Faces are channel-agnostic — this is identity only. */
export const FACE_COLOR: Record<Operation, string> = {
  shaman: '#6fd0d0',
  challenger: '#e8896f',
  regent: '#e0c25a',
  architect: '#9fb2c8',
  diplomat: '#6fc795',
  sage: '#a99ae0',
}

/** Move glyph SVG paths (viewBox 0 0 64 64). `clean_up` is filled; the rest are stroked. */
export const MOVE_ICON_PATHS: Record<BasicMove, string[]> = {
  wake_up: ['M14 44 H50', 'M24 44 A8 8 0 0 1 40 44', 'M32 22 V14', 'M44 25 L48 21', 'M20 25 L16 21'],
  clean_up: ['M32 13 L36 28 L51 32 L36 36 L32 51 L28 36 L13 32 L28 28 Z'],
  grow_up: ['M32 51 V27', 'M32 34 C24 34 20 27 20 18', 'M32 30 C40 30 44 24 44 15', 'M22 53 H42'],
  show_up: ['M17 51 V25 Q32 11 47 25 V51', 'M27 51 L29 39 Q32 35 35 39 L37 51'],
  open_up: ['M27 16 Q15 32 27 48', 'M37 16 Q49 32 37 48', 'M32 30 V24', 'M26 33 L22 29', 'M38 33 L42 29'],
}

/** Which move glyphs render filled (vs stroked). */
export const MOVE_ICON_FILLED: Record<BasicMove, boolean> = {
  wake_up: false,
  clean_up: true,
  grow_up: false,
  show_up: false,
  open_up: false,
}

export const MOVE_LABELS: Record<BasicMove, string> = {
  wake_up: 'Wake Up',
  open_up: 'Open Up',
  clean_up: 'Clean Up',
  grow_up: 'Grow Up',
  show_up: 'Show Up',
}

export const OPERATION_LABELS: Record<Operation, string> = {
  shaman: 'Shaman',
  challenger: 'Challenger',
  regent: 'Regent',
  architect: 'Architect',
  diplomat: 'Diplomat',
  sage: 'Sage',
}

export const DOMAIN_LABELS: Record<AllyshipDomain, string> = {
  GATHERING_RESOURCES: 'Gather Resources',
  RAISE_AWARENESS: 'Raise Awareness',
  DIRECT_ACTION: 'Direct Action',
  SKILLFUL_ORGANIZING: 'Skillful Organizing',
}
