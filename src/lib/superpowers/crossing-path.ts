/**
 * Reveal → Aligned Action data (superpower-route design handoff).
 *
 * Bridges a scored superpower to (a) its element channel + Wuxing nation label
 * used to color the reveal card, and (b) its matched path in The Crossing — the
 * live campaign — so a taker can move from *finding* their superpower to *making
 * one concrete move* with minimal friction.
 *
 * The element channel is the arc's neutral anchor element (ADR 0002: a superpower
 * is an arc, not a single Wuxing channel — this is a card-frame default, not an
 * identity claim). The Crossing path map mirrors the real roles in
 * `the-crossing-support-moves.ts`; if a role id changes, update it here.
 */
import type { Superpower } from './types'
import { SUPERPOWER_DEFS } from './types'
import { arcAnchorElement } from './arc'
import type { ElementKey } from '@/lib/ui/card-tokens'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import type { TheCrossingSupportRoleId } from '@/lib/the-crossing-support-moves'

/** Wuxing nation label per element (mirrors NATION_KEY_TO_ELEMENT). */
const NATION_LABEL: Record<ElementKey, string> = {
  fire: 'Pyrakanth · Fire',
  water: 'Lamenth · Water',
  wood: 'Virelune · Wood',
  metal: 'Argyra · Metal',
  earth: 'Meridia · Earth',
}

/** Element channel that colors a superpower's reveal card + sigil (arc anchor). */
export function superpowerElement(sp: Superpower): ElementKey {
  return arcAnchorElement(SUPERPOWER_DEFS[sp].arc)
}

/** The Wuxing glyph (火水木金土) for a superpower's element channel. */
export function superpowerSigil(sp: Superpower): string {
  return ELEMENT_TOKENS[superpowerElement(sp)].sigil
}

/** Nation eyebrow (e.g. "MERIDIA · EARTH") for a superpower's element channel. */
export function superpowerNation(sp: Superpower): string {
  return NATION_LABEL[superpowerElement(sp)]
}

/** A superpower's matched way in to The Crossing. */
export interface CrossingPath {
  /** Real role id in `the-crossing-support-moves.ts` — links to its detail page. */
  roleId: TheCrossingSupportRoleId
  /** Human role name as shown on the campaign. */
  roleLabel: string
  /** Short chip abbreviation for the matched-move badge. */
  abbr: string
  /** The one-tiny-move sentence this superpower can make right now. */
  move: string
}

/**
 * Superpower → matched Crossing path. Role ids are the real ones on the campaign
 * (`car_scout`, `car_expert`, `connector`, `signal_booster`, `encourager`).
 */
export const CROSSING_PATH: Record<Superpower, CrossingPath> = {
  connector: {
    roleId: 'connector',
    roleLabel: 'Connector',
    abbr: 'Intro',
    move: 'Make one warm introduction toward a car or funds.',
  },
  storyteller: {
    roleId: 'signal_booster',
    roleLabel: 'Signal Booster',
    abbr: 'Boost',
    move: 'Share the ask with one sentence on why it matters.',
  },
  strategist: {
    roleId: 'car_scout',
    roleLabel: 'Car Scout',
    abbr: 'Scout',
    move: 'Surface one concrete car lead Wendell can act on.',
  },
  disruptor: {
    roleId: 'car_expert',
    roleLabel: 'Car Expert',
    abbr: 'Vet',
    move: 'Pressure-test a listing — catch the bad deal before it happens.',
  },
  alchemist: {
    roleId: 'encourager',
    roleLabel: 'Encourager',
    abbr: 'Tend',
    move: 'Send one note that keeps the momentum — and the person — alive.',
  },
  escape_artist: {
    roleId: 'car_expert',
    roleLabel: 'Car Expert',
    abbr: 'Off-ramp',
    move: 'Call the honest go / no-go — name the off-ramp from a bad buy.',
  },
  coach: {
    roleId: 'encourager',
    roleLabel: 'Encourager',
    abbr: 'Call up',
    move: 'Send one note that calls someone up to their next step.',
  },
}

/** Link to a role's detail page on The Crossing. */
export function crossingRoleHref(roleId: TheCrossingSupportRoleId): string {
  return `/campaign/the-crossing/role/${roleId}`
}

/** The Crossing campaign landing (the "See all paths" target). */
export const THE_CROSSING_HREF = '/campaign/the-crossing'
