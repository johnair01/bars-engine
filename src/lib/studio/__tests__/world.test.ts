import { describe, expect, it } from 'vitest'
import { parseIndex, gateBar, crew, type Deck } from '../deck'
import { lineOf, lookOf, worldOf, HOUSE_W } from '../world'
import { studioPage } from '../page'

const NOW = new Date('2026-10-24T12:00:00Z')
const INDEX = `## Open strands
- [studio-lot](studio-lot.md), 2026-10-24: rebuild on #429; next the Lantern deck in Phaser.
- [work-dbt](work-dbt.md), 2026-10-20: next pass work-dbt 3 on the face table.
- [root](root.md), 2026-10-11: waiting on his phone play (T1).
- [corpus](corpus.md), 2026-10-05: corpus built in game-masters-guide.
- [perceptual-shadow](perceptual-shadow.md), 2026-10-16: done. Merged in bars-engine #326.

## Closed (no sheet)
`

function deck(): Deck {
  return { at: NOW.toISOString(), passengers: parseIndex(INDEX, NOW), crew: crew(), gates: gateBar([], 'Pre-Production'), gateNote: '', source: '' }
}

describe('the deck as a place', () => {
  it('gives each strand the look of its state', () => {
    const looks = Object.fromEntries(deck().passengers.map(p => [p.strand, lookOf(p)]))
    expect(looks).toEqual({ 'studio-lot': 'scaffold', 'work-dbt': 'lit', root: 'bell', corpus: 'vines', 'perceptual-shadow': 'everdoor' })
  })

  it('puts resting houses at the stern, bells at the bow, and the done strand through the Everdoor', () => {
    const w = worldOf(deck())
    const x = (s: string) => w.houses.find(h => h.strand === s)!.x
    expect(x('corpus')).toBeLessThan(w.wheelhouseX)
    expect(w.wheelhouseX).toBeLessThan(w.mastX)
    expect(w.mastX).toBeLessThan(x('studio-lot'))
    expect(x('studio-lot')).toBeLessThan(x('root'))
    expect(w.houses.map(h => h.strand)).not.toContain('perceptual-shadow')
    expect(w.done).toEqual(['perceptual-shadow'])
    expect(w.width).toBeGreaterThan(x('root') + HOUSE_W / 2)
  })

  it('thickens the vines with days untouched and keeps the letter to the waiting line', () => {
    const w = worldOf(deck())
    const corpus = w.houses.find(h => h.strand === 'corpus')!
    expect(corpus.vines).toBeGreaterThan(0.9)
    expect(w.houses.find(h => h.strand === 'root')!.line).toBe('waiting on his phone play (T1)')
    expect(lineOf({ ...deck().passengers[0], text: 'word '.repeat(80) }, 40).length).toBeLessThanOrEqual(41)
  })

  it('shows the seven stages as islands, the boat at Pre-Production', () => {
    const w = worldOf(deck())
    expect(w.islands).toHaveLength(7)
    expect(w.islands.find(i => i.state === 'here')!.stage).toBe('Pre-Production')
  })

  it('serves a game page with no list or panel markup', () => {
    const html = studioPage(deck())
    expect(html).toContain('phaser@3.80.1')
    expect(html).toContain('/studio/boat.js')
    expect(html).not.toMatch(/<(ul|ol|table)\b/)
    expect(html).not.toContain('</script><script>alert')
  })
})
