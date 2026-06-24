/**
 * Milestone needs — tiered matching + per-unit progress (campaign Phase 3, FR9/FR10).
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 * Ruling: .specify/specs/mobility-quest-superpower-campaign/STRAND_CONSULT_SIX_FACES.md
 *
 * A milestone decomposes into superpower-typed NEEDS. A player sees:
 *   • Tier 1 — needs matching their revealed superpower (+ orientation), then
 *   • Tier 2 — remaining open needs as an "open aid" fallback.
 * Progress aggregates PER UNIT (action | currency | hours), never blended, and
 * internal-orientation needs are tracked separately from external (protects the
 * polarity). Unit-typed, never weighted — no per-action multiplier. Pure, no I/O.
 */
import type { Superpower, SuperpowerOrientation } from './types'

export type NeedUnit = 'action' | 'currency' | 'hours'
export type NeedStatus = 'open' | 'claimed' | 'done'

export interface MilestoneNeed {
  id: string
  milestoneId: string
  superpower: Superpower
  orientation: SuperpowerOrientation
  /** Base allyship card the need translates (deck.json stays source of truth). */
  cardId: string
  /** Six Faces ruling: unit-typed, default action/1, NO multiplier. */
  unit: NeedUnit
  value: number
  status: NeedStatus
  claimedByPlayerId?: string
  title?: string
}

export type NeedTier = 'matched' | 'open'

export interface TieredNeed {
  need: MilestoneNeed
  tier: NeedTier
}

export interface PlayerLens {
  superpower: Superpower
  /** null = orientation not yet chosen; matched on superpower alone then. */
  orientation: SuperpowerOrientation | null
}

/**
 * Tier 1 = open needs matching the player's superpower (and orientation when the
 * player has one); Tier 2 = the remaining open needs (open-aid fallback).
 * Claimed/done needs are excluded. Input order is preserved within each tier.
 */
export function matchNeedsForPlayer(needs: MilestoneNeed[], lens: PlayerLens): TieredNeed[] {
  const open = needs.filter((n) => n.status === 'open')
  const matched: TieredNeed[] = []
  const fallback: TieredNeed[] = []

  for (const need of open) {
    const sameSuperpower = need.superpower === lens.superpower
    const orientationOk = lens.orientation === null || need.orientation === lens.orientation
    if (sameSuperpower && orientationOk) matched.push({ need, tier: 'matched' })
    else fallback.push({ need, tier: 'open' })
  }
  return [...matched, ...fallback]
}

export interface UnitProgress {
  unit: NeedUnit
  done: number
  total: number
}

/** Orientation-split, per-unit progress. Units are never blended together. */
export interface NeedProgress {
  /** External (world-facing) progress, per unit. */
  external: UnitProgress[]
  /** Internal (self-allyship) progress, per unit — tracked separately. */
  internal: UnitProgress[]
}

function sumByUnit(needs: MilestoneNeed[]): UnitProgress[] {
  const units: NeedUnit[] = ['action', 'currency', 'hours']
  const out: UnitProgress[] = []
  for (const unit of units) {
    const ofUnit = needs.filter((n) => n.unit === unit)
    if (ofUnit.length === 0) continue
    const total = ofUnit.reduce((s, n) => s + n.value, 0)
    const done = ofUnit.filter((n) => n.status === 'done').reduce((s, n) => s + n.value, 0)
    out.push({ unit, done, total })
  }
  return out
}

/**
 * Summarize a milestone's needs into honest, per-unit sub-totals, split by
 * orientation so internal self-allyship is never dwarfed by external money/hours.
 */
export function summarizeNeeds(needs: MilestoneNeed[]): NeedProgress {
  return {
    external: sumByUnit(needs.filter((n) => n.orientation === 'external')),
    internal: sumByUnit(needs.filter((n) => n.orientation === 'internal')),
  }
}
