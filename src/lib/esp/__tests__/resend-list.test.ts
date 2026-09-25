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
    topics: { list: vi.fn(), create: vi.fn() },
    contacts: {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      segments: { add: vi.fn() },
      topics: { update: vi.fn() },
    },
    contactProperties: { list: vi.fn(), create: vi.fn() },
  }
  return { resend, getResend: vi.fn(() => resend as unknown) }
})

vi.mock('@/lib/email/resend', () => ({ getResend }))
vi.mock('@/lib/email/awaken', () => ({ absoluteUrl: (p: string) => `https://site.test${p}` }))

import { LIST_TERMS, MAILING_LIST_SEGMENT } from '@/lib/esp/list-contract'
import {
  addToList,
  clearListCaches,
  ensureStringProperty,
  isContactId,
  listUnsubscribeHeaders,
  TOPICS_JOINED_PROPERTY,
  unsubscribeContact,
  unsubscribePageUrl,
} from '@/lib/esp/resend-list'

const CONTACT_ID = '3f2b8c1e-9a4d-4e6f-8b21-5c7d9e0a1b2c'
const ok = <T>(data: T) => ({ data, error: null, headers: null })
const fail = (name: string, message = name) => ({ data: null, error: { name, message, statusCode: 400 }, headers: null })

function existing(extra: { unsubscribed?: boolean; joined?: string } = {}) {
  return ok({
    object: 'contact',
    id: CONTACT_ID,
    email: 'a@b.co',
    unsubscribed: extra.unsubscribed ?? false,
    properties: extra.joined ? { [TOPICS_JOINED_PROPERTY]: { type: 'string', value: extra.joined } } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  clearListCaches()
  getResend.mockImplementation(() => resend as unknown)
  resend.segments.list.mockResolvedValue(
    ok({ object: 'list', has_more: false, data: [{ id: 'seg-list', name: MAILING_LIST_SEGMENT, created_at: '' }] }),
  )
  resend.topics.list.mockResolvedValue(
    ok({
      data: [
        { id: 'topic-succession', name: 'succession', default_subscription: 'opt_out', created_at: '' },
        { id: 'topic-nonprofit', name: 'nonprofit founding circle', default_subscription: 'opt_out', created_at: '' },
      ],
    }),
  )
  resend.contactProperties.list.mockResolvedValue(
    ok({ object: 'list', has_more: false, data: [{ key: TOPICS_JOINED_PROPERTY }] }),
  )
  resend.contacts.segments.add.mockResolvedValue(ok({ id: 'x' }))
  resend.contacts.topics.update.mockResolvedValue(ok({ id: CONTACT_ID }))
  resend.contacts.update.mockResolvedValue(ok({ object: 'contact', id: CONTACT_ID }))
})

// ── Who can be on which list ────────────────────────────────────────────────

describe('the list contract', () => {
  it('has exactly the four pages that promised later mail', () => {
    expect(Object.keys(LIST_TERMS).sort()).toEqual(['character-sheet', 'introductions', 'nonprofit', 'succession'])
  })

  it('gives every update list its own topic, and the character sheet none', () => {
    expect(LIST_TERMS['character-sheet'].topic).toBeNull()
    const topics = ['succession', 'nonprofit', 'introductions'].map((l) => LIST_TERMS[l as 'succession'].topic)
    expect(new Set(topics).size).toBe(3)
    expect(topics.every(Boolean)).toBe(true)
  })
})

// ── Adding someone ──────────────────────────────────────────────────────────

describe('addToList', () => {
  it('skips quietly when email is not configured', async () => {
    getResend.mockReturnValue(null)
    const result = await addToList({ email: 'a@b.co', list: 'succession' })
    expect(result).toMatchObject({ ok: true, skipped: true })
  })

  it('creates a new contact in the mailing list, opted into its one topic', async () => {
    resend.contacts.get.mockResolvedValue(fail('not_found'))
    resend.contacts.create.mockResolvedValue(ok({ object: 'contact', id: CONTACT_ID }))

    const result = await addToList({ email: ' Sam@Example.com ', firstName: 'Sam', list: 'succession' })

    expect(result).toMatchObject({ ok: true, created: true, contact: { id: CONTACT_ID, unsubscribed: false } })
    expect(resend.contacts.create.mock.calls[0][0]).toEqual({
      email: 'sam@example.com',
      firstName: 'Sam',
      segments: [{ id: 'seg-list' }],
      topics: [{ id: 'topic-succession', subscription: 'opt_in' }],
      properties: { [TOPICS_JOINED_PROPERTY]: 'succession' },
    })
  })

  it('keeps a character-sheet reader out of every segment and topic', async () => {
    resend.contacts.get.mockResolvedValue(fail('not_found'))
    resend.contacts.create.mockResolvedValue(ok({ object: 'contact', id: CONTACT_ID }))

    await addToList({ email: 'a@b.co', list: 'character-sheet' })

    expect(resend.contacts.create.mock.calls[0][0]).toEqual({ email: 'a@b.co' })
    expect(resend.segments.list).not.toHaveBeenCalled()
    expect(resend.topics.list).not.toHaveBeenCalled()
  })

  it('creates the segment and a missing topic once, with opt-out as the default', async () => {
    resend.segments.list.mockResolvedValue(ok({ object: 'list', has_more: false, data: [] }))
    resend.segments.create.mockResolvedValue(ok({ object: 'segment', id: 'seg-new', name: MAILING_LIST_SEGMENT }))
    resend.topics.create.mockResolvedValue(ok({ id: 'topic-intro' }))
    resend.contacts.get.mockResolvedValue(fail('not_found'))
    resend.contacts.create.mockResolvedValue(ok({ object: 'contact', id: CONTACT_ID }))

    await addToList({ email: 'a@b.co', list: 'introductions' })
    await addToList({ email: 'c@d.co', list: 'introductions' })

    expect(resend.segments.create).toHaveBeenCalledTimes(1)
    expect(resend.segments.create).toHaveBeenCalledWith({ name: MAILING_LIST_SEGMENT })
    expect(resend.topics.create).toHaveBeenCalledTimes(1)
    expect(resend.topics.create).toHaveBeenCalledWith({ name: 'introductions', defaultSubscription: 'opt_out' })
  })

  it('opts an existing contact into a new topic once, and records it', async () => {
    resend.contacts.get.mockResolvedValue(existing({ joined: 'succession' }))

    const result = await addToList({ email: 'a@b.co', list: 'nonprofit' })

    expect(resend.contacts.segments.add).toHaveBeenCalledWith({ email: 'a@b.co', segmentId: 'seg-list' })
    expect(resend.contacts.topics.update).toHaveBeenCalledWith({
      email: 'a@b.co',
      topics: [{ id: 'topic-nonprofit', subscription: 'opt_in' }],
    })
    expect(resend.contacts.update).toHaveBeenCalledWith({
      email: 'a@b.co',
      properties: { [TOPICS_JOINED_PROPERTY]: 'succession,nonprofit founding circle' },
    })
    expect(result).toMatchObject({ ok: true, created: false })
  })

  it('leaves a topic alone once the contact has joined it, so a reader who left stays out', async () => {
    resend.contacts.get.mockResolvedValue(existing({ joined: 'succession' }))

    await addToList({ email: 'a@b.co', list: 'succession' })

    expect(resend.contacts.topics.update).not.toHaveBeenCalled()
    expect(resend.contacts.update).not.toHaveBeenCalled()
  })

  it('never puts someone who unsubscribed back on the list', async () => {
    resend.contacts.get.mockResolvedValue(existing({ unsubscribed: true }))

    const result = await addToList({ email: 'a@b.co', list: 'nonprofit' })

    expect(result).toMatchObject({ ok: true, created: false, contact: { unsubscribed: true } })
    expect(resend.contacts.create).not.toHaveBeenCalled()
    for (const [call] of resend.contacts.update.mock.calls) expect(call).not.toHaveProperty('unsubscribed')
  })

  it('still returns the contact when the segment add fails', async () => {
    resend.contacts.get.mockResolvedValue(existing({ joined: 'succession' }))
    resend.contacts.segments.add.mockResolvedValue(fail('validation_error', 'already in segment'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await addToList({ email: 'a@b.co', list: 'succession' })

    expect(result).toMatchObject({ ok: true, contact: { id: CONTACT_ID } })
  })

  it('reports a segment the plan will not allow, with Resend\'s reason', async () => {
    resend.segments.list.mockResolvedValue(ok({ object: 'list', has_more: false, data: [] }))
    resend.segments.create.mockResolvedValue(fail('validation_error', 'Your plan includes 3 segments.'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await addToList({ email: 'a@b.co', list: 'nonprofit' })

    expect(result).toEqual({ ok: false, error: `could not resolve segment "${MAILING_LIST_SEGMENT}"` })
    expect(resend.contacts.create).not.toHaveBeenCalled()
  })

  it('reports a lookup failure without creating a duplicate', async () => {
    resend.contacts.get.mockResolvedValue(fail('rate_limit_exceeded'))
    const result = await addToList({ email: 'a@b.co', list: 'succession' })
    expect(result.ok).toBe(false)
    expect(resend.contacts.create).not.toHaveBeenCalled()
  })

  it('never throws, even when the client does', async () => {
    resend.contacts.get.mockRejectedValue(new Error('network down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(addToList({ email: 'a@b.co', list: 'character-sheet' })).resolves.toEqual({
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
