import { beforeEach, describe, expect, it, vi } from 'vitest'
// GET and POST /api/lantern/table signed in and signed out (bars-engine .specify/specs/lantern-table, T013, FR-015).
// The route and pg-store run as written; only the sign-in and the Prisma client are stood in for.

vi.mock('server-only', () => ({}))
const auth = vi.hoisted(() => ({ currentPlayer: vi.fn() }))
vi.mock('@/lib/between/store', () => auth)
const dbm = vi.hoisted(() => ({ lanternTable: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn() } }))
vi.mock('@/lib/db', () => ({ db: dbm }))

import { GET, POST } from '../route'

const req = (body: unknown) => ({ json: async () => body }) as never
const INTAKE = { goal: 'Send the TDT director application', want: ['fire'], now: { metal: 2 }, truth: { metal: true }, truthCtx: {}, res: [true, true, true, false, true, true], tags: [{ fire: 2 }, {}, {}, {}, {}, {}] }

describe('/api/lantern/table', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    auth.currentPlayer.mockResolvedValue({ id: 'p1' })
  })

  it('GET signed out is 401', async () => {
    auth.currentPlayer.mockResolvedValue(null)
    const r = await GET()
    expect(r.status).toBe(401)
    expect((await r.json()).error).toBeTruthy()
  })

  it('GET signed in returns the newest table of that player, or null', async () => {
    dbm.lanternTable.findFirst.mockResolvedValue({ id: 't1', intake: INTAKE })
    const r = await GET()
    expect(r.status).toBe(200)
    expect((await r.json()).table).toMatchObject({ id: 't1', intake: { goal: INTAKE.goal, res: INTAKE.res } })
    expect(dbm.lanternTable.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { playerId: 'p1' } }))
    dbm.lanternTable.findFirst.mockResolvedValue(null)
    expect((await (await GET()).json()).table).toBeNull()
  })

  it('POST signed out is 401 and writes nothing', async () => {
    auth.currentPlayer.mockResolvedValue(null)
    expect((await POST(req({ intake: INTAKE }))).status).toBe(401)
    expect(dbm.lanternTable.create).not.toHaveBeenCalled()
  })

  it('POST deals a new table for the player', async () => {
    dbm.lanternTable.create.mockResolvedValue({ id: 't9' })
    const r = await POST(req({ intake: INTAKE }))
    expect(await r.json()).toEqual({ id: 't9' })
    expect(dbm.lanternTable.create.mock.calls[0][0].data.playerId).toBe('p1')
  })

  it('POST is 400 when the intake lacks a goal or six reservations', async () => {
    expect((await POST(req({ intake: { ...INTAKE, goal: '' } }))).status).toBe(400)
    expect((await POST(req({ intake: { ...INTAKE, res: [true] } }))).status).toBe(400)
    expect((await POST(req(null))).status).toBe(400)
  })

  it('POST with an id saves onto the player\'s own table, and is 404 for another player\'s', async () => {
    dbm.lanternTable.updateMany.mockResolvedValue({ count: 1 })
    expect(await (await POST(req({ id: 't1', intake: INTAKE }))).json()).toEqual({ id: 't1' })
    expect(dbm.lanternTable.updateMany.mock.calls[0][0].where).toEqual({ id: 't1', playerId: 'p1' })
    dbm.lanternTable.updateMany.mockResolvedValue({ count: 0 })
    expect((await POST(req({ id: 'not-mine', intake: INTAKE }))).status).toBe(404)
  })
})
