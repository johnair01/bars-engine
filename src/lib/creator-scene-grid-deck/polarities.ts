/**
 * Scene Atlas — grid suits = Cartesian product of two **axis pairs** (2×2 → 4 quadrants).
 * Types are `GridAxisPair`, not Prisma `Polarity` (NationMove taxonomy).
 *
 * Labels can come from: (1) adventure JSON, (2) nation + **playbook** (`Archetype` row → overlay profile), (3) default.
 * BarDeckCard.suit keys stay stable; only display copy changes.
 *
 * @see .specify/specs/creator-scene-grid-deck/spec.md
 */

import {
  getGridPair2FromPlaybookProfile,
  getPair2FromTrigram,
  parseTrigramKeyFromArchetypeName,
  resolvePlaybookProfileFromArchetypeRow,
} from '@/lib/creator-scene-grid-deck/archetype-trigram-polarities'
import { rankLabel, type SceneGridSuitKey } from '@/lib/creator-scene-grid-deck/suits'

/** One grid axis: two named poles (order matters for quadrant mapping). */
export type GridAxisPair = {
  negativeLabel: string
  positiveLabel: string
}

/** @deprecated Use GridAxisPair — alias for older call sites */
export type PolarityPair = GridAxisPair

export type GridAxisSource = 'default' | 'adventure' | 'derived' | 'oriented'

/** @deprecated Use GridAxisSource */
export type GridPolaritySource = GridAxisSource

export type ResolvedGridPolarities = {
  source: GridAxisSource
  pair1: GridAxisPair
  pair2: GridAxisPair
  /** Adventure slug, quest id, or derivation note */
  provenance?: string
}

/** Map `gridPolarities.source` in storyProgress JSON → UI resolution channel. */
export function gridAxisSourceFromStoredJson(storedSource: string | undefined): 'adventure' | 'oriented' {
  if (storedSource === 'oriented') return 'oriented'
  return 'adventure'
}

/**
 * Convention (matches seeded keys):
 * - pair1.negative = “top” pole, pair1.positive = “bottom” pole
 * - pair2.negative = first relational pole (e.g. lead), pair2.positive = second (e.g. follow)
 */
export function quadrantLabelsFromPairs(pairs: { pair1: GridAxisPair; pair2: GridAxisPair }): Record<
  SceneGridSuitKey,
  string
> {
  const { pair1, pair2 } = pairs
  return {
    SCENE_GRID_TOP_DOM: `${pair1.negativeLabel} · ${pair2.negativeLabel}`,
    SCENE_GRID_TOP_SUB: `${pair1.negativeLabel} · ${pair2.positiveLabel}`,
    SCENE_GRID_BOTTOM_DOM: `${pair1.positiveLabel} · ${pair2.negativeLabel}`,
    SCENE_GRID_BOTTOM_SUB: `${pair1.positiveLabel} · ${pair2.positiveLabel}`,
  }
}

export function defaultGridPolarities(): ResolvedGridPolarities {
  return {
    source: 'default',
    pair1: { negativeLabel: 'Top', positiveLabel: 'Bottom' },
    pair2: { negativeLabel: 'Lead', positiveLabel: 'Follow' },
  }
}

/** JSON shape written by Wake Up / orientation adventures (values surfacing). */
export type GridPolaritiesJson = {
  pair1: GridAxisPair
  pair2: GridAxisPair
  source?: string
  adventureSlug?: string
}

export function parseGridPoliciesFromStoryProgress(
  storyProgress: string | null | undefined
): GridPolaritiesJson | null {
  if (!storyProgress?.trim()) return null
  try {
    const o = JSON.parse(storyProgress) as Record<string, unknown>
    const gp = o.gridPolarities
    if (!gp || typeof gp !== 'object' || Array.isArray(gp)) return null
    const g = gp as Record<string, unknown>
    const p1 = g.pair1
    const p2 = g.pair2
    if (!p1 || typeof p1 !== 'object' || !p2 || typeof p2 !== 'object') return null
    const r1 = p1 as Record<string, unknown>
    const r2 = p2 as Record<string, unknown>
    const n1 = String(r1.negativeLabel ?? '').trim()
    const p1p = String(r1.positiveLabel ?? '').trim()
    const n2 = String(r2.negativeLabel ?? '').trim()
    const p2p = String(r2.positiveLabel ?? '').trim()
    if (!n1 || !p1p || !n2 || !p2p) return null
    return {
      pair1: { negativeLabel: n1, positiveLabel: p1p },
      pair2: { negativeLabel: n2, positiveLabel: p2p },
      source: g.source != null ? String(g.source) : undefined,
      adventureSlug: g.adventureSlug != null ? String(g.adventureSlug) : undefined,
    }
  } catch {
    return null
  }
}

