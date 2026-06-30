/**
 * Campaign quality harness — score a loadout's surfaced superpower cards across
 * the base grid (move × face × domain).
 * Spec: .specify/specs/superpower-deck-quality/spec.md § Campaign harness
 *
 * Deterministic. Superpower cards are domain-agnostic, so a surfaced card is the
 * same across all four domains of its (move × face) coordinate — the harness
 * scores the distinct surfaced cards and reports campaign-ready base cells
 * (where both the inner and outer slot surface a card at ≥ L3).
 */

import type { MoveCard } from '@/lib/allyship-deck/types'
import type { Loadout, Superpower, MoveAspect } from '../vocabulary'
import type { Technique } from '../types'
import { assessQuality } from '../quality'
import { superpowerDeck } from './decks'
import { superpowerCardId } from './grid'

export type BaseCoord = Pick<MoveCard, 'move' | 'operation'>

export interface CellScore {
  superpower: Superpower
  move: MoveCard['move']
  operation: MoveCard['operation']
  aspect: MoveAspect
  cardId: string
  level: number
}

export interface CampaignScore {
  loadout: Loadout
  /** Distinct surfaced superpower cards (≤ 120: up to 60 inner + 60 outer). */
  distinct: CellScore[]
  byLevel: Record<number, number>
  belowL3: number
  baseCells: number
  /** Base cells where both the inner and outer surfaced cards are ≥ L3. */
  campaignReadyCells: number
}

function indexById(sp: Superpower): Map<string, Technique> {
  return new Map(superpowerDeck(sp).map((c) => [c.id, c]))
}

export function scoreLoadoutOverCampaign(loadout: Loadout, baseCards: BaseCoord[]): CampaignScore {
  const innerIdx = indexById(loadout.inner)
  const outerIdx = indexById(loadout.outer)
  const distinct = new Map<string, CellScore>()
  let ready = 0

  for (const c of baseCards) {
    const innerCard = innerIdx.get(superpowerCardId(loadout.inner, c.move, c.operation, 'inner'))
    const outerCard = outerIdx.get(superpowerCardId(loadout.outer, c.move, c.operation, 'outer'))
    const innerLevel = innerCard ? assessQuality(innerCard).level : -1
    const outerLevel = outerCard ? assessQuality(outerCard).level : -1

    if (innerCard) {
      distinct.set(innerCard.id, {
        superpower: loadout.inner,
        move: c.move,
        operation: c.operation,
        aspect: 'inner',
        cardId: innerCard.id,
        level: innerLevel,
      })
    }
    if (outerCard) {
      distinct.set(outerCard.id, {
        superpower: loadout.outer,
        move: c.move,
        operation: c.operation,
        aspect: 'outer',
        cardId: outerCard.id,
        level: outerLevel,
      })
    }
    if (innerLevel >= 3 && outerLevel >= 3) ready++
  }

  const cells = [...distinct.values()]
  const byLevel: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const d of cells) byLevel[d.level] = (byLevel[d.level] ?? 0) + 1

  return {
    loadout,
    distinct: cells,
    byLevel,
    belowL3: cells.filter((d) => d.level < 3).length,
    baseCells: baseCards.length,
    campaignReadyCells: ready,
  }
}
