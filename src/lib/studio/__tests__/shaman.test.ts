import { describe, expect, it } from 'vitest'
import { STAGES8, demoShaman, focusOf, hearthOf, needsWorkStage, pullColdOf, rootsOf, shamanWorldOf, type BoardData, type Row, type ShamanPull } from '../shaman'
import type { Stage } from '../fleet'

const now = new Date('2026-10-26T08:00:00Z')
const board: BoardData = {
  questions: [
    { id: 'q-open-pick', q: 'Which way?', why_you: 'only you know', options: [{ v: 'A', label: 'A. this' }, { v: 'B', label: 'B. that' }] },
    { id: 'q-open-ask', q: 'What do you want here?', not_before: 'Raised by a pass, 2026-10-25.' },
    { id: 'q-later', q: 'Not yet', not_before: '2026-12-01' },
    { id: 'q-resolved', q: 'done', options: [{ v: 'A' }] },
    { id: 'q-answered', q: 'answered in a pull', options: [{ v: 'A' }] },
  ],
  positions: [
    { id: 'p-open', pos: 'This stands unless you flip it.', why: 'the record' },
    { id: 'p-resolved', pos: 'x' }, { id: 'p-deferred', pos: 'x', deferred: true },
  ],
  resolved: { questions: { 'q-resolved': {} }, positions: { 'p-resolved': {} } },
}
const pulls: ShamanPull[] = [{
  at: '2026-10-26T06:37:43Z', stem: '2026-10-26-pull-063743',
  answers: { 'q-answered': { kind: 'question', choice: 'A', savedAt: '2026-10-26T06:37:21.540Z' } as never, 'p-x': { kind: 'position', status: 'stands' } },
  steps: [{ what: 'ticked' }],
  needs_work: [
    'questions/q-answered: Charge tap', 'positions/p-x: Overruled (steer: "blocked part")',
    'steps/s-1: note "Yes, release it"', 'steps/s-2: deprecated', 'positions/p-y: Stands (steer: "ok")', 'steps/s-3: note "not yet"',
  ],
}]

