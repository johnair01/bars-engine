import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const blob = vi.hoisted(() => ({ put: vi.fn(), list: vi.fn() }))
vi.mock('@vercel/blob', () => blob)
const auth = vi.hoisted(() => ({ getCurrentPlayer: vi.fn() }))
vi.mock('@/lib/auth', () => auth)
const dbm = vi.hoisted(() => ({ boardSave: { findFirst: vi.fn(), create: vi.fn() } }))
vi.mock('@/lib/db', () => ({ db: dbm }))

import { POST } from '../route'

const req = (body: unknown) => ({ json: async () => body }) as never
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
const mark = { x: 120, y: 340, w: 375, h: 812 }

describe('/api/council/preview-shots POST', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    auth.getCurrentPlayer.mockResolvedValue({ id: 'p1', name: 'Wendell' })
    blob.put.mockImplementation(async (path: string) => ({ url: `https://blob.test/${path}`, pathname: path }))
    dbm.boardSave.findFirst.mockResolvedValue(null)
    dbm.boardSave.create.mockResolvedValue({})
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_GIT_PULL_REQUEST_ID', '512')
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'abc123')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'claude/x')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('takes a mark without a picture, stores only the json, and lands a causes row', async () => {
    const res = await POST(req({ page: 'https://p.vercel.app/ontology-game/between?g=1', note: "camera's under the table edge",
      mark, look: 'pm-mark-look-1', errLog: ['TypeError: x'] }))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, image: null, stored: true, row: true })
    expect(blob.put).toHaveBeenCalledTimes(1)
    expect(blob.put.mock.calls[0][0]).toMatch(/^preview-shots\/.+-[a-z0-9]+\.json$/)
    const meta = JSON.parse(blob.put.mock.calls[0][1])
    expect(meta).toMatchObject({ player: 'p1', name: 'Wendell', mark, look: 'pm-mark-look-1', pr: '512', build: 'abc123', branch: 'claude/x', env: 'preview' })
    const saved = dbm.boardSave.create.mock.calls[0][0].data
    expect(saved).toMatchObject({ board: 'council', collection: 'rows', recordedAt: null })
    expect(saved.docId).toMatch(/^mark-/)
    expect(saved.data).toMatchObject({ kind: 'causes', pass: 'preview-marks', pr: '512', look: 'pm-mark-look-1',
      desc: "camera's under the table edge (on /ontology-game/between, preview of pull request #512)" })
    expect(saved.data.mark).not.toHaveProperty('image')
  })

  it('takes an unsigned mark on a preview but not in production', async () => {
    auth.getCurrentPlayer.mockResolvedValue(null)
    expect((await POST(req({ note: 'n', mark }))).status).toBe(200)
    expect(JSON.parse(blob.put.mock.calls[0][1])).toMatchObject({ player: null, name: 'unsigned' })
    vi.stubEnv('VERCEL_ENV', 'production')
    expect((await POST(req({ note: 'n', mark }))).status).toBe(401)
  })

  it('refuses a bad mark, a bad look and a long error log', async () => {
    expect((await POST(req({ note: 'n', mark: { x: 'a', y: 1, w: 1, h: 1 } }))).status).toBe(400)
    expect((await POST(req({ note: 'n', mark: { x: -5, y: 1, w: 375, h: 812 } }))).status).toBe(400)
    expect((await POST(req({ note: 'n', mark, look: '../etc' }))).status).toBe(400)
    expect((await POST(req({ note: 'n', mark, errLog: Array(21).fill('e') }))).status).toBe(400)
    expect(blob.put).not.toHaveBeenCalled()
  })

  it('still checks a picture when one is sent, and still needs one without a mark', async () => {
    expect((await POST(req({ note: 'n', mark, image: 'data:image/gif;base64,AAAA' }))).status).toBe(400)
    expect((await POST(req({ note: 'n' }))).status).toBe(400)
    const ok = await POST(req({ note: 'n', mark, image: JPEG }))
    expect(ok.status).toBe(200)
    expect(blob.put.mock.calls.map(c => c[0])).toEqual([expect.stringMatching(/\.jpg$/), expect.stringMatching(/\.json$/)])
    expect(dbm.boardSave.create.mock.calls[0][0].data.data.image).toMatch(/^https:\/\/blob\.test\//)
  })

  it('answers ok with row false when the board write fails', async () => {
    dbm.boardSave.findFirst.mockRejectedValue(new Error('db down'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(await (await POST(req({ note: 'n', mark }))).json()).toMatchObject({ ok: true, row: false })
    spy.mockRestore()
  })
})
