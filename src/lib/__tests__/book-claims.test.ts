import { describe, expect, it } from 'vitest'
import { CLAIM_MAX_BYTES, canSubmitClaim, checkClaimUpload, isClaimStore, storeLabel } from '@/lib/book-claims'

describe('checkClaimUpload', () => {
  const ok = { store: 'amazon-paperback', size: 200_000, type: 'image/jpeg' }

  it('accepts a photo from a known store', () => {
    expect(checkClaimUpload(ok)).toEqual({ ok: true })
    expect(checkClaimUpload({ ...ok, type: 'application/pdf' })).toEqual({ ok: true })
  })

  it('needs a store, a file, a known type and a modest size', () => {
    expect(checkClaimUpload({ ...ok, store: '' }).ok).toBe(false)
    expect(checkClaimUpload({ ...ok, size: 0 }).ok).toBe(false)
    expect(checkClaimUpload({ ...ok, size: CLAIM_MAX_BYTES + 1 }).ok).toBe(false)
    expect(checkClaimUpload({ ...ok, type: 'text/html' }).ok).toBe(false)
    expect(checkClaimUpload({ ...ok, type: 'image/svg+xml' }).ok).toBe(false)
    expect(checkClaimUpload({ ...ok, note: 'x'.repeat(501) }).ok).toBe(false)
  })
})

describe('canSubmitClaim', () => {
  it('lets a reader send a first claim, or another after a decline', () => {
    expect(canSubmitClaim([]).ok).toBe(true)
    expect(canSubmitClaim([{ status: 'declined' }]).ok).toBe(true)
  })

  it('holds one open claim at a time and stops after an approval', () => {
    expect(canSubmitClaim([{ status: 'pending' }]).ok).toBe(false)
    expect(canSubmitClaim([{ status: 'declined' }, { status: 'approved' }]).ok).toBe(false)
  })
})

describe('stores', () => {
  it('labels known stores and passes unknown values through', () => {
    expect(isClaimStore('bookstore')).toBe(true)
    expect(isClaimStore('gumroad')).toBe(false)
    expect(storeLabel('amazon-kindle')).toBe('Amazon, Kindle edition')
    expect(storeLabel('mystery')).toBe('mystery')
  })
})
