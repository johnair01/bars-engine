import { describe, expect, it, vi } from 'vitest'
import { altitudeOf, fleetFrom, type FleetTicket } from '../fleet'
import { steerTicket } from '../queue'

const now = new Date('2026-11-14T12:00:00Z')
const ago = (h: number) => new Date(now.getTime() - h * 3600000)
const t = (o: Partial<FleetTicket>): FleetTicket => ({ id: 'a', title: 'Light buds', lane: 'claude', lanes: ['claude', 'freebuff'],
  state: 'ready', result: null, leaseUntil: null, createdAt: ago(0.5), updatedAt: ago(0.5), ...o })

describe('the fleet altitudes', () => {
  it('keeps moving work at the oars', () => {
    expect(altitudeOf(t({}), new Set(), now).altitude).toBe('oars')
    expect(altitudeOf(t({ state: 'claimed', leaseUntil: ago(-1) }), new Set(), now).altitude).toBe('oars')
  })
  it('lifts stalled work to the ship', () => {
    expect(altitudeOf(t({ createdAt: ago(3) }), new Set(), now).altitude).toBe('ship')
    expect(altitudeOf(t({ state: 'claimed', leaseUntil: ago(1) }), new Set(), now).altitude).toBe('ship')
    expect(altitudeOf(t({ state: 'held' }), new Set(), now).altitude).toBe('ship')
  })
  it('lifts blocked work to the fleet, where he stands', () => {
    expect(altitudeOf(t({ state: 'failed', result: 'no repo access' }), new Set(), now))
      .toEqual({ altitude: 'fleet', why: 'Claude gave it up: no repo access' })
    expect(altitudeOf(t({}), new Set(['claude', 'freebuff']), now).altitude).toBe('fleet')
    expect(altitudeOf(t({ createdAt: ago(30) }), new Set(), now).altitude).toBe('fleet')
  })
  it('lists open tickets only, highest first, and offers every other lane', () => {
    const out = fleetFrom([t({ id: 'm' }), t({ id: 'd', state: 'done' }), t({ id: 'f', state: 'failed' })], new Set(), now)
    expect(out.map(l => l.id)).toEqual(['f', 'm'])
    expect(out[1].steerTo).toEqual(['freebuff', 'deepai'])
  })
})

function fakeDb(rows: Record<string, unknown>[]) {
  return { workTicket: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.find(r => r.id === where.id) ?? null),
    updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      const hit = rows.filter(r => Object.entries(where).every(([k, v]) => r[k] === v)); hit.forEach(r => Object.assign(r, data))
      return { count: hit.length } }),
  } } as never
}

describe('steering a ticket', () => {
  it('moves a ready ticket and puts its new lane first', async () => {
    const rows = [{ id: 'a', lane: 'claude', lanes: ['claude', 'freebuff'], state: 'ready' }]
    const r = await steerTicket(fakeDb(rows), 'a', 'freebuff', now)
    expect(r).toMatchObject({ ok: true, moved: true })
    expect(rows[0]).toMatchObject({ lane: 'freebuff', lanes: ['freebuff', 'claude'], state: 'ready' })
  })
  it('takes a claimed ticket back from its worker and sends a failed one round again', async () => {
    const rows = [{ id: 'c', lane: 'claude', lanes: ['claude'], state: 'claimed', claimedBy: 'x', leaseUntil: now },
      { id: 'f', lane: 'freebuff', lanes: ['freebuff'], state: 'failed' }]
    await steerTicket(fakeDb(rows), 'c', 'deepai', now)
    await steerTicket(fakeDb(rows), 'f', 'claude', now)
    expect(rows[0]).toMatchObject({ lane: 'deepai', lanes: ['deepai', 'claude'], state: 'ready', claimedBy: null, leaseUntil: null })
    expect(rows[1]).toMatchObject({ lane: 'claude', state: 'ready' })
  })
  it('leaves done tickets alone and answers 409 when a claim beats the steer', async () => {
    expect(await steerTicket(fakeDb([{ id: 'd', lane: 'claude', lanes: [], state: 'done' }]), 'd', 'freebuff', now))
      .toMatchObject({ ok: false, status: 409 })
    const rows = [{ id: 'r', lane: 'claude', lanes: ['claude'], state: 'ready' }]
    const db = fakeDb(rows) as unknown as { workTicket: { findUnique: ReturnType<typeof vi.fn> } }
    const seen = { ...rows[0] }
    db.workTicket.findUnique.mockImplementationOnce(async () => seen)
    rows[0].state = 'claimed'
    expect(await steerTicket(db as never, 'r', 'freebuff', now)).toMatchObject({ ok: false, status: 409 })
  })
})
