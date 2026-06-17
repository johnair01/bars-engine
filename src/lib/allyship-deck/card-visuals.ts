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
