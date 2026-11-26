/**
 * Proof-of-purchase claims, tested as results: what a reader can send, what an approval gives them, and that the
 * picture is gone once a claim is decided.
 *
 * Registered in vitest.config.ts include list. Run: npm run test:vitest
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { db, getCurrentPlayer, grantEntitlement, hasBookAccess, sendEmail } = vi.hoisted(() => ({
  db: {
    bookPurchaseClaim: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    player: { findUnique: vi.fn() },
  },
  getCurrentPlayer: vi.fn(),
  grantEntitlement: vi.fn(),
  hasBookAccess: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth', () => ({ getCurrentPlayer }))
vi.mock('@/lib/entitlements/service', () => ({ grantEntitlement }))
vi.mock('@/lib/book-access', () => ({ hasBookAccess }))
vi.mock('@/lib/email', () => ({ sendEmail }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { decideBookClaim, submitBookClaim } from '@/actions/book-claims'

const READER = { id: 'reader-1', roles: [] }
const ADMIN = { id: 'admin-1', roles: [{ role: { key: 'admin' } }] }

function form(fields: { store?: string; note?: string; file?: File }) {
  const fd = new FormData()
  if (fields.store !== undefined) fd.set('store', fields.store)
  if (fields.note !== undefined) fd.set('note', fields.note)
  if (fields.file) fd.set('file', fields.file)
  return fd
}

const photo = () => new File([new Uint8Array([1, 2, 3, 4])], 'receipt.jpg', { type: 'image/jpeg' })

beforeEach(() => {
  vi.clearAllMocks()
  hasBookAccess.mockResolvedValue(false)
  db.bookPurchaseClaim.findMany.mockResolvedValue([])
  db.bookPurchaseClaim.create.mockResolvedValue({ id: 'claim-1' })
  db.player.findUnique.mockResolvedValue({ contactType: 'email', contactValue: 'r@example.com', account: { email: 'r@example.com' } })
  grantEntitlement.mockResolvedValue({ id: 'ent-1' })
  sendEmail.mockResolvedValue({ ok: true, id: 'm1' })
})

describe('submitBookClaim', () => {
  it('stores the picture and its hash for a signed-in reader', async () => {
    getCurrentPlayer.mockResolvedValue(READER)
    const r = await submitBookClaim(form({ store: 'amazon-kindle', note: 'hi', file: photo() }))
    expect(r.ok).toBe(true)
    const data = db.bookPurchaseClaim.create.mock.calls[0][0].data
    expect(data).toMatchObject({ playerId: 'reader-1', store: 'amazon-kindle', note: 'hi', imageType: 'image/jpeg' })
    expect(data.imageHash).toMatch(/^[0-9a-f]{64}$/)
    expect(Buffer.from(data.imageData)).toEqual(Buffer.from([1, 2, 3, 4]))
  })

  it('asks a signed-out visitor to sign in and stores nothing', async () => {
    getCurrentPlayer.mockResolvedValue(null)
    const r = await submitBookClaim(form({ store: 'bookstore', file: photo() }))
    expect(r).toMatchObject({ ok: false, needsAuth: true })
    expect(db.bookPurchaseClaim.create).not.toHaveBeenCalled()
  })

  it('refuses a second open claim, and a reader who already has the book', async () => {
    getCurrentPlayer.mockResolvedValue(READER)
    db.bookPurchaseClaim.findMany.mockResolvedValue([{ status: 'pending' }])
    expect((await submitBookClaim(form({ store: 'bookstore', file: photo() }))).ok).toBe(false)
    db.bookPurchaseClaim.findMany.mockResolvedValue([])
    hasBookAccess.mockResolvedValue(true)
    expect((await submitBookClaim(form({ store: 'bookstore', file: photo() }))).ok).toBe(false)
    expect(db.bookPurchaseClaim.create).not.toHaveBeenCalled()
  })

  it('refuses a file that is not a picture or a PDF', async () => {
    getCurrentPlayer.mockResolvedValue(READER)
    const html = new File(['<script>'], 'x.html', { type: 'text/html' })
    expect((await submitBookClaim(form({ store: 'bookstore', file: html }))).ok).toBe(false)
    expect(db.bookPurchaseClaim.create).not.toHaveBeenCalled()
  })
})

describe('decideBookClaim', () => {
  const pending = { id: 'claim-1', playerId: 'reader-1', status: 'pending' }

  it('only an admin can decide', async () => {
    getCurrentPlayer.mockResolvedValue(READER)
    const r = await decideBookClaim({ claimId: 'claim-1', decision: 'approve' })
    expect(r.ok).toBe(false)
    expect(grantEntitlement).not.toHaveBeenCalled()
  })

  it('approval grants the digital book, erases the picture and emails the reader', async () => {
    getCurrentPlayer.mockResolvedValue(ADMIN)
    db.bookPurchaseClaim.findUnique.mockResolvedValue(pending)
    expect((await decideBookClaim({ claimId: 'claim-1', decision: 'approve' })).ok).toBe(true)
    expect(grantEntitlement).toHaveBeenCalledWith({
      playerId: 'reader-1',
      sku: 'book-digital',
      source: 'proof',
      externalOrderId: 'proof:claim-1',
    })
    expect(db.bookPurchaseClaim.update.mock.calls[0][0].data).toMatchObject({
      status: 'approved',
      entitlementId: 'ent-1',
      imageData: null,
    })
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: 'r@example.com', subject: 'Your book is confirmed' })
  })

  it('a decline grants nothing, erases the picture and passes the reason on', async () => {
    getCurrentPlayer.mockResolvedValue(ADMIN)
    db.bookPurchaseClaim.findUnique.mockResolvedValue(pending)
    await decideBookClaim({ claimId: 'claim-1', decision: 'decline', reason: 'the title is cut off' })
    expect(grantEntitlement).not.toHaveBeenCalled()
    expect(db.bookPurchaseClaim.update.mock.calls[0][0].data).toMatchObject({ status: 'declined', imageData: null })
    expect(sendEmail.mock.calls[0][0].text).toContain('the title is cut off')
  })

  it('a claim already decided is left alone', async () => {
    getCurrentPlayer.mockResolvedValue(ADMIN)
    db.bookPurchaseClaim.findUnique.mockResolvedValue({ ...pending, status: 'approved' })
    expect((await decideBookClaim({ claimId: 'claim-1', decision: 'approve' })).ok).toBe(false)
    expect(grantEntitlement).not.toHaveBeenCalled()
  })
})
