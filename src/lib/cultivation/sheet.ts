/**
 * The cultivated character's sheet: one pure rules module for players, NPCs and agents.
 * Spec: six-faces-council .specify/specs/cultivated-character/spec.md (FR-003 to FR-009). The numbers match sim.py.
 * Derived values (layers, floor, proficiency, skill, cap) are never stored on the sheet.
 */

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water'
export type Weapon = 'dao' | 'jian' | 'spear' | 'staff' | 'fan' | 'fist'
/** Might, Grace and Root: Wendell's answer A on ccb2-three-stats, 2026-11-14 (FR-009). */
export type Stat = 'might' | 'grace' | 'root'

export const WEAPONS: readonly Weapon[] = ['dao', 'jian', 'spear', 'staff', 'fan', 'fist']
export const STATS: readonly Stat[] = ['might', 'grace', 'root']

export const WEAPON_STAT: Record<Weapon, Stat> = {
  dao: 'might',
  fist: 'might',
  jian: 'grace',
  fan: 'grace',
  spear: 'root',
  staff: 'root',
}

export const QI_PER_MOVE = 10
export const LAYERS_PER_FLOOR = 9
/** Qi a layer costs on the lower, middle and upper floor (FR-004). */
export const LAYER_COST = [30, 60, 120] as const
export const STAT_POINTS_PER_LAYER = 1
export const STAT_WEIGHT = 2
export const CAP_BASE = 10
export const CAP_PER_LAYER = 10
export const MAX_BREAKTHROUGHS = 2

export type Floor = 'lower' | 'middle' | 'upper'

export type Sheet = {
  id: string
  /** Read by the admin only (FR-001). */
  origin: 'player' | 'npc' | 'agent'
  look: Record<string, string>
  priors: {
    archetype: string
    nation: string
    element: Element
    integralLevel?: string
    enneagram?: number
    gender?: string
  }
  /** All qi ever gathered; never falls (FR-003). */
  qi: number
  /** Floors opened past the lower. */
  breakthroughs: 0 | 1 | 2
  /** Stat points placed. */
  stats: Record<Stat, number>
  weapons: Record<Weapon, { uses: number; element: Element }>
}

const FLOORS: readonly Floor[] = ['lower', 'middle', 'upper']

/** Layers reached from qi and breakthroughs. A floor's ninth layer holds until a breakthrough opens the next. */
export function layers(sheet: Pick<Sheet, 'qi' | 'breakthroughs'>): number {
  let qi = sheet.qi
  let reached = 0
  for (let f = 0; f < LAYER_COST.length; f++) {
    for (let i = 0; i < LAYERS_PER_FLOOR; i++) {
      if (qi < LAYER_COST[f]) return reached
      qi -= LAYER_COST[f]
      reached++
    }
    if (sheet.breakthroughs <= f) return reached
  }
  return reached
}

export function floor(sheet: Pick<Sheet, 'breakthroughs'>): Floor {
  return FLOORS[Math.min(sheet.breakthroughs, MAX_BREAKTHROUGHS)]
}

/** True when the ninth layer of the open floor waits on a breakthrough. */
export function heldAtGate(sheet: Pick<Sheet, 'qi' | 'breakthroughs'>): boolean {
  if (sheet.breakthroughs >= MAX_BREAKTHROUGHS) return false
  const nine = LAYERS_PER_FLOOR * (sheet.breakthroughs + 1)
  return layers(sheet) === nine
}

/** Successful uses on a square-root curve: 25 uses give 10, 100 give 20, 400 give 40. */
export function proficiency(uses: number): number {
  return Math.floor(2 * Math.sqrt(Math.max(0, uses)))
}

export function skill(sheet: Sheet, weapon: Weapon): { skill: number; raw: number; cap: number } {
  const raw = proficiency(sheet.weapons[weapon].uses) + STAT_WEIGHT * sheet.stats[WEAPON_STAT[weapon]]
  const cap = CAP_BASE + CAP_PER_LAYER * layers(sheet)
  return { skill: Math.min(raw, cap), raw, cap }
}

/** Adds 10 qi a completed move. Returns the new sheet and how many layers opened, for the glow's pulse. */
export function gainQi<S extends Pick<Sheet, 'qi' | 'breakthroughs'>>(sheet: S, moves: number): { sheet: S; opened: number } {
  const n = Math.max(0, Math.floor(moves))
  const next = { ...sheet, qi: sheet.qi + QI_PER_MOVE * n }
  return { sheet: next, opened: layers(next) - layers(sheet) }
}

/** Adds one successful use. Never checks the cap: uses past it are banked (FR-008). */
export function landStrike(sheet: Sheet, weapon: Weapon): Sheet {
  const w = sheet.weapons[weapon]
  return { ...sheet, weapons: { ...sheet.weapons, [weapon]: { ...w, uses: w.uses + 1 } } }
}

/** Layers reached, times the points a layer gives, minus the points already placed. */
export function pointsToPlace(sheet: Sheet): number {
  const placed = STATS.reduce((sum, s) => sum + sheet.stats[s], 0)
  return STAT_POINTS_PER_LAYER * layers(sheet) - placed
}

/** Places one point in a stat when one is waiting; otherwise returns the sheet unchanged. */
export function placePoint(sheet: Sheet, stat: Stat): Sheet {
  if (pointsToPlace(sheet) <= 0) return sheet
  return { ...sheet, stats: { ...sheet.stats, [stat]: sheet.stats[stat] + 1 } }
}