type NationPick = { name: string; element: string }
/** Prisma Archetype row — playbook in product language */
type ArchetypeRowPick = { name: string; description: string | null; primaryWaveStage: string | null }

/**
 * Derive grid axes from nation element + playbook (`Archetype` row).
 * Pair2: overlay profile (`ARCHETYPE_PROFILES`) when possible, else trigram parse, else WAVE fallback.
 */
export function derivePolaritiesFromNationArchetype(
  nation: NationPick | null,
  archetype: ArchetypeRowPick | null
): ResolvedGridPolarities | null {
  if (!nation || !archetype) return null

  const el = (nation.element || 'earth').toLowerCase()
  const pair1 = ELEMENT_AXIS[el] ?? ELEMENT_AXIS.earth

  const wave = (archetype.primaryWaveStage || 'wakeUp').toLowerCase()
  const profile = resolvePlaybookProfileFromArchetypeRow(archetype)

  let pair2raw: { a: string; b: string }
  let axisNote: string

  if (profile) {
    pair2raw = getGridPair2FromPlaybookProfile(profile)
    axisNote = `playbook:${profile.archetype_id};trigram:${profile.trigram}`
  } else {
    const trigram = parseTrigramKeyFromArchetypeName(archetype.name)
    if (trigram) {
      pair2raw = getPair2FromTrigram(trigram)
      axisNote = `trigram:${trigram}(no-overlay-match)`
    } else {
      pair2raw = WAVE_RELATIONAL_AXIS[wave] ?? WAVE_RELATIONAL_AXIS.wakeup
      axisNote = `wave:${wave}(fallback)`
    }
  }

  return {
    source: 'derived',
    pair1: { negativeLabel: pair1.a, positiveLabel: pair1.b },
    pair2: { negativeLabel: pair2raw.a, positiveLabel: pair2raw.b },
    provenance: `${nation.name} / ${archetype.name}; element:${el}; ${axisNote}`,
  }
}

/** Metaphorical axis per element — pair1 = “vertical / stake” for the grid. */
const ELEMENT_AXIS: Record<string, { a: string; b: string }> = {
  wood: { a: 'Rising', b: 'Rooting' },
  fire: { a: 'Flare', b: 'Ember' },
  earth: { a: 'Surface', b: 'Depth' },
  /** Polarity-shaped: over-define without refine = brittle; refine without define = endless polish. */
  metal: { a: 'Define', b: 'Refine' },
  water: { a: 'Flow', b: 'Still' },
}

/** Archetype primary wave → relational / style axis for pair2. */
const WAVE_RELATIONAL_AXIS: Record<string, { a: string; b: string }> = {
  wakeup: { a: 'Seeing', b: 'Choosing' },
  cleanup: { a: 'Clearing', b: 'Holding' },
  growup: { a: 'Practicing', b: 'Integrating' },
  showup: { a: 'Offering', b: 'Receiving' },
}

export function mergeStoryProgressGridPolarities(
  existing: string | null | undefined,
  polarities: GridPolaritiesJson
): string {
  let base: Record<string, unknown> = {}
  if (existing?.trim()) {
    try {
      base = JSON.parse(existing) as Record<string, unknown>
    } catch {
      base = {}
    }
  }
  return JSON.stringify({
    ...base,
    gridPolarities: {
      pair1: polarities.pair1,
      pair2: polarities.pair2,
      source: polarities.source ?? 'wake-up-orientation',
      adventureSlug: polarities.adventureSlug,
    },
  })
}

export function cardDisplayTitle(suitKey: SceneGridSuitKey, rank: number, polarities: ResolvedGridPolarities): string {
  const row = quadrantLabelsFromPairs(polarities)[suitKey]
  return `${row} · ${rankLabel(rank)}`
}
