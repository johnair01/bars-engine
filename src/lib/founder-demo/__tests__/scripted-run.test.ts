import { describe, expect, it } from 'vitest'
import { RUNS, runChain, render, standIns, MissingPiece } from '../scripted-run'

const run = (i: number) => runChain(RUNS[i].name, RUNS[i].seed, RUNS[i].choice)

describe('founder support scripted run', () => {
  it('is deterministic: the same seed prints the same run', () => {
    expect(render(run(0))).toBe(render(run(0)))
  })
  it('run A takes one place, grows a second crop, and the count reads 1 of 300', () => {
    const r = run(0)
    expect(r.failed).toBeUndefined()
    expect(r.state.quest).toBe('met')
    expect(r.state.seeds).toHaveLength(1)
    expect(r.state.seeds[0].kind).toBe('show')
    const crops = Object.values(r.state.farm.slots).filter((s) => s.plant?.crop)
    expect(crops).toHaveLength(1)
    expect(crops[0].plant!.crop!.form).toBe('Raise Awareness')
    expect(r.state.sharedLine).toBe('1 of about 300 shipped')
    expect(r.state.marks).toEqual(['seen', 'shipped'])
  })
  it('run B takes none: quest met, nothing written, no later prompt', () => {
    const r = run(1)
    expect(r.failed).toBeUndefined()
    expect(r.state.quest).toBe('met')
    expect(r.state.seeds).toHaveLength(0)
    expect(r.state.prompts).toHaveLength(0)
    expect(Object.values(r.state.farm.slots).filter((s) => s.plant)).toHaveLength(0)
  })
  it('run C leaves at the second place, ends cleanly, and the shipped mark still lands', () => {
    const r = run(2)
    expect(r.failed).toBeUndefined()
    expect(r.state.quest).toBe('held')
    expect(r.state.seeds).toHaveLength(0)
    expect(r.state.marks).toContain('shipped')
    expect(r.state.shared).toBe(1)
  })
  it('step 8 leaves the shared count unchanged', () => {
    const r = run(0)
    const l = r.lines.find((x) => x.step === 8 && x.did.startsWith('shared count read'))!
    expect(l.did).toContain('before and after: 0 and 0')
  })
  it('fails loudly when a payment word has no owner', () => {
    const w = standIns()
    w.words.owner = () => undefined
    const r = runChain('x', 1, { place: 'none' }, w)
    expect(r.failed).toMatch(/step 3/)
    expect(new MissingPiece(3, 'x').message).toContain('nothing to read or nowhere to write')
  })
  it('records holes and never a quiet pass', () => {
    for (const i of [0, 1, 2]) {
      const ids = run(i).holes.map((h) => h.id)
      expect(ids.length).toBeGreaterThan(5)
      expect(ids).not.toContain('H-till-mana')
      expect(ids).not.toContain('H-marks')
    }
  })
})
