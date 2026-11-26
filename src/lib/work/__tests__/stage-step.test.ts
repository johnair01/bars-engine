import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))
import { failed, nextStage, parseStageKey, stageKey, strandsInGoalOrder, ROAD, type RoadStrand } from '../stage-step'

const cfg: RoadStrand = { strand: 'chapter1-demo', goals: ['career-y1'], after: 'build' }
const done = (stage: string, round: number, result = 'pass') => ({ sourceKey: stageKey('chapter1-demo', stage, round), result })

describe('restock road: the stage a strand walks next', () => {
  it('names a ticket by strand, stage and round, and reads the name back', () => {
    expect(stageKey('chapter1-demo', 'verify', 2)).toBe('stage:chapter1-demo:verify:2')
    expect(parseStageKey('stage:chapter1-demo:verify:2')).toEqual({ strand: 'chapter1-demo', stage: 'verify', round: 2 })
    expect(parseStageKey('next-look:robe:1')).toBeNull()
  })
  it('starts after the stage the strand already passed', () => expect(nextStage(cfg, [])).toEqual({ stage: 'verify' }))
  it('walks next on a pass', () => expect(nextStage(cfg, [done('verify', 1)])).toEqual({ stage: 'ship' }))
  it('goes back on_fail on a fail or a redirect', () => {
    expect(nextStage(cfg, [done('verify', 1, 'fail: look turned it back')])).toEqual({ stage: 'build' })
    expect(failed({ sourceKey: 'x', result: 'Redirect: steer' })).toBe(true)
  })
  it('stops after three fails in a row', () => {
    expect(nextStage(cfg, [done('verify', 3, 'fail'), done('build', 2, 'fail'), done('verify', 1, 'fail')])).toBeNull()
  })
  it('ends at close', () => expect(nextStage(cfg, [done('close', 1)])).toBeNull())
  it('has an edge for every stage and never sends on_fail forward', () => {
    const ids = Object.keys(ROAD)
    ids.forEach((id, i) => expect(ids.indexOf(ROAD[id].onFail)).toBeLessThanOrEqual(i))
  })
})

describe('restock road: goal order', () => {
  const a = { strand: 'a', goals: ['g1'], after: 'build' }, b = { strand: 'b', goals: ['g2'], after: 'build' }
  it('orders by the pass moves and drops a strand no move names', () => {
    expect(strandsInGoalOrder([a, b], [{ goal: 'g2' }, { goal: 'g1' }]).map(s => s.strand)).toEqual(['b', 'a'])
    expect(strandsInGoalOrder([a, b], [{ goal: 'g1' }]).map(s => s.strand)).toEqual(['a'])
    expect(strandsInGoalOrder([a, b], [])).toEqual([])
  })
  it('matches a move that names the strand in its ref', () => {
    expect(strandsInGoalOrder([a], [{ ref: 'walk strand a' }]).map(s => s.strand)).toEqual(['a'])
  })
})
