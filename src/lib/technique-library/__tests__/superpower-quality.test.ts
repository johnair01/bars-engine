import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { SUPERPOWERS, type Loadout } from '../vocabulary'
import { scoreLoadoutOverCampaign, superpowerDeck, type BaseCoord } from '../superpowers'
import { assessQuality } from '../quality'

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

  it('floor-raise + hero cells: 12 L4, 48 L2, 24 campaign-ready', () => {
    const score = scoreLoadoutOverCampaign(LOADOUT, baseCards)
    expect(score.byLevel[4]).toBe(12) // 6 escape_artist inner + 6 connector outer hero cells
    expect(score.byLevel[2]).toBe(48) // the generated remainder now sits at the L2 floor
    expect(score.byLevel[0]).toBe(0) // nothing left at L0
    expect(score.belowL3).toBe(48) // L2 is still below the "usable" L3 bar
    expect(score.campaignReadyCells).toBe(24) // 6 shared (move×face) coords × 4 domains
  })

  it('storyteller/storyteller loadout is lifted too (12 L4, 24 ready)', () => {
    const score = scoreLoadoutOverCampaign({ inner: 'storyteller', outer: 'storyteller' }, baseCards)
    expect(score.byLevel[4]).toBe(12) // 6 inner + 6 outer authored storyteller hero cells
    expect(score.campaignReadyCells).toBe(24)
  })

  it('coach/coach loadout is lifted too (12 L4, 24 ready)', () => {
    const score = scoreLoadoutOverCampaign({ inner: 'coach', outer: 'coach' }, baseCards)
    expect(score.byLevel[4]).toBe(12) // 6 inner + 6 outer authored coach hero cells
    expect(score.campaignReadyCells).toBe(24)
  })

  it('no published superpower card scores below L3 (publish gate)', () => {
    for (const sp of SUPERPOWERS) {
      for (const c of superpowerDeck(sp)) {
        if (c.status === 'published') {
          expect(assessQuality(c).level, `${c.id} must be ≥ L3 to publish`).toBeGreaterThanOrEqual(3)
        }
      }
    }
  })

  it('is deterministic', () => {
    expect(scoreLoadoutOverCampaign(LOADOUT, baseCards)).toEqual(
      scoreLoadoutOverCampaign(LOADOUT, baseCards),
    )
  })
})
