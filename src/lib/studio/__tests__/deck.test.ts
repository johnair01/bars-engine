import { describe, expect, it } from 'vitest'
import { crew, gateBar, moodOf, nextOf, parseIndex, parseLoop } from '../deck'

const INDEX = `# Call sheets

## Open strands
- [studio-lot](studio-lot.md), 2026-10-23: concept done; next a fresh Opus thread builds the boat.
- [root](root.md), 2026-10-11: play page built; waiting on his phone play (T1), then five friends cold.
- [perceptual-shadow](perceptual-shadow.md), 2026-10-16: done. Merged in bars-engine #326.

## Closed (no sheet)
- [old](old.md), 2026-10-01: next nothing.
`

describe('studio deck', () => {
  const now = new Date('2026-10-23T12:00:00Z')

  it('reads only the open strands, with their age and glow', () => {
    const ps = parseIndex(INDEX, now)
    expect(ps.map(p => p.strand)).toEqual(['studio-lot', 'root', 'perceptual-shadow'])
    expect(ps[1].days).toBe(12)
    expect(ps[0].glow).toBe(1)
    expect(ps[1].glow).toBeCloseTo(1 - 12 / 21)
  })

  it('takes each strand mood from its own words', () => {
    expect(parseIndex(INDEX, now).map(p => p.mood)).toEqual(['moving', 'waiting', 'done'])
    expect(moodOf('round 4 waits on that answer or his look')).toBe('waiting')
    expect(moodOf('design only; five positions')).toBe('resting')
    expect(nextOf('built; next his phone play')).toBe('next his phone play')
  })

  it('counts loop rounds built past his last look', () => {
    const l = parseLoop({ strand: 's', loop: 'art', max_ahead: 2, last_look: { round: 19 },
      rounds: [{ round: 19, status: 'done' }, { round: 20, status: 'done' }, { round: 21, status: 'planned' }] })
    expect(l).toEqual({ loop: 'art', round: 20, lastLook: 19, ahead: 1, maxAhead: 2 })
    expect(parseLoop({})).toBeNull()
  })

  it('marks one gate as here and none passed until he passes one', () => {
    const g = gateBar([], 'Pre-Production')
    expect(g).toHaveLength(7)
    expect(g.filter(x => x.state === 'here').map(x => x.stage)).toEqual(['Pre-Production'])
    expect(g.some(x => x.state === 'passed')).toBe(false)
  })

  it('crews the boat without engine specialists, directors first', () => {
    const c = crew()
    expect(c.some(s => s.engine)).toBe(false)
    expect(c[0].tier).toBe('director')
    expect(c.find(s => s.id === 'producer')?.model).toBe('opus')
  })
})
