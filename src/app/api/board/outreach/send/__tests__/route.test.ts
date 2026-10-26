import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const owner = vi.hoisted(() => ({ isBoardOwner: vi.fn() }))
const email = vi.hoisted(() => ({ sendEmail: vi.fn() }))
const rows = vi.hoisted(() => ({ latest: null as unknown, created: [] as Record<string, unknown>[] }))
vi.mock('@/lib/board/owner', () => owner)
vi.mock('@/lib/email/send', () => email)
vi.mock('@/lib/db', () => {
  const boardSave = {
    findFirst: vi.fn(async () => (rows.latest ? { data: rows.latest } : null)),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { rows.created.push(data); rows.latest = data.data; return {} }),
  }
  const tx = { boardSave, $executeRaw: vi.fn(async () => 0) }
  return { db: { boardSave, $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx) } }
})

import { GET, POST } from '../route'
import { approvalHash } from '@/lib/board/outreach'

const req = (body: unknown, origin?: string) => ({
  headers: { get: (k: string) => (k === 'origin' ? origin ?? null : null) },
  nextUrl: { host: 'bars-engine.vercel.app' },
  json: async () => body,
}) as never

function approved(extra: Record<string, unknown> = {}) {
  const d = { to: ['someone@example.org'], cc: [], subject: 'Hi', body: 'Hello there.\nWendell', status: 'send', messageId: null }
  return { name: 'Someone', draft: { ...d, approvedHash: approvalHash(d.to, d.cc, d.subject, d.body), ...extra }, letterInHand: 'x' }
}

describe('/api/board/outreach/send', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    owner.isBoardOwner.mockResolvedValue(true)
    rows.latest = null; rows.created = []
    for (const k of ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'RESEND_API_KEY', 'EMAIL_FROM']) delete process.env[k]
  })

  it('refuses a visitor who is not the owner', async () => {
    owner.isBoardOwner.mockResolvedValue(false)
    expect((await POST(req({ contactId: 'a' }))).status).toBe(401)
    expect((await GET()).status).toBe(401)
  })

  it('reports no server sender, and a POST then sends nothing', async () => {
    expect(await (await GET()).json()).toEqual({ gmail: false, resend: false, rung: null })
    rows.latest = approved()
    const r = await POST(req({ contactId: 'someone' }))
    expect(r.status).toBe(503)
    expect(rows.created).toEqual([])
  })

  describe('with Resend set up', () => {
    beforeEach(() => { process.env.RESEND_API_KEY = 'k'; process.env.EMAIL_FROM = 'Wendell <hello@example.org>' })

    it('sends an approved draft once: sending, then sent with the id', async () => {
      rows.latest = approved()
      email.sendEmail.mockResolvedValue({ ok: true, id: 'rs_1' })
      const r = await POST(req({ contactId: 'someone' }, 'https://bars-engine.vercel.app'))
      expect(r.status).toBe(200)
      expect(rows.created.map(c => (c.data as { draft: { status: string } }).draft.status)).toEqual(['sending', 'sent'])
      const sent = rows.latest as { draft: Record<string, unknown>; letterInHand: unknown }
      expect(sent.draft).toMatchObject({ status: 'sent', via: 'resend', messageId: 'rs_1' })
      expect(sent.letterInHand).toBeNull()
      expect(email.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: ['someone@example.org'], subject: 'Hi',
        text: 'Hello there.\nWendell' }))
      // A second press finds it sent and sends nothing.
      expect((await POST(req({ contactId: 'someone' }))).status).toBe(409)
      expect(email.sendEmail).toHaveBeenCalledTimes(1)
    })

    it('refuses text that changed after his Send, and a draft not approved', async () => {
      const c = approved(); c.draft.body += ' A line he never saw.'; rows.latest = c
      expect((await POST(req({ contactId: 'someone' }))).status).toBe(409)
      rows.latest = approved({ status: 'draft' })
      expect((await POST(req({ contactId: 'someone' }))).status).toBe(409)
      expect(email.sendEmail).not.toHaveBeenCalled()
      expect(rows.created).toEqual([])
    })

    it('puts a refused send back to send with the error', async () => {
      rows.latest = approved()
      email.sendEmail.mockResolvedValue({ ok: false, error: 'domain not verified' })
      const r = await POST(req({ contactId: 'someone' }))
      expect(r.status).toBe(502)
      expect((rows.latest as { draft: Record<string, unknown> }).draft).toMatchObject({ status: 'send', lastError: 'resend refused (domain not verified)' })
    })

    it('refuses a cross-site request', async () => {
      rows.latest = approved()
      expect((await POST(req({ contactId: 'someone' }, 'https://evil.example'))).status).toBe(403)
    })
  })
})
