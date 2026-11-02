import { describe, expect, it } from 'vitest'
// Lantern Hall engine (six-faces-council council/callsheets/lantern-hall.md, brief "Lantern Hall, portable kit").
// The fixtures are the v6 reel's own engine run over its 19-step script (council artifacts/lantern-hall/v6), once with
// the reel's seeded intake and once with a tagged intake that fogs Not capable. The port must read out the same lines.
import { apply, blockLeft, cmdNeed, CMD, init, KEEPS, nHeld, run, strike, type Intake, type State } from '../engine'
import { REEL_INTAKE, SCRIPT } from '../script'
import { memoryStore, parseIntake } from '../store'
import v6 from './fixtures/v6-states.json'
import v6tagged from './fixtures/v6-states-tagged.json'

const strip = (s: State) => ({ w: s.w, oil: s.oil, lit: s.lit, fx: s.fx, opened: s.opened, minted: s.minted, dealt: s.dealt, milestones: s.milestones, keeps: s.keeps })

describe('lantern engine replays the v6 script', () => {
  it('has the nineteen steps', () => expect(SCRIPT).toHaveLength(19))

  it('matches the reel step for step with the seeded intake', () => {
    const states = run(REEL_INTAKE, SCRIPT)
    states.forEach((s, i) => expect(strip(s), `step ${i}: ${SCRIPT[i].title}`).toEqual(strip(v6.states[i] as unknown as State)))
    expect(states[18].opened).toBe(true)
    expect(states[0].fx).toContain('The block takes 12 refinements')
  })

  it('matches the reel step for step with a tagged intake and a fogged keep', () => {
    const intake = v6tagged.intake as unknown as Intake
    const states = run(intake, SCRIPT)
    states.forEach((s, i) => expect(strip(s), `step ${i}`).toEqual(strip(v6tagged.states[i] as unknown as State)))
    expect(states[18].opened).toBe(false) // two keeps still dark: another intake
  })
})

describe('fog', () => {
  const fogged: Pick<Intake, 'res' | 'tags'> = { res: [true, true, true, false, true, true], tags: [{}, {}, {}, {}, {}, {}] }

  it('a fogged keep never counts as held and adds nothing to the block', () => {
    const s = init(fogged)
    expect(s.keeps[3].fog).toBe(true)
    expect(s.keeps[3].held).toBe(false)
    expect(nHeld(s)).toBe(0)
    expect(blockLeft(s)).toBe(10)
  })

  it('opening the work ignores fogged keeps but does not count them as held', () => {
    let s = init(fogged)
    for (const i of [1, 2, 4, 5]) s.keeps[i].loops.forEach(l => { l.g = 0 })
    for (const i of [1, 2, 4, 5]) s.keeps[i].held = true
    s.keeps[0].loops.forEach(l => { l.g = 0 }); s.keeps[0].held = true
    s = apply(s, { w: 1, type: 'open' })
    expect(s.opened).toBe(true)
    expect(nHeld(s)).toBe(5)
    expect(s.keeps[3].held).toBe(false)
  })

  it('a strike on a fogged keep brings it out of the fog', () => {
    const s = init(fogged)
    const line = strike(s, 3, 1, 'metal', 'You')
    expect(s.keeps[3].fog).toBe(false)
    expect(line).toContain('comes out of the fog')
    expect(s.keeps[3].loops).toEqual([{ ch: 'metal', g: 1 }])
  })
})

describe('the commander', () => {
  it('stays protected until min(3, the other active keeps) are held', () => {
    const s = init(REEL_INTAKE)
    expect(cmdNeed(s)).toBe(3)
    for (const held of [0, 1, 2]) {
      const t: State = JSON.parse(JSON.stringify(s))
      for (let i = 1; i <= held; i++) { t.keeps[i].held = true; t.keeps[i].loops.forEach(l => { l.g = 0 }) }
      expect(strike(t, CMD, 2, 'fire', 'You')).toMatch(/protected until 3 keeps are held/)
      expect(t.keeps[CMD].loops[0].g).toBe(2)
    }
    const t: State = JSON.parse(JSON.stringify(s))
    for (let i = 1; i <= 3; i++) { t.keeps[i].held = true; t.keeps[i].loops.forEach(l => { l.g = 0 }) }
    expect(strike(t, CMD, 2, 'fire', 'You')).toMatch(/Strikes for 2/)
  })

  it('needs fewer when fewer keeps are active', () => {
    const s = init({ res: [true, true, false, false, false, false], tags: [{}, {}, {}, {}, {}, {}] })
    expect(cmdNeed(s)).toBe(1)
    expect(strike(s, CMD, 2, 'fire', 'You')).toMatch(/protected until 1 keeps/)
  })

  it('in the script, is first struck only after three keeps are held', () => {
    const states = run(REEL_INTAKE, SCRIPT)
    SCRIPT.forEach((m, i) => {
      if (m.keep !== CMD || !['story', 'fire', 'kibitzIn'].includes(m.type)) return
      const before = i ? states[i - 1] : init(REEL_INTAKE)
      if (states[i].keeps[CMD].loops[0].g < before.keeps[CMD].loops[0].g) expect(nHeld(before)).toBeGreaterThanOrEqual(3)
    })
  })
})

describe('moves', () => {
  it('a story move strikes for 2 when its kind matches, 1 when it differs, and needs a witness on witness keeps', () => {
    const s0 = init(REEL_INTAKE)
    const hit = (kind: 'Ground' | 'Ask', withWitness = true) => apply(s0, { w: 1, type: 'story', keep: 1, ch: 'earth', kind, withWitness })
    expect(hit('Ground').keeps[1].loops[0].g).toBe(0)
    expect(hit('Ask').keeps[1].loops[0].g).toBe(1)
    expect(hit('Ground', false).keeps[1].loops[0].g).toBe(2)
    expect(KEEPS[1].witness).toBe(true)
  })

  it('untouched keeps grow by 1 at the end of a watch, capped at 3', () => {
    let s = init(REEL_INTAKE)
    s = apply(s, { w: 1, type: 'tick' }); s = apply(s, { w: 1, type: 'tick' })
    s.keeps.forEach(k => expect(k.loops[0].g).toBe(3))
  })

  it('oil refills to 4 each watch', () => {
    let s = init(REEL_INTAKE)
    s = apply(s, { w: 1, type: 'ghost', keep: 5, ch: 'water' })
    expect(s.oil).toBe(3)
    s = apply(s, { w: 2, type: 'read' })
    expect(s.oil).toBe(4)
  })
})

describe('store', () => {
  it('round-trips an intake in the intake/game shape and refuses a malformed one', async () => {
    const st = memoryStore()
    await st.saveIntake('t1', REEL_INTAKE)
    expect(await st.loadIntake('t1')).toEqual(parseIntake(REEL_INTAKE))
    await expect(st.saveIntake('t2', { ...REEL_INTAKE, res: [true] })).rejects.toThrow()
    expect(parseIntake({ ...REEL_INTAKE, tags: [{ fire: 9, sky: 2 }, {}, {}, {}, {}, {}] })!.tags[0]).toEqual({})
  })
})