describe('the Shaman world', () => {
  it('classifies needs-work lines by their row and what', () => {
    expect(needsWorkStage('positions/a', 'Overruled (steer: "x")')).toBe('falsify')
    expect(needsWorkStage('positions/a', 'Stands')).toBe('build')
    expect(needsWorkStage('steps/a', 'note "Yes, go"')).toBe('ship')
    expect(needsWorkStage('steps/a', 'deprecated')).toBe('close')
    expect(needsWorkStage('steps/a', 'note "compost round owed"')).toBe('close')
    expect(needsWorkStage('steps/a', 'note "not yet"')).toBe('build')
    expect(needsWorkStage('questions/a', 'B')).toBe('build')
  })

  it('puts each open row in its room, honours resolved, answered, not_before and done', () => {
    const w = shamanWorldOf({ board, pulls, doneKeys: ['2026-10-26-pull-063743#positions/p-y'], builds: [], now,
      steps: { 'shaman-loop-look-2': { do: 'Look at it', at: '2026-10-26T07:00:00Z' }, 'shaman-loop-look-1': { done: true },
               'other-step-01': { do: 'not a look' }, 'x-look-3': { deprecated: true } } })
    const room = (s: string) => w.rooms.find(r => r.stage === s)!
    expect(w.rooms.map(r => r.stage)).toEqual(STAGES8)
    expect(room('plan').waiting.map(r => r.id)).toEqual(['q-open-pick'])
    expect(room('plan').waiting[0]).toMatchObject({ kind: 'question', writable: true, title: 'Which way?', options: [{ id: 'A', label: 'A. this' }, { id: 'B', label: 'B. that' }] })
    expect(room('intake').waiting.map(r => r.id)).toEqual(['q-open-ask'])
    expect(room('spec').waiting.map(r => r.id)).toEqual(['p-open'])
    expect(room('spec').waiting[0].options?.map(o => o.id)).toEqual(['stands', 'overrule'])
    expect(room('falsify').waiting.map(r => r.id)).toEqual(['2026-10-26-pull-063743#positions/p-x'])
    expect(room('ship').waiting[0]).toMatchObject({ writable: false, kind: 'needs-work' })
    expect(room('close').waiting).toHaveLength(1)
    expect(room('build').waiting.map(r => r.id)).toEqual(['2026-10-26-pull-063743#questions/q-answered', '2026-10-26-pull-063743#steps/s-3'])
    expect(room('verify').waiting).toEqual([expect.objectContaining({ id: 'shaman-loop-look-2', kind: 'step', writable: true, title: 'Look at it' })])
    expect(room('verify').landed).toBe(true)
    expect(room('spec').landed).toBe(true)
    expect(w.answered['q-answered']).toBe('2026-10-26T06:37:21.540Z')
    expect(w.answered['p-x']).toBe('2026-10-26T06:37:43Z')
    // board work first: the oldest writable row (undated board rows count as oldest)
    expect(w.focus).toBe('intake')
  })

  it('caps each room and keeps the total, and is null-safe', () => {
    const many = Array.from({ length: 9 }, (_, i) => `positions/p${i}: Stands`)
    const w = shamanWorldOf({ board: null, pulls: [{ ...pulls[0], needs_work: many }], doneKeys: [], builds: [], now })
    const build = w.rooms.find(r => r.stage === 'build')!
    expect(build.waiting).toHaveLength(5); expect(build.total).toBe(9)
    expect(w.focus).toBe('build')
    const empty = shamanWorldOf({ board: null, pulls: [], doneKeys: [], builds: [], steps: null, now })
    expect(empty.rooms.every(r => !r.landed && r.waiting.length === 0)).toBe(true)
    expect(empty.focus).toBeNull()
  })

  it('demo: five rooms lit, ship, close and build waiting, one writable row', () => {
    const d = demoShaman(now)
    expect(d.demo).toBe(true)
    expect(d.rooms.filter(r => r.landed).map(r => r.stage)).toEqual(['intake', 'spec', 'falsify', 'plan', 'verify'])
    expect(d.rooms.filter(r => r.waiting.length).map(r => r.stage)).toEqual(['build', 'ship', 'close'])
    expect(d.rooms.flatMap(r => r.waiting).filter(r => r.writable)).toHaveLength(1)
    expect(d.focus).toBe('ship')
    expect(focusOf(d.rooms)).toBe('ship')
  })

  it('the Hearth is lit with no root, and the world carries it', () => {
    const w = shamanWorldOf({ board, pulls, doneKeys: [], builds: [], now })
    expect(w.hearth).toEqual({ state: 'lit', root: null, queue: [] })
    expect(hearthOf(rootsOf({ waiting: emptyWait() }))).toEqual({ state: 'lit', root: null, queue: [] })
  })
})

function emptyWait(over: Partial<Record<Stage, Row[]>> = {}): Record<Stage, Row[]> {
  return Object.fromEntries(STAGES8.map(st => [st, over[st] ?? []])) as Record<Stage, Row[]>
}
const r = (id: string): Row => ({ id, kind: 'question', title: id, writable: true })

