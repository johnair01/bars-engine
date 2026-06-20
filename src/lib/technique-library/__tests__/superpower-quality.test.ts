import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Loadout } from '../vocabulary'
import { scoreLoadoutOverCampaign, type BaseCoord } from '../superpowers'

const baseCards: BaseCoord[] = (
  JSON.parse(
    readFileSync(join(process.cwd(), 'public', 'allyship-deck', 'allyship-deck.json'), 'utf8'),
  ) as { cards: Array<{ kind: string; move: BaseCoord['move']; operation: BaseCoord['operation'] }> }
).cards
  .filter((c) => c.kind === 'move')
  .map((c) => ({ move: c.move, operation: c.operation }))

const LOADOUT: Loadout = { inner: 'escape_artist', outer: 'connector' }

describe('car-campaign quality harness', () => {
  it('walks all 120 base cells', () => {
    const score = scoreLoadoutOverCampaign(LOADOUT, baseCards)
    expect(score.baseCells).toBe(120)
  })

  it('surfaces distinct inner+outer cards (≤120) and scores them', () => {
    const score = scoreLoadoutOverCampaign(LOADOUT, baseCards)
    // 30 inner (escape_artist) + 30 outer (connector) distinct coordinates
    expect(score.distinct.length).toBe(60)
    expect(score.distinct.every((c) => c.level >= 0)).toBe(true)
  })

  it('current generated decks are all below L3 (the baseline gap)', () => {
    const score = scoreLoadoutOverCampaign(LOADOUT, baseCards)
    expect(score.belowL3).toBe(score.distinct.length)
    expect(score.campaignReadyCells).toBe(0)
  })

  it('is deterministic', () => {
    expect(scoreLoadoutOverCampaign(LOADOUT, baseCards)).toEqual(
      scoreLoadoutOverCampaign(LOADOUT, baseCards),
    )
  })
})
