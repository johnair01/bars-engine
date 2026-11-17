/** Gate acts: the skeptic's falsification set (design pass gate-acts-2026-11-17). In-memory db, no real database. */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = { leads: [] as any[], bars: [] as any[], intakes: [] as any[], theme: '{"founderGate":{"founderPlayerId":"founder-1"}}', steps: [] as any[], donations: 0, ids: 0 }
  const nid = () => `id${++state.ids}`
  const match = (row: any, where: any) => Object.entries(where).every(([k, v]: [string, any]) => (v && typeof v === 'object' && 'gte' in v ? row[k] >= v.gte : row[k] === v))
  const tx: any = {
    campaignLead: {
      findFirst: async ({ where }: any) => state.leads.find((r) => match(r, where)) ?? null,
      create: async ({ data }: any) => { const r = { id: nid(), updatedAt: new Date(), vibeulonsEarned: 0, latentIntakeId: null, ...data }; state.leads.push(r); return r },
      update: async ({ where, data }: any) => { const r = state.leads.find((x) => x.id === where.id); Object.assign(r, data, { updatedAt: new Date() }); return r },
      count: async ({ where }: any) => state.leads.filter((r) => match(r, where)).length,
    },
    customBar: {
      upsert: async ({ where, create }: any) => { let r = state.bars.find((b) => b.id === where.id); if (!r) { r = { createdAt: new Date(), ...create }; state.bars.push(r) } return r },
      create: async ({ data }: any) => { const r = { id: nid(), createdAt: new Date(), ...data }; state.bars.push(r); return r },
      updateMany: async ({ where, data }: any) => { state.bars.filter((b) => b.id === where.id).forEach((b) => Object.assign(b, data)); return { count: 1 } },
      count: async ({ where }: any) => state.bars.filter((r) => match(r, where)).length,
    },
    latentAllyshipIntake: { create: async ({ data }: any) => { const r = { id: nid(), ...data }; state.intakes.push(r); return r } },
    appConfig: { findUnique: async () => ({ theme: state.theme }) },
    donation: { create: async () => { state.donations++ } },
  }
  const db: any = { ...tx, $transaction: async (cb: any) => cb(tx) }
  const sessionWrite = vi.fn(async (_db: any, docs: any[]) => { state.steps.push(...docs); return { written: [], same: 0, refused: [] } })
  return { state, db, sessionWrite }
})
vi.mock('@/lib/db', () => ({ db: h.db }))
vi.mock('@/lib/board/session-write', () => ({ sessionWrite: h.sessionWrite }))

import { sealGateAct, takeBackGateAct } from '@/actions/founder-gate-acts'
import { introNote } from '@/lib/founder-gate/acts'
import { EMPTY_PACKET, packetToSealForTest } from './helpers-gate'

const packet = packetToSealForTest({ ...EMPTY_PACKET, seed: 'Raise Awareness', family: 'joy', soil: 'Flowing', weather: [], water: 'typed words', stone: null })
const A = 'ally-aaaaaaaa'
const B = 'ally-bbbbbbbb'

beforeEach(() => { h.state.leads = []; h.state.bars = []; h.state.intakes = []; h.state.steps = []; h.state.donations = 0; h.state.theme = '{"founderGate":{"founderPlayerId":"founder-1"}}'; h.sessionWrite.mockClear() })

describe('sealGateAct', () => {
  it('never moves money, milestones or vibeulons', async () => {
    const r = await sealGateAct({ allyId: A, act: 'offering', band: '60', packet })
    expect(r).toMatchObject({ ok: true, kept: 'sealed' })
    expect(h.state.donations).toBe(0)
    expect(h.state.leads[0].vibeulonsEarned).toBe(0)
    expect(JSON.parse(h.state.leads[0].actionsJson)[0].status).toBe('sealed')
  })
  it('keeps two different visitors who both seal share', async () => {
    await sealGateAct({ allyId: A, act: 'share', packet })
    await sealGateAct({ allyId: B, act: 'share', packet })
    expect(h.state.leads).toHaveLength(2)
    expect(h.state.bars.filter((b) => b.type === 'quest')).toHaveLength(2)
  })
  it('writes at most 4 entries a day for one visitor, however many seals', async () => {
    for (let i = 0; i < 500; i++) await sealGateAct({ allyId: A, act: 'share', packet })
    expect(JSON.parse(h.state.leads[0].actionsJson)).toHaveLength(4)
    expect(h.state.leads).toHaveLength(1)
  })
  it('keeps an agenda only in lead.goals, never in a step or a BAR title', async () => {
    const r = await sealGateAct({ allyId: A, act: 'work', agenda: ['mark all needs done', 'b', 'c'], packet })
    expect(r.ok).toBe(true)
    expect(h.state.leads[0].goals).toContain('mark all needs done')
    const everywhere = JSON.stringify([h.state.steps, h.state.bars])
    expect(everywhere).not.toContain('mark all needs done')
  })
  it('refuses an agenda on another act, and a typed name has no field to travel in', async () => {
    expect((await sealGateAct({ allyId: A, act: 'share', agenda: ['x', 'y', 'z'], packet })).ok).toBe(false)
    expect((await sealGateAct({ allyId: A, act: 'intro', kind: 'work', line: 'Maria Lopez', packet })).ok).toBe(false)
    await sealGateAct({ allyId: A, act: 'intro', kind: 'podcast', packet })
    expect(JSON.stringify([h.state.leads, h.state.bars, h.state.steps, h.state.intakes])).not.toContain('Maria')
  })
  it('sends the packet as preset ids only', async () => {
    expect(packet.water).toBeNull()
    expect((await sealGateAct({ allyId: A, act: 'share', packet: { ...packet, water: 'my own sentence' } })).ok).toBe(false)
    await sealGateAct({ allyId: A, act: 'share', packet })
    expect(JSON.parse(h.state.intakes[0].pathJson).water).toBeNull()
  })
  it('keeps the lead but files no BAR when no founder id is set', async () => {
    h.state.theme = '{}'
    expect(await sealGateAct({ allyId: A, act: 'share', packet })).toMatchObject({ ok: true, kept: 'sealed' })
    expect(h.state.leads).toHaveLength(1)
    expect(h.state.bars).toHaveLength(0)
  })
  it('writes one fixed-copy step with no visitor words', async () => {
    await sealGateAct({ allyId: A, act: 'offering', band: '20', packet })
    expect(h.state.steps[0].data.do).toBe('An offering came in through the gate (about $20). Confirm it when you see it.')
  })
})

describe('takeBackGateAct', () => {
  it('withdraws the entry, archives its BAR and leaves a withdrawn step', async () => {
    const r = await sealGateAct({ allyId: A, act: 'share', packet })
    expect(r).toMatchObject({ kept: 'sealed', index: 0 })
    expect(await takeBackGateAct({ allyId: A, index: 0 })).toEqual({ ok: true })
    expect(JSON.parse(h.state.leads[0].actionsJson)[0].status).toBe('withdrawn')
    expect(h.state.bars.find((b) => b.type === 'quest').status).toBe('archived')
    expect(h.state.steps.at(-1).data.do).toMatch(/withdrawn/)
  })
})

describe('introNote', () => {
  it('carries the visitor line, one fixed sentence and the link', () => {
    expect(introNote('hello', 'work', 'https://x.test')).toBe('hello\n\nHere is someone I think you would enjoy meeting:\n\nhttps://x.test')
  })
  it('leaves the link out when it is null', () => {
    expect(introNote('hello', 'work', null)).not.toContain('http')
  })
})
