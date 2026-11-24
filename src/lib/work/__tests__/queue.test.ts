import { describe, expect, it, vi } from 'vitest'
import { MAX_ATTEMPTS, returnLapsed, laneStatus, moveTicket, pushTicket, closeTicket, retryTicket, setLaneDry, steerTicket, unholdTicket } from '../queue'
import { routeLane, ticketKind } from '../lanes'

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
      groupBy: vi.fn(async ({ where }: { where: { state: { in: string[] } } }) => {
        const tally = new Map<string, number>()
        for (const t of tickets) {
          const st = t.state as string
          if (where.state.in.includes(st)) tally.set(t.lane as string, (tally.get(t.lane as string) ?? 0) + 1)
        }
        return [...tally].map(([lane, n]) => ({ lane, state: 'ready', _count: { _all: n } }))
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { const t = { id: 't' + tickets.length, state: 'ready', ...data }; tickets.push(t); return t }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const t = tickets.find(x => x.id === where.id)!; Object.assign(t, data); return t }),
      updateMany: vi.fn(async ({ where, data }: { where: { state: string; leaseUntil?: { lt: Date }; attempts?: { gte: number } }; data: Record<string, unknown> }) => {
        const hit = tickets.filter(t => t.state === where.state
          && (!where.leaseUntil || (t.leaseUntil instanceof Date && t.leaseUntil < where.leaseUntil.lt))
          && (!where.attempts || (t.attempts as number) >= where.attempts.gte))
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
  it('refuses a done with no result, and keeps a pull request link as the ticket draft', async () => {
    const tickets: Record<string, unknown>[] = [{ id: 'a', lane: 'claude', state: 'claimed', basis: { rows: ['r1'] } }]
    expect(await moveTicket(fakeDb(tickets), 'a', 'claude', 'done', '  ')).toMatchObject({ ok: false, status: 400 })
    expect(await moveTicket(fakeDb(tickets), 'a', 'claude', 'done', 'Opened https://github.com/johnair01/bars-engine/pull/900')).toMatchObject({ ok: true })
    expect(tickets[0].basis).toMatchObject({ rows: ['r1'], draft: { url: 'https://github.com/johnair01/bars-engine/pull/900', label: 'bars-engine #900' } })
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

describe('retry after a review', () => {
  const failed = (extra = {}) => [{ id: 'f', state: 'failed', lane: 'deepai', lanes: ['deepai'], basis: {}, result: 'timed out after 25 min', claimedBy: 'deepai', leaseUntil: null, ...extra }]
  it('returns a failed ticket to the deck and keeps the failure it replaces', async () => {
    const tickets = failed()
    const r = await retryTicket(fakeDb(tickets), 'f', 'COUNCIL/logs/AAR_2026-11-18_deepai-timeouts.md', 'council',
      new Date('2026-11-18T20:30:00Z'))
    expect(r).toMatchObject({ ok: true })
    expect(tickets[0]).toMatchObject({ state: 'ready', claimedBy: null, leaseUntil: null, result: null })
    const attempts = (tickets[0].basis as { attempts: { aar: string; failed: string; by: string }[] }).attempts
    expect(attempts).toHaveLength(1)
    expect(attempts[0]).toMatchObject({ aar: 'COUNCIL/logs/AAR_2026-11-18_deepai-timeouts.md', failed: 'timed out after 25 min', by: 'council' })
  })
  it('adds to the record, so a second failure does not overwrite the first', async () => {
    const tickets = failed({ basis: { attempts: [{ at: '2026-11-18T19:00:00Z', by: 'council', aar: 'first.md', failed: 'a' }] } })
    await retryTicket(fakeDb(tickets), 'f', 'second.md', 'council', new Date('2026-11-18T20:30:00Z'))
    expect((tickets[0].basis as { attempts: unknown[] }).attempts).toHaveLength(2)
  })
  it('leaves a ticket that did not fail alone', async () => {
    const tickets = [{ id: 'r', state: 'ready', lane: 'deepai', lanes: ['deepai'], basis: {}, result: null }]
    expect(await retryTicket(fakeDb(tickets), 'r', 'x.md', 'council')).toMatchObject({ ok: false, status: 409 })
    expect(tickets[0].state).toBe('ready')
  })
  it('refuses a ticket that does not exist', async () => {
    expect(await retryTicket(fakeDb([]), 'zz', 'x.md', 'council')).toMatchObject({ ok: false, status: 404 })
  })
})

describe('the ceiling', () => {
  const full = (lane: string, n: number, state = 'ready') =>
    Array.from({ length: n }, (_, i) => ({ id: `${lane}-${i}`, lane, state, sourceKey: `${lane}-${i}` }))
  it('sends the answer past a lane that is at the ceiling into the next lit lane in his order', async () => {
    const tickets = full('claude', 20)
    const db = fakeDb(tickets)
    expect((await pushTicket(db, draft)).ticket).toMatchObject({ lane: 'freebuff' })
  })
  it('counts a lane\'s claimed tickets against the ceiling, so 3 ready and 17 claimed is full', async () => {
    const tickets = [...full('claude', 3), ...full('claude', 17, 'claimed')]
    const db = fakeDb(tickets)
    expect((await pushTicket(db, draft)).ticket).toMatchObject({ lane: 'freebuff' })
  })
  it('keeps the first lane while it has room', async () => {
    const db = fakeDb(full('claude', 19))
    expect((await pushTicket(db, draft)).ticket).toMatchObject({ lane: 'claude' })
  })
  it('takes the lit lane with the shortest deck when every lane in his order is at the ceiling', async () => {
    const tickets = [...full('claude', 30), ...full('freebuff', 25)]
    const db = fakeDb(tickets, [{ lane: 'freebuff', dry: false, dryUntil: null }])
    expect((await pushTicket(db, draft)).ticket).toMatchObject({ lane: 'deepai' })
  })
  it('gives DeepAI work once the lanes he named are full, without naming it in DEFAULT_LANES', async () => {
    // The shape the live board was in on 2026-11-18: claude 3 ready + 40 claimed, freebuff 75, deepai 0.
    const tickets = [...full('claude', 3), ...full('claude', 40, 'claimed'), ...full('freebuff', 75)]
    const db = fakeDb(tickets)
    expect((await pushTicket(db, draft)).ticket).toMatchObject({ lane: 'deepai' })
  })
  it('keeps picture builds and design questions out of DeepAI, even when the lanes ahead are full', () => {
    const lit = new Set(['claude', 'freebuff', 'deepai'])
    const full = { claude: 30, freebuff: 25, deepai: 0 }
    expect(routeLane(['claude', 'freebuff'], lit, full, 20, 'picture')?.lane).toBe('freebuff')
    expect(routeLane(['claude', 'freebuff'], lit, full, 20, 'build')?.lane).toBe('deepai')
    expect(routeLane(['deepai'], lit, { claude: 0, deepai: 0 }, 20, 'design')?.lane).toBe('claude')
  })
  it('classifies the tickets DeepAI failed as picture or design work', () => {
    expect(ticketKind('Tuck the robe at the shoulder')).toBe('picture')
    expect(ticketKind('Fix the magenta band on the over-robe skirt')).toBe('picture')
    expect(ticketKind('Run gait on the cultivation figure')).toBe('picture')
    expect(ticketKind('Fate-clearing: which option for the clearing?')).toBe('design')
    expect(ticketKind('Add a retry button to the harbour page')).toBe('build')
  })
  it('never routes to zo, so the closing lever keeps its monopoly', () => {
    expect(routeLane(['claude', 'zo'], new Set(['claude', 'zo']), {})).toMatchObject({ lane: 'claude' })
    expect(routeLane(['claude', 'zo'], new Set(['claude', 'zo']), { claude: 40 })).toMatchObject({ lane: 'claude' })
    expect(routeLane(['zo'], new Set(['zo']), {})).toMatchObject({ lane: 'zo' })
  })
  it('keeps the Calrunian lane steered only: no overflow, but a ticket that names it gets it', () => {
    const lit = new Set(['claude', 'freebuff', 'deepai', 'calrunian'])
    expect(routeLane(['claude', 'freebuff'], lit, { claude: 30, freebuff: 30, deepai: 30 })?.lane).not.toBe('calrunian')
    expect(routeLane(['calrunian'], lit, { calrunian: 30 })).toMatchObject({ lane: 'calrunian' })
    expect(routeLane(['claude', 'calrunian'], lit, { claude: 30, calrunian: 3 })).toMatchObject({ lane: 'calrunian' })
  })
  it('reports no lane when every lane in the order has its lamp out', () => {
    expect(routeLane(['claude', 'freebuff'], new Set(), {})).toBeNull()
  })
  it('names why it routed: his order while the lane has room, the ceiling otherwise', () => {
    expect(routeLane(['claude', 'freebuff'], new Set(['claude', 'freebuff']), { claude: 19 }))
      .toEqual({ lane: 'claude', reason: 'order' })
    expect(routeLane(['claude', 'freebuff'], new Set(['claude', 'freebuff']), { claude: 20 }))
      .toEqual({ lane: 'freebuff', reason: 'order' })
    expect(routeLane(['claude', 'freebuff'], new Set(['claude', 'freebuff']), { claude: 20, freebuff: 24 }))
      .toEqual({ lane: 'claude', reason: 'ceiling' })
    expect(routeLane(['claude', 'freebuff'], new Set(['claude', 'freebuff']), { claude: 41, freebuff: 25 }))
      .toEqual({ lane: 'freebuff', reason: 'ceiling' })
  })
})

describe('lane status', () => {
  const now = new Date('2026-11-16T12:00:00Z')
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000)
  it('is dry when the lamp is out, whatever it claimed', () => {
    expect(laneStatus(false, hoursAgo(1), now)).toBe('dry')
  })
  it('is live when a lit lane touched a ticket in the last 24 hours', () => {
    expect(laneStatus(true, hoursAgo(23), now)).toBe('live')
  })
  it('is quiet when a lit lane has gone a day or more without a claim, or never claimed', () => {
    expect(laneStatus(true, hoursAgo(49), now)).toBe('quiet')
    expect(laneStatus(true, null, now)).toBe('quiet')
  })
})

describe('the claim loop guard', () => {
  const now = new Date('2026-11-18T18:00:00Z')
  const lapsed = new Date('2026-11-18T17:00:00Z')
  it('returns a lapsed ticket to ready while it has attempts left', async () => {
    const tickets = [{ id: 'a', state: 'claimed', leaseUntil: lapsed, attempts: MAX_ATTEMPTS - 1 }]
    await returnLapsed(fakeDb(tickets), now)
    expect(tickets[0]).toMatchObject({ state: 'ready', leaseUntil: null })
  })
  it('holds a ticket whose lease lapsed MAX_ATTEMPTS times, with the reason, and does not return it', async () => {
    const tickets: Record<string, unknown>[] = [{ id: 'a', state: 'claimed', leaseUntil: lapsed, attempts: MAX_ATTEMPTS }]
    await returnLapsed(fakeDb(tickets), now)
    expect(tickets[0]).toMatchObject({ state: 'held', leaseUntil: null })
    expect(String(tickets[0].result)).toMatch(/^auto-held: claimed 3 times/)
  })
  it('holds a ready ticket already past the limit, so it stops heading the deck', async () => {
    const tickets: Record<string, unknown>[] = [{ id: 'a', state: 'ready', attempts: 103 }, { id: 'b', state: 'ready', attempts: 1 }]
    await returnLapsed(fakeDb(tickets), now)
    expect(tickets[0]).toMatchObject({ state: 'held' })
    expect(String(tickets[0].result)).toMatch(/^auto-held:/)
    expect(tickets[1]).toMatchObject({ state: 'ready' })
  })
  it('lifting the hold starts the count again', async () => {
    const tickets = [{ id: 'a', state: 'held', attempts: MAX_ATTEMPTS, result: 'auto-held: x' }]
    await unholdTicket(fakeDb(tickets), 'a')
    expect(tickets[0]).toMatchObject({ state: 'ready', attempts: 0, result: null })
  })
})

describe('closeTicket', () => {
  it('closes a held or failed ticket with a draft link, which done refuses', async () => {
    const tickets = [{ id: 'h', lane: 'claude', state: 'held', basis: {} }, { id: 'f', lane: 'claude', state: 'failed', basis: {} }]
    const db = fakeDb(tickets)
    expect(await moveTicket(db, 'h', null, 'done', 'x')).toMatchObject({ ok: false, status: 409 })
    const r = await closeTicket(db, 'h', 'built: https://github.com/johnair01/bars-engine/pull/872', 'council')
    expect(r).toMatchObject({ ok: true })
    expect(tickets[0]).toMatchObject({ state: 'done' })
    expect((tickets[0].basis as { draft: { label: string } }).draft.label).toBe('bars-engine #872')
    expect(await closeTicket(db, 'f', 'no code needed', 'council')).toMatchObject({ ok: true })
  })

  it('needs a result, leaves a done ticket alone and answers 404 for a missing one', async () => {
    const db = fakeDb([{ id: 'd', lane: 'claude', state: 'done', basis: {} }, { id: 'h', lane: 'claude', state: 'held', basis: {} }])
    expect(await closeTicket(db, 'h', ' ', 'council')).toMatchObject({ ok: false, status: 400 })
    expect(await closeTicket(db, 'd', 'x', 'council')).toMatchObject({ ok: false, status: 409 })
    expect(await closeTicket(db, 'nope', 'x', 'council')).toMatchObject({ ok: false, status: 404 })
  })
})

describe('release with hold', () => {
  it('holds a released ticket with its reason instead of returning it to the deck', async () => {
    const tickets = [{ id: 'h', lane: 'claude', state: 'claimed', claimedBy: 'thread', basis: { rows: [] } }]
    const r = await moveTicket(fakeDb(tickets), 'h', 'claude', 'release', 'needs his Mac', new Date(), null, true)
    expect(r).toMatchObject({ ok: true })
    expect(tickets[0]).toMatchObject({ state: 'held', result: 'needs his Mac', basis: { hold: { reason: 'needs his Mac' } } })
  })
  it('without hold, release still goes back to ready', async () => {
    const tickets = [{ id: 'h', lane: 'claude', state: 'claimed', basis: {} }]
    await moveTicket(fakeDb(tickets), 'h', 'claude', 'release', 'why')
    expect(tickets[0]).toMatchObject({ state: 'ready' })
  })
  it('holds a ticket released after MAX_ATTEMPTS claims, so a claim-and-release loop ends', async () => {
    const tickets: Record<string, unknown>[] = [{ id: 'h', lane: 'claude', state: 'claimed', basis: {}, attempts: MAX_ATTEMPTS }]
    await moveTicket(fakeDb(tickets), 'h', 'claude', 'release', "can't act on this yet")
    expect(tickets[0]).toMatchObject({ state: 'held', claimedBy: null, leaseUntil: null })
    expect(String(tickets[0].result)).toMatch(/^auto-held: claimed 3 times and released/)
  })
  it('a release below MAX_ATTEMPTS still goes back to ready', async () => {
    const tickets = [{ id: 'h', lane: 'claude', state: 'claimed', basis: {}, attempts: MAX_ATTEMPTS - 1 }]
    await moveTicket(fakeDb(tickets), 'h', 'claude', 'release', 'why')
    expect(tickets[0]).toMatchObject({ state: 'ready' })
  })
})
