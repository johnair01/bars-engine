import { describe, expect, it } from 'vitest'
import { parseIndex, gateBar, crew, type Deck } from '../deck'
import { lineOf, lookOf, plainOf, worldOf, hallOf, DEPARTMENTS, ROOM_W } from '../world'
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

// Every open strand in council/callsheets/INDEX.md on 2026-10-24, so a strand added without a hall fails here first.
const INDEX_2026_10_24 = ('studio-lot work-dbt story-pipeline cave-controls move-nature calrunia-world inner-vessel spirits-in-caves walkthrough '
  + 'artist-corps engine-slice inner-creatures relationship-creature ontology-flows element-settings perceptual-shadow spirit-dissolve jev-asset '
  + 'chapter1-demo shame-coaching cave-levels virtual-launch somatic-ontology wave-room root corpus coaching-pipeline blender-frame-flesh-warp '
  + 'blender-pipeline-test cave-studio studio big-mind-cave game-demo cave-of-lessons morning-menu coaching-site podcast flirtcraft skilled-helper '
  + 'session-cost wave-battle spirit-generator process-retro board-plumbing friendcraft steps-hand email-pipeline spirit-care calrunia-creator').split(' ')

function deck(): Deck {
  return { at: NOW.toISOString(), passengers: parseIndex(INDEX, NOW), crew: crew(), gates: gateBar([], 'Pre-Production'), gateNote: '', source: '' }
}

describe('the deck as a place', () => {
  it('gives each strand the look of its state', () => {
    const looks = Object.fromEntries(deck().passengers.map(p => [p.strand, lookOf(p)]))
    expect(looks).toEqual({ 'studio-lot': 'scaffold', 'work-dbt': 'lit', root: 'bell', corpus: 'vines', 'perceptual-shadow': 'everdoor' })
  })

  it('puts quiet halls at the stern, halls with bells at the bow, and the done strand through the Everdoor', () => {
    const w = worldOf(deck())
    const hall = (id: string) => w.halls.find(h => h.id === id)!
    expect(w.rooms.find(r => r.strand === 'corpus')!.hall).toBe('story')
    // story holds work-dbt (lit, in the Healing practice wing) and corpus (vines): nothing waits or builds, so stern
    expect(hall('story').x).toBeLessThan(w.wheelhouseX)
    expect(w.wheelhouseX).toBeLessThan(w.mastX)
    expect(w.mastX).toBeLessThan(hall('design').x)
    expect(w.rooms.map(r => r.strand)).not.toContain('perceptual-shadow')
    expect(w.done).toEqual(['perceptual-shadow'])
    expect(hall('design').bells).toBe(1)
    expect(w.width).toBeGreaterThan(hall('design').x + hall('design').w / 2)
  })

  it('rings the halls with the most bells nearest the bow', () => {
    const many = INDEX.replace('## Closed', `- [podcast](podcast.md), 2026-10-22: waiting on his look at clip 6.
- [flirtcraft](flirtcraft.md), 2026-10-22: waits on his note on clip 7.

## Closed`)
    const w = worldOf({ ...deck(), passengers: parseIndex(many, NOW) })
    const bow = w.halls.filter(h => h.x > w.mastX)
    expect(bow.map(h => h.bells)).toEqual([...bow.map(h => h.bells)].sort((a, b) => a - b))
    expect(bow[bow.length - 1].id).toBe('post')
    expect(w.halls.filter(h => h.x < w.wheelhouseX).every(h => h.bells === 0 && h.look !== 'scaffold')).toBe(true)
  })

  it('keeps each wing contiguous and every room inside its hall, one storey or the other', () => {
    const w = worldOf(deck())
    for (const h of w.halls) {
      const mine = w.rooms.filter(r => r.hall === h.id)
      for (const r of mine) {
        expect(r.x - ROOM_W / 2).toBeGreaterThanOrEqual(h.x - h.w / 2)
        expect(r.x + ROOM_W / 2).toBeLessThanOrEqual(h.x + h.w / 2)
      }
      for (const wing of h.wings) {
        const xs = mine.map(r => ({ inside: r.x > wing.x0 && r.x < wing.x1, wing: r.wing === wing.name }))
        expect(xs.every(r => r.inside === r.wing)).toBe(true)
      }
    }
    expect(w.rooms.find(r => r.strand === 'work-dbt')!.wing).toBe('Healing practice')
    expect(hallOf('a-strand-nobody-mapped')).toEqual({ hall: 'hold' })
  })

  it('gives every strand in the call sheets a hall', () => {
    const all = DEPARTMENTS.flatMap(d => [...d.rooms, ...d.wings.flatMap(w => w.rooms)])
    expect(new Set(all).size).toBe(all.length)
    for (const s of INDEX_2026_10_24) expect(hallOf(s).hall, s).not.toBe('hold')
  })

  it('thickens the vines with days untouched and keeps the letter to the waiting line', () => {
    const w = worldOf(deck())
    const corpus = w.rooms.find(h => h.strand === 'corpus')!
    expect(corpus.vines).toBeGreaterThan(0.9)
    expect(w.rooms.find(h => h.strand === 'root')!.line).toBe('Waiting on his phone play.')
    expect(lineOf({ ...deck().passengers[0], text: 'word '.repeat(80) }, 40).length).toBeLessThanOrEqual(41)
  })

  it('writes letters in plain words', () => {
    expect(plainOf('waiting on his look at the rebuilt deck (step `ty-boat-look-1`); preview at https://x.vercel.app/a on bars-engine #429'))
      .toBe('Waiting on his look at the rebuilt deck; preview.')
    expect(plainOf('next pass on draft #427 and #430')).toBe('Next pass.')
    expect(plainOf('his note on the dock (inner-vessel)')).toBe('His note on the dock.')
  })

  it('shows the seven stages as islands, the boat at Pre-Production', () => {
    const w = worldOf(deck())
    expect(w.islands).toHaveLength(7)
    expect(w.islands.find(i => i.state === 'here')!.stage).toBe('Pre-Production')
  })

  it('keeps a ship\'s log of the last week, newest first, in plain words', () => {
    const log = worldOf(deck()).log
    expect(log[0]).toBe('Today, the crew raised scaffolding on studio lot.')
    expect(log).toContain('4 days ago, a light came on in work dbt.')
    expect(log.some(l => l.includes('corpus') || l.includes('perceptual'))).toBe(false) // older than a week
    expect(log.every(l => !/[`#\[]/.test(l))).toBe(true)
  })

  it('serves a game page with no list or panel markup', () => {
    const html = studioPage(deck())
    expect(html).toContain('phaser@3.80.1')
    expect(html).toContain('/studio/boat.js')
    expect(html).not.toMatch(/<(ul|ol|table)\b/)
    expect(html).not.toContain('</script><script>alert')
  })
})
