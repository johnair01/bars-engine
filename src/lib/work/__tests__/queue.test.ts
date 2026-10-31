import { describe, expect, it, vi } from 'vitest'
import { moveTicket, pushTicket, setLaneDry } from '../queue'

function fakeDb(tickets: Record<string, unknown>[], lanes: { lane: string; dry: boolean; dryUntil: Date | null }[] = []) {
  return {
    workLane: {
      findMany: vi.fn(async () => lanes.filter(l => l.dry)),
      upsert: vi.fn(async ({ create }: { create: { lane: string; dry: boolean; dryUntil: Date | null } }) => {
        const i = lanes.findIndex(l => l.lane === create.lane); if (i >= 0) lanes[i] = create; else lanes.push(create)
      }),
    },
    workTicket: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; sourceKey?: string } }) =>
        tickets.find(t => (where.id && t.id === where.id) || (where.sourceKey && t.sourceKey === where.sourceKey)) ?? null),
      findMany: vi.fn(async ({ where }: { where: { lane: string; state: string } }) =>
        tickets.filter(t => t.lane === where.lane && t.state === where.state)),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { const t = { id: 't' + tickets.length, state: 'ready', ...data }; tickets.push(t); return t }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const t = tickets.find(x => x.id === where.id)!; Object.assign(t, data); return t }),
    },
  } as never
}

const draft = { sourceKey: 'council/questions/a@A', title: 't', brief: 'b', basis: { rows: ['a'], answer: 'A', label: 'A', steer: '', savedAt: '' }, lanes: ['claude', 'freebuff'] as ('claude' | 'freebuff')[] }

describe('the queue', () => {
  it('pushes into the first lit lane, once per answer', async () => {
    const tickets: Record<string, unknown>[] = []
    const db = fakeDb(tickets, [{ lane: 'claude', dry: true, dryUntil: null }])
    expect((await pushTicket(db, draft)).ticket).toMatchObject({ lane: 'freebuff' })
    expect((await pushTicket(db, draft)).created).toBe(false)
    expect(tickets).toHaveLength(1)
  })
  it("passes a dry lane's ready tickets to the next lit lane in each ticket's order", async () => {
    const tickets = [
      { id: 'a', lane: 'claude', state: 'ready', lanes: ['claude', 'freebuff'] },
      { id: 'b', lane: 'claude', state: 'ready', lanes: ['claude'] },
      { id: 'c', lane: 'claude', state: 'claimed', lanes: ['claude', 'freebuff'] },
    ]
    const r = await setLaneDry(fakeDb(tickets), 'claude', true, 'limit', new Date('2026-10-31T15:00:00Z'))
    expect(r.moved).toBe(1)
    expect(tickets.map(t => t.lane)).toEqual(['freebuff', 'claude', 'claude'])
  })
  it('lets only the holding lane move a claimed ticket', async () => {
    const tickets = [{ id: 'a', lane: 'claude', state: 'claimed' }]
    expect(await moveTicket(fakeDb(tickets), 'a', 'freebuff', 'done', 'x')).toMatchObject({ ok: false, status: 403 })
    expect(await moveTicket(fakeDb(tickets), 'a', 'claude', 'done', 'pr')).toMatchObject({ ok: true })
    expect(tickets[0]).toMatchObject({ state: 'done', result: 'pr' })
    expect(await moveTicket(fakeDb(tickets), 'a', null, 'release', null)).toMatchObject({ ok: false, status: 409 })
  })
})
