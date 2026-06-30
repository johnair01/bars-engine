/**
 * Superpower reveal — presentation data (the `/superpower` route redesign).
 * Source: design_handoff_superpower_route. Pure presentation; no scoring here.
 *
 * The reveal frames a superpower in a Wuxing element. Per ADR 0002 a superpower
 * is NOT a single element — so the framing element is the arc's *anchor*
 * (`superpowerElement`), which equals the handoff's superpower→element map for
 * all seven, without re-introducing the retired `channel` field.
 */
import type { ElementKey } from '@/lib/ui/card-tokens'
import { SUPERPOWER_DEFS, type Superpower } from './types'
import { arcAnchorElement } from './arc'

/** The element a superpower's reveal card is framed in — the arc's anchor (ADR 0002). */
export function superpowerElement(sp: Superpower): ElementKey {
  return arcAnchorElement(SUPERPOWER_DEFS[sp].arc)
}

/** Element → nation eyebrow ("Meridia · Earth"). Presentation only. */
export const ELEMENT_NATION: Record<ElementKey, string> = {
  fire: 'Pyrakanth · Fire',
  water: 'Lamenth · Water',
  wood: 'Virelune · Wood',
  metal: 'Argyra · Metal',
  earth: 'Meridia · Earth',
}

export interface CrossingPath {
  /** The Crossing role this superpower maps to (mirrors the role's spKey). */
  role: string
  /** Short uppercase chip label. */
  abbr: string
  /** One concrete, tiny first move on the campaign. */
  move: string
}

/**
 * Superpower → matched path in The Crossing. Mirrors the Crossing roles' `spKey`;
 * if those role definitions change, update this map to match.
 */
export const SUPERPOWER_CROSSING: Record<Superpower, CrossingPath> = {
  connector: { role: 'Connector', abbr: 'Intro', move: 'Make one warm introduction toward a car or funds.' },
  storyteller: { role: 'Signal Booster', abbr: 'Boost', move: 'Share the ask with one sentence on why it matters.' },
  strategist: { role: 'Car Scout', abbr: 'Scout', move: 'Surface one concrete car lead Wendell can act on.' },
  disruptor: { role: 'Car Expert', abbr: 'Vet', move: 'Pressure-test a listing — catch the bad deal before it happens.' },
  alchemist: { role: 'Encourager', abbr: 'Tend', move: 'Send one note that keeps the momentum — and the person — alive.' },
  escape_artist: { role: 'Car Expert', abbr: 'Off-ramp', move: 'Call the honest go / no-go — name the off-ramp from a bad buy.' },
  coach: { role: 'Encourager', abbr: 'Call up', move: 'Send one note that calls someone up to their next step.' },
}

/** Where the Aligned Action bridge sends the player. */
export const CROSSING_HREF = '/campaign/the-crossing'

/** Orientation → the human label shown on the reveal. */
export const ORIENTATION_LABEL = {
  internal: 'Internal — self-allyship',
  external: 'External — world-facing allyship',
} as const

/** Deck-gold chrome accent used across the `/superpower` route (handoff). */
export const QUIZ_GOLD = '#d4a017'
