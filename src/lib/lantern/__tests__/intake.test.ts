import { describe, expect, it } from 'vitest'
import { init, nActive } from '../engine'
import { parseIntake } from '../store'
import { blockCost, emptyIntake, mayLeave, pickGoal, raiseNow, raiseTag, toggleRes, toggleTruth, toggleWant } from '../intake'

describe('lantern intake taps', () => {
  it('needs only a goal to go on', () => {
    expect(mayLeave(emptyIntake(), 1)).toBe(false)
    expect(mayLeave(pickGoal(emptyIntake(), 'Make one ask today'), 1)).toBe(true)
    expect(mayLeave(emptyIntake(), 5)).toBe(true)
  })

  it('keeps toward-feelings in channel order and toggles them off', () => {
    let x = toggleWant(emptyIntake(), 'metal')
    x = toggleWant(x, 'fire')
    expect(x.want).toEqual(['fire', 'metal'])
    expect(toggleWant(x, 'fire').want).toEqual(['metal'])
  })

  it('raises intensity Minor, Medium, Major, then off, and turns its truth on once', () => {
    let x = raiseNow(emptyIntake(), 'water')
    expect(x.now.water).toBe(1)
    expect(x.truth.water).toBe(true)
    x = toggleTruth(x, 'water')
    x = raiseNow(raiseNow(x, 'water'), 'water')
    expect(x.now.water).toBe(3)
    expect(x.truth.water).toBe(false)
    x = raiseNow(x, 'water')
    expect(x.now.water).toBeUndefined()
  })

  it('fogs a reservation turned off, and deals tagged loops at their strength', () => {
    let x = pickGoal(emptyIntake(), 'Make one ask today')
    x = toggleRes(x, 3)
    x = raiseTag(raiseTag(x, 1, 'earth'), 1, 'earth')
    const s = init(x)
    expect(s.keeps[3].fog).toBe(true)
    expect(nActive(s)).toBe(5)
    expect(s.keeps[1].loops).toEqual([{ ch: 'earth', g: 2 }])
    expect(s.keeps[1].ph).toBe(false)
  })

  it('prices the block from the dealt table', () => {
    const x = pickGoal(emptyIntake(), 'Make one ask today')
    expect(blockCost(x)).toEqual({ refinements: 12, moves: 6, watches: 2 })
    expect(blockCost(toggleRes(x, 0)).refinements).toBe(10)
  })

  it('round-trips through the saved intake/game shape', () => {
    let x = pickGoal(emptyIntake(), 'Make one ask today')
    x = raiseTag(raiseNow(toggleWant(x, 'fire'), 'metal'), 2, 'water')
    expect(parseIntake(JSON.parse(JSON.stringify(x)))).toEqual({ ...x, goalCtx: undefined })
  })
})
