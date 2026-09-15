/**
 * The mailing list, tested as results rather than mechanisms.
 *
 * "Does addToList call contacts.update" is a mechanism. "Can a signup form put
 * someone who unsubscribed back on the list" is the result, and it is the
 * check. So is "does a Chapter One reader end up on a list at all."
 *
 * Registered in vitest.config.ts include list. Run: npm run test:vitest
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { resend, getResend } = vi.hoisted(() => {
  const resend = {
    segments: { list: vi.fn(), create: vi.fn() },
    contacts: {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      segments: { add: vi.fn() },
    },
    contactProperties: { list: vi.fn(), create: vi.fn() },
  }
  return { resend, getResend: vi.fn(() => resend as unknown) }
})

vi.mock('@/lib/email/resend', () => ({ getResend }))
vi.mock('@/lib/email/awaken', () => ({ absoluteUrl: (p: string) => `https://site.test${p}` }))

import { LIST_SEGMENTS } from '@/lib/esp/list-contract'
import {
  addToList,
  clearListCaches,
  ensureStringProperty,
  isContactId,
  listUnsubscribeHeaders,
  unsubscribeContact,
  unsubscribePageUrl,
} from '@/lib/esp/resend-list'

const CONTACT_ID = '3f2b8c1e-9a4d-4e6f-8b21-5c7d9e0a1b2c'
const ok = <T>(data: T) => ({ data, error: null, headers: null })
const fail = (name: string, message = name) => ({ data: null, error: { name, message, statusCode: 400 }, headers: null })

beforeEach(() => {
  vi.clearAllMocks()
  clearListCaches()
  getResend.mockImplementation(() => resend as unknown)
  resend.segments.list.mockResolvedValue(
    ok({
      object: 'list',
      has_more: false,
      data: Object.values(LIST_SEGMENTS).map((terms, i) => ({ id: `seg-${i}`, name: terms.resendName, created_at: '' })),
    }),
  )
  resend.contacts.segments.add.mockResolvedValue(ok({ id: 'x' }))
})

// ── Who can be on the list at all ───────────────────────────────────────────

describe('the list contract', () => {
  it('has exactly the four surfaces that promised later mail', () => {
    expect(Object.keys(LIST_SEGMENTS).sort()).toEqual(['character-sheet', 'introductions', 'nonprofit', 'succession'])
  })

  it('keeps the character sheet reminder-only, and says so where Broadcasts are composed', () => {
    expect(LIST_SEGMENTS['character-sheet'].broadcast).toBe(false)
    expect(LIST_SEGMENTS['character-sheet'].resendName).toMatch(/quarterly reminder only/)
  })
})

// ── Adding someone ──────────────────────────────────────────────────────────

describe('addToList', () => {
  it('skips quietly when email is not configured', async () => {
    getResend.mockReturnValue(null)
    const result = await addToList({ email: 'a@b.co', segment: 'succession' })
    expect(result).toMatchObject({ ok: true, skipped: true })
  })

  it('creates a new contact inside its segment, with no unsubscribe value of its own', async () => {
    resend.contacts.get.mockResolvedValue(fail('not_found'))
    resend.contacts.create.mockResolvedValue(ok({ object: 'contact', id: CONTACT_ID }))

    const result = await addToList({ email: ' Sam@Example.com ', firstName: 'Sam', segment: 'succession' })

    expect(result).toMatchObject({ ok: true, created: true, contact: { id: CONTACT_ID, unsubscribed: false } })
    const payload = resend.contacts.create.mock.calls[0][0]
    expect(payload).toEqual({ email: 'sam@example.com', firstName: 'Sam', segments: [{ id: 'seg-1' }] })
  })

  it('creates a missing segment once, then reuses it', async () => {
    resend.segments.list.mockResolvedValue(ok({ object: 'list', has_more: false, data: [] }))
    resend.segments.create.mockResolvedValue(ok({ object: 'segment', id: 'new-seg', name: 'succession' }))
    resend.contacts.get.mockResolvedValue(fail('not_found'))
    resend.contacts.create.mockResolvedValue(ok({ object: 'contact', id: CONTACT_ID }))

    await addToList({ email: 'a@b.co', segment: 'succession' })
    await addToList({ email: 'c@d.co', segment: 'succession' })

    expect(resend.segments.create).toHaveBeenCalledTimes(1)
    expect(resend.segments.create).toHaveBeenCalledWith({ name: LIST_SEGMENTS.succession.resendName })
  })

  it('never puts someone who unsubscribed back on the list', async () => {
    resend.contacts.get.mockResolvedValue(
      ok({ object: 'contact', id: CONTACT_ID, email: 'a@b.co', unsubscribed: true, properties: {} }),
    )

    const result = await addToList({ email: 'a@b.co', segment: 'nonprofit' })

    expect(result).toMatchObject({ ok: true, created: false, contact: { unsubscribed: true } })
    expect(resend.contacts.update).not.toHaveBeenCalled()
    expect(resend.contacts.create).not.toHaveBeenCalled()
  })

  it('still returns the contact when the segment add fails', async () => {
    resend.contacts.get.mockResolvedValue(
      ok({
        object: 'contact',
        id: CONTACT_ID,
        email: 'a@b.co',
        unsubscribed: false,
        properties: { sheet_reminder_quarter: { type: 'string', value: '2026-Q4' } },
      }),
    )
    resend.contacts.segments.add.mockResolvedValue(fail('validation_error', 'already in segment'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await addToList({ email: 'a@b.co', segment: 'character-sheet' })

    expect(result).toMatchObject({
      ok: true,
      contact: { id: CONTACT_ID, properties: { sheet_reminder_quarter: '2026-Q4' } },
    })
  })

  it('reports a lookup failure without creating a duplicate', async () => {
    resend.contacts.get.mockResolvedValue(fail('rate_limit_exceeded'))
    const result = await addToList({ email: 'a@b.co', segment: 'succession' })
    expect(result.ok).toBe(false)
    expect(resend.contacts.create).not.toHaveBeenCalled()
  })

  it('never throws, even when the client does', async () => {
    resend.contacts.get.mockRejectedValue(new Error('network down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(addToList({ email: 'a@b.co', segment: 'succession' })).resolves.toEqual({
      ok: false,
      error: 'network down',
    })
  })
})

// ── Leaving ─────────────────────────────────────────────────────────────────

describe('unsubscribe', () => {
  it('accepts only a contact id, so a guessed string reaches nothing', async () => {
    expect(isContactId(CONTACT_ID)).toBe(true)
    expect(isContactId('someone@example.com')).toBe(false)
    expect(await unsubscribeContact('../../admin')).toEqual({ ok: false, error: 'invalid contact id' })
    expect(resend.contacts.update).not.toHaveBeenCalled()
  })

  it('sets the one suppression flag every list send reads', async () => {
    resend.contacts.update.mockResolvedValue(ok({ object: 'contact', id: CONTACT_ID }))
    expect(await unsubscribeContact(CONTACT_ID)).toEqual({ ok: true })
    expect(resend.contacts.update).toHaveBeenCalledWith({ id: CONTACT_ID, unsubscribed: true })
  })

  it('builds the footer link and the RFC 8058 one-click headers', () => {
    expect(unsubscribePageUrl(CONTACT_ID)).toBe(`https://site.test/unsubscribe?c=${CONTACT_ID}`)
    expect(listUnsubscribeHeaders(CONTACT_ID)).toEqual({
      'List-Unsubscribe': `<https://site.test/api/list/unsubscribe?c=${CONTACT_ID}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    })
  })
})

describe('ensureStringProperty', () => {
  it('creates the property only when it is missing', async () => {
    resend.contactProperties.list.mockResolvedValue(ok({ object: 'list', has_more: false, data: [] }))
    resend.contactProperties.create.mockResolvedValue(ok({ object: 'contact_property', id: 'p1' }))
    expect(await ensureStringProperty('sheet_reminder_quarter')).toBe(true)
    expect(resend.contactProperties.create).toHaveBeenCalledWith({ key: 'sheet_reminder_quarter', type: 'string' })

    vi.clearAllMocks()
    resend.contactProperties.list.mockResolvedValue(
      ok({ object: 'list', has_more: false, data: [{ key: 'sheet_reminder_quarter' }] }),
    )
    expect(await ensureStringProperty('sheet_reminder_quarter')).toBe(true)
    expect(resend.contactProperties.create).not.toHaveBeenCalled()
  })
})
