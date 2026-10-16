import { describe, expect, it, vi } from 'vitest'
import { BOARD_TASK_SOURCE, parseBoardSeal, textsToCreate, withTaskIds, writeBoardSeal } from '../board-seal'
import { normalizeLineKey } from '../menu'

const menu = (items: unknown[], sessionDate = '2026-10-16') =>
  JSON.stringify({ version: 1, origin: 'board', sessionDate, sealedAt: '2026-10-16T15:00:00.000Z', items })
const item = (key: string, text: string, source = 'can_do') => ({ key, text, source, status: 'unaligned', goal: null })

function fakeTx(prior: { id: string; originalText: string; barId: string | null }[] = []) {
  let n = 0
  const created: Record<string, unknown>[] = []
  const tx = {
    tapTheVeinDailySession: { upsert: vi.fn().mockResolvedValue({ id: 's1' }) },
    tapTheVeinTask: {
      findMany: vi.fn().mockResolvedValue(prior),
      aggregate: vi.fn().mockResolvedValue({ _max: { priorityRank: 3 } }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data); n += 1
        return { id: `t${n}`, originalText: data.originalText, barId: null }
      }),
    },
  }
  return { tx: tx as never, created, raw: tx }
}

describe('parseBoardSeal', () => {
  it('reads the board menu and drops items without text', () => {
    const m = parseBoardSeal(menu([item('a', 'Call Jev'), item('b', '  '), { key: 'c' }]))
    expect(m?.sessionDate).toBe('2026-10-16')
    expect(m?.items.map((i) => i.key)).toEqual(['a'])
  })
  it('refuses something that is not a sealed menu', () => {
    expect(parseBoardSeal('not json')).toBeNull()
    expect(parseBoardSeal(JSON.stringify({ items: [] }))).toBeNull()
    expect(parseBoardSeal(menu([], '16 Oct'))).toBeNull()
  })
})

describe('textsToCreate and withTaskIds', () => {
  it('makes one task per distinct line and skips lines that already have one', () => {
    const items = [item('a', 'Call Jev'), item('b', 'call  jev'), item('c', 'Ship the cave')]
    const existing = new Map([[normalizeLineKey('Ship the cave'), 1]])
    expect(textsToCreate(items, existing)).toEqual(['Call Jev'])
  })
  it('fills taskId and barId by line, leaving other items as they were', () => {
    const m = parseBoardSeal(menu([item('a', 'Call Jev'), item('b', 'Rest')]))!
    const out = withTaskIds(m, new Map([[normalizeLineKey('call jev'), { id: 't9', barId: null }]]))
    expect(out.items[0]).toMatchObject({ key: 'a', taskId: 't9', barId: null, source: 'can_do' })
    expect(out.items[1].taskId).toBeUndefined()
  })
})

describe('writeBoardSeal', () => {
  it('creates board tasks after the day\'s ranks and writes their ids into the menu', async () => {
    const { tx, created, raw } = fakeTx()
    const out = JSON.parse(await writeBoardSeal(tx, 'p1', menu([item('a', 'Call Jev'), item('k1', 'Write the chapter', 'kept_line')])))
    expect(raw.tapTheVeinDailySession.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: { playerId: 'p1', sessionDate: new Date('2026-10-16T00:00:00.000Z'), rawEntry: '', wordCount: 0 },
    }))
    expect(created).toEqual([
      expect.objectContaining({ originalText: 'Call Jev', source: BOARD_TASK_SOURCE, priorityRank: 4, playerId: 'p1' }),
      expect.objectContaining({ originalText: 'Write the chapter', source: BOARD_TASK_SOURCE, priorityRank: 5 }),
    ])
    expect(out.items.map((i: { taskId: string }) => i.taskId)).toEqual(['t1', 't2'])
    expect(out.origin).toBe('board')
  })
  it('is safe to save twice: a line with a board task reuses it', async () => {
    const { tx, created } = fakeTx([{ id: 'old', originalText: 'Call Jev', barId: 'bar7' }])
    const out = JSON.parse(await writeBoardSeal(tx, 'p1', menu([item('a', 'Call Jev')])))
    expect(created).toEqual([])
    expect(out.items[0]).toMatchObject({ taskId: 'old', barId: 'bar7' })
  })
  it('leaves an empty or unreadable menu untouched', async () => {
    const { tx, raw } = fakeTx()
    expect(await writeBoardSeal(tx, 'p1', 'nope')).toBe('nope')
    const empty = menu([])
    expect(await writeBoardSeal(tx, 'p1', empty)).toBe(empty)
    expect(raw.tapTheVeinDailySession.upsert).not.toHaveBeenCalled()
  })
})
