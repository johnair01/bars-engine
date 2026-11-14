import { describe, expect, it, vi } from 'vitest'
import { moveTicket, pushTicket, setLaneDry, steerTicket, unholdTicket } from '../queue'

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
      updateMany: vi.fn(async ({ where, data }: { where: { state: string; leaseUntil: { lt: Date } }; data: Record<string, unknown> }) => {
        const hit = tickets.filter(t => t.state === where.state
          && t.leaseUntil instanceof Date && t.leaseUntil < where.leaseUntil.lt)
        hit.forEach(t => Object.assign(t, data))
        return { count: hit.length } }),
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
  it('sets the renewal gate by hand, defaults to five hours, and never further out than a week', async () => {
    const now = new Date('2026-10-31T15:00:00Z')
    const db = fakeDb([])
    const in5 = new Date('2026-10-31T20:00:00Z')
    expect((await setLaneDry(db, 'claude', true, 'out', now)).dryUntil).toEqual(in5)
    expect((await setLaneDry(db, 'claude', true, 'out', now, new Date('2026-11-01T09:00:00Z'))).dryUntil)
      .toEqual(new Date('2026-11-01T09:00:00Z'))
    expect((await setLaneDry(db, 'claude', true, 'out', now, new Date('2027-01-01T00:00:00Z'))).dryUntil)
      .toEqual(new Date('2026-11-07T15:00:00Z'))
    // A time in the past is not a gate: it would relight the lamp the moment it was set.
    expect((await setLaneDry(db, 'claude', true, 'out', now, new Date('2026-10-01T00:00:00Z'))).dryUntil).toEqual(in5)
  })

  it('returns lapsed leases before it moves the deck, so a dead lane strands nothing', async () => {
    const now = new Date('2026-10-31T15:00:00Z')
    const tickets = [
      { id: 'a', lane: 'claude', state: 'claimed', claimedBy: 'a worker that died',
        leaseUntil: new Date('2026-10-31T09:00:00Z'), lanes: ['claude', 'freebuff'] },
      { id: 'b', lane: 'claude', state: 'claimed', claimedBy: 'a worker still running',
        leaseUntil: new Date('2026-10-31T16:00:00Z'), lanes: ['claude', 'freebuff'] },
    ]
    const r = await setLaneDry(fakeDb(tickets), 'claude', true, 'limit', now)
    expect(r.moved).toBe(1)
    expect(tickets[0]).toMatchObject({ state: 'ready', lane: 'freebuff', claimedBy: null })
    expect(tickets[1]).toMatchObject({ state: 'claimed', lane: 'claude' })
  })

  it('lets only the holding lane move a claimed ticket', async () => {
    const tickets = [{ id: 'a', lane: 'claude', state: 'claimed' }]
    expect(await moveTicket(fakeDb(tickets), 'a', 'freebuff', 'done', 'x')).toMatchObject({ ok: false, status: 403 })
    expect(await moveTicket(fakeDb(tickets), 'a', 'claude', 'done', 'pr')).toMatchObject({ ok: true })
    expect(tickets[0]).toMatchObject({ state: 'done', result: 'pr' })
    expect(await moveTicket(fakeDb(tickets), 'a', null, 'release', null)).toMatchObject({ ok: false, status: 409 })
  })
  it('creates a held ticket that no claim takes, and unhold readies it', async () => {
    const tickets: Record<string, unknown>[] = []
    const db = fakeDb(tickets)
    const r = await pushTicket(db, { ...draft, sourceKey: 'k', state: 'held' })
    expect(r.ticket).toMatchObject({ state: 'held' })
    const id = tickets[0].id as string
    expect(await unholdTicket(db, id)).toMatchObject({ ok: true })
    expect(tickets[0]).toMatchObject({ state: 'ready' })
    expect(await unholdTicket(db, id)).toMatchObject({ ok: false, status: 409 })
    expect(await unholdTicket(db, 'nope')).toMatchObject({ ok: false, status: 404 })
  })

  describe('steerTicket', () => {
    const ready = () => [{ id: 'a', state: 'ready', lane: 'claude', lanes: ['claude', 'freebuff'], basis: { rows: ['r'] } }]
    it('sends a ready ticket to another lane and puts that lane first in its order', async () => {
      const tickets = ready()
      const r = await steerTicket(fakeDb(tickets), 'a', 'freebuff', 'owner')
      expect(r.ok).toBe(true)
      expect(tickets[0]).toMatchObject({ lane: 'freebuff', state: 'ready', lanes: ['freebuff', 'claude'], leaseUntil: null })
      expect((tickets[0].basis as unknown as { steered: { from: string; by: string } }).steered).toMatchObject({ from: 'claude', by: 'owner' })
    })
    it('adds a lane the ticket did not list', async () => {
      const tickets = ready()
      await steerTicket(fakeDb(tickets), 'a', 'deepai', 'mcp')
      expect(tickets[0]).toMatchObject({ lane: 'deepai', lanes: ['deepai', 'claude', 'freebuff'] })
    })
    it('holds a ticket back, and a steer to a lane lifts the hold', async () => {
      const tickets = ready()
      await steerTicket(fakeDb(tickets), 'a', 'hold', 'owner')
      expect(tickets[0]).toMatchObject({ state: 'held', lane: 'claude' })
      await steerTicket(fakeDb(tickets), 'a', 'claude', 'owner')
      expect(tickets[0]).toMatchObject({ state: 'ready' })
    })
    it('leaves a claimed ticket to its crew, and refuses an unknown lane or ticket', async () => {
      const tickets = [{ id: 'c', state: 'claimed', lane: 'claude', lanes: ['claude'], basis: {} }]
      expect(await steerTicket(fakeDb(tickets), 'c', 'freebuff', 'owner')).toMatchObject({ ok: false, status: 409 })
      expect(tickets[0].lane).toBe('claude')
      expect(await steerTicket(fakeDb(tickets), 'c', 'nowhere', 'owner')).toMatchObject({ ok: false, status: 400 })
      expect(await steerTicket(fakeDb(tickets), 'zz', 'claude', 'owner')).toMatchObject({ ok: false, status: 404 })
    })
  })
})