describe('the cold Hearth: root blockers', () => {
  const waiting = emptyWait({ ship: [r('row-ship')], build: [r('row-build-1'), r('row-build-2')], plan: [r('row-plan')] })

  it('store cold holds all eight rooms and is not writable', () => {
    const [root] = rootsOf({ storeCold: { at: '2026-10-26T07:00:00Z', why: 'connect ECONNREFUSED' }, waiting })
    expect(root).toMatchObject({ id: 'store-cold', source: 'store', writable: false, why: 'connect ECONNREFUSED', holds: STAGES8 })
    expect(hearthOf([root]).state).toBe('cold')
  })

  it('pull cold reads the newest completed run, holds no room server side, and is not writable', () => {
    expect(pullColdOf({ workflow_runs: [{ conclusion: 'failure', updated_at: '2026-10-26T06:00:00Z', html_url: 'https://x/run/1' }] }))
      .toEqual({ at: '2026-10-26T06:00:00Z', url: 'https://x/run/1' })
    expect(pullColdOf({ workflow_runs: [{ conclusion: 'success' }] })).toBeNull()
    expect(pullColdOf(null)).toBeNull()
    expect(pullColdOf({ workflow_runs: [] })).toBeNull()
    const [root] = rootsOf({ pullCold: { at: '2026-10-26T06:00:00Z' }, waiting })
    expect(root).toMatchObject({ id: 'pull-cold', source: 'pull', writable: false, holds: [] })
  })

  it('a blocking step holds the rooms its holds names, by row id or stage, or every room with work', () => {
    const roots = rootsOf({ waiting, steps: {
      'blk-named': { blocking: true, do: 'Fix it', why: 'because', at: '2026-10-26T05:00:00Z', holds: ['row-ship', 'close', 'nope'] },
      'blk-all': { blocking: true, do: 'Fix all', at: '2026-10-26T04:00:00Z' },
      'blk-done': { blocking: true, done: true }, 'blk-retired': { blocking: true, retired: true }, 'blk-dep': { blocking: true, deprecated: true },
    } })
    expect(roots.map(x => x.id)).toEqual(['blk-all', 'blk-named'])
    expect(roots[0]).toMatchObject({ source: 'blocking', writable: true, holds: ['plan', 'build', 'ship'] })
    expect(roots[1]).toMatchObject({ title: 'Fix it', why: 'because', holds: ['ship', 'close'] })
  })

  it('a fan-in step holds two or more open rows, and one open row is not a fan-in', () => {
    const roots = rootsOf({ waiting, steps: {
      'fan': { do: 'Unblock both', holds: ['row-build-1', 'row-ship', 'gone'] },
      'one': { do: 'Only one', holds: ['row-plan', 'gone'] },
      'shut': { do: 'Closed', done: true, holds: ['row-build-1', 'row-ship'] },
    } })
    expect(roots).toEqual([expect.objectContaining({ id: 'fan', source: 'fan-in', writable: true, holds: ['build', 'ship'] })])
  })

  it('orders store, pull, blocking, fan-in; the first open root wins and the rest are banked', () => {
    const roots = rootsOf({ storeCold: { at: '2026-10-26T07:00:00Z', why: 'x' }, pullCold: { at: '2026-10-26T01:00:00Z' }, waiting, steps: {
      'fan': { do: 'f', holds: ['row-build-1', 'row-ship'], at: '2026-10-25T00:00:00Z' }, 'blk': { blocking: true, do: 'b' } } })
    expect(roots.map(x => x.source)).toEqual(['store', 'pull', 'blocking', 'fan-in'])
    const h = hearthOf(roots)
    expect(h.state).toBe('cold'); expect(h.root?.id).toBe('store-cold'); expect(h.queue.map(x => x.id)).toEqual(['pull-cold', 'blk', 'fan'])
  })

  it('a writable root he has said go ahead on (aiBack or the note) is kindling, not cold', () => {
    const k1 = hearthOf(rootsOf({ waiting, steps: { blk: { blocking: true, do: 'b', aiBack: { text: 'go ahead', at: 'x' } } } }))
    expect(k1.state).toBe('kindling'); expect(k1.root).toMatchObject({ id: 'blk', kindled: true })
    const k2 = hearthOf(rootsOf({ waiting, steps: { blk: { blocking: true, do: 'b', note: 'go ahead' } } }))
    expect(k2.state).toBe('kindling')
    // an open root still wins over a kindled one
    const k3 = hearthOf(rootsOf({ waiting, steps: { blk: { blocking: true, do: 'b', note: 'go ahead' }, fan: { do: 'f', holds: ['row-build-1', 'row-ship'] } } }))
    expect(k3.state).toBe('cold'); expect(k3.root?.id).toBe('fan')
  })

  it('the world takes the store and pull roots; the demo goes cold with &hearth=cold', () => {
    const w = shamanWorldOf({ board, pulls, doneKeys: [], builds: [], now, pullCold: { at: '2026-10-26T06:00:00Z' } })
    expect(w.hearth.state).toBe('cold'); expect(w.hearth.root?.source).toBe('pull')
    expect(demoShaman(now).hearth.state).toBe('lit')
    const d = demoShaman(now, { hearth: 'cold' })
    expect(d.hearth.state).toBe('cold')
    expect(d.hearth.root).toMatchObject({ id: 'demo-store-restore', source: 'blocking', writable: true, holds: ['build', 'ship', 'close'] })
  })
})
