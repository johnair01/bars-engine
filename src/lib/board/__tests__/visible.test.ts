import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/board/store', () => ({ latestDoc: vi.fn(), latestDocs: vi.fn() }))

import { visibleFrom, openFrom } from '../mcp-reads'

const q = (extra: Record<string, unknown> = {}) => ({ kind: 'questions', q: 'Which?', options: [{ v: 'A', label: 'A' }], ...extra })

describe('visibleFrom', () => {
  const docs = {
    rows: {
      'look-new': q({ look: true }),
      'look-old': q({ look: true }),
      'look-newer': q({ look: true, supersedes: ['look-old'] }),
      plain: q(),
      answered: q({ look: true }),
      odd: { kind: 'widgets' },
      settled: q(),
    },
    questions: { answered: { choice: 'A', savedAt: '2026-11-14T01:16:42.863Z' } },
    resolved: { 'questions--settled': { kind: 'questions', id: 'settled', decision: 'adopt', recorded: '2026-11-10' } },
  } as never

  it('says where each row draws, or why it does not', () => {
    const by = Object.fromEntries(visibleFrom(docs, ['look-new', 'look-old', 'plain', 'answered', 'odd', 'settled', 'ghost']).map((r) => [r.id, r]))
    expect(by['look-new']).toMatchObject({ visible: true, where: 'Your eyes' })
    expect(by['look-old'].visible).toBe(false)
    expect(by.plain).toMatchObject({ visible: true, where: 'Open' })
    expect(by.answered).toMatchObject({ visible: false, where: 'Answered' })
    expect(by.odd.visible).toBe(false)
    expect(by.settled.visible).toBe(false)
    expect(by.ghost.why).toMatch(/No row/)
  })
})

describe('openFrom', () => {
  it('leaves out rows the record settled', () => {
    const at = new Date()
    const base = { q: 'x', name: null, choice: null, choices: null, steer: null, deferred: null, rounds: null, body: null, decision: null, saved_at: null, received_at: at }
    const r = openFrom([
      { ...base, collection: 'rows', doc_id: 'a', kind: 'questions' },
      { ...base, collection: 'rows', doc_id: 'b', kind: 'questions' },
      { ...base, collection: 'resolved', doc_id: 'questions--b', kind: 'questions', decision: 'adopt' },
    ], 50)
    expect(r.questions.map((x) => x.id)).toEqual(['a'])
  })
})
