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

  it('hero cells lift the campaign-ready count (12 L4, 24 ready cells)', () => {
    const score = scoreLoadoutOverCampaign(LOADOUT, baseCards)
    expect(score.byLevel[4]).toBe(12) // 6 escape_artist inner + 6 connector outer hero cells
    expect(score.byLevel[0]).toBe(48) // the still-generated remainder
    expect(score.belowL3).toBe(48)
    expect(score.campaignReadyCells).toBe(24) // 6 shared (move×face) coords × 4 domains
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
