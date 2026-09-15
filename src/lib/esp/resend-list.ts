/**
 * The mailing list, held in Resend Contacts — the one place this project talks
 * to a list.
 *
 * Replaces the Kit client, which was chosen on 2026-08-10 and never switched on
 * (MAILING_LIST_SIX_FACES.md). The shape is the same persist-then-send contract:
 * callers save their own row first, then call {@link addToList}. It never
 * throws, so a caller reads the result instead of catching. Postgres is the list
 * of record, and a Resend contact is a copy of a row that is already committed.
 *
 * Not configured is a normal state. Local, preview and CI run without
 * `RESEND_API_KEY` and get `{ ok: true, skipped: true }`.
 *
 * Who belongs in which segment is decided by `list-contract.ts`, not here.
 *
 * **One suppression store.** A contact's `unsubscribed` flag is the only record
 * of who left. Broadcasts honor it natively, the quarterly reminder reads it
 * before every send, and nothing here ever sets it back to false: a new signup
 * from an address that unsubscribed stays unsubscribed, because a form anyone
 * can fill in is no proof the owner of the address changed their mind.
 */
import type { Resend } from 'resend'
import { absoluteUrl } from '@/lib/email/awaken'
import { getResend } from '@/lib/email/resend'
import { LIST_SEGMENTS, type ListSegment } from './list-contract'

export type ListSyncInput = {
  email: string
  firstName?: string | null
  segment: ListSegment
}

export type ListContact = {
  id: string
  email: string
  unsubscribed: boolean
  /** Custom string properties, flattened from Resend's `{ type, value }` shape. */
  properties: Record<string, string>
}

export type ListSyncResult =
  | { ok: true; skipped?: false; contact: ListContact; created: boolean }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string }

/** Resend errors come back as values. Name the call so the log says which one. */
function describe(call: string, error: { message: string; name?: string } | null): string {
  return `resend ${call} -> ${error?.name ?? 'error'}: ${error?.message ?? 'unknown'}`
}

// ── Segment ids, resolved once per process ──────────────────────────────────

let segmentCache: Map<string, string> | null = null

/** Exposed for tests, and for a long-lived process that renames segments. */
export function clearListCaches(): void {
  segmentCache = null
}

async function loadSegments(resend: Resend): Promise<Map<string, string>> {
  if (segmentCache) return segmentCache
  const cache = new Map<string, string>()
  let after: string | undefined
  for (let page = 0; page < 10; page++) {
    const res = await resend.segments.list(after ? { limit: 100, after } : { limit: 100 })
    if (res.error || !res.data) break
    for (const segment of res.data.data) cache.set(segment.name, segment.id)
    if (!res.data.has_more || res.data.data.length === 0) break
    after = res.data.data[res.data.data.length - 1].id
  }
  segmentCache = cache
  return cache
}

/** The Resend id for a segment, creating the segment the first time it is used. */
async function resolveSegmentId(resend: Resend, segment: ListSegment): Promise<string | null> {
  const name = LIST_SEGMENTS[segment].resendName
  const cache = await loadSegments(resend)
  const cached = cache.get(name)
  if (cached) return cached

  const created = await resend.segments.create({ name })
  if (created.error || !created.data) {
    console.error('[list]', describe(`segments.create "${name}"`, created.error))
    return null
  }
  cache.set(name, created.data.id)
  return created.data.id
}

// ── Contacts ────────────────────────────────────────────────────────────────

function flattenProperties(
  raw: Record<string, { value: string | number } | undefined> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, entry] of Object.entries(raw ?? {})) {
    if (entry && entry.value != null) out[key] = String(entry.value)
  }
  return out
}

/**
 * Put an address in a segment, creating the contact if it is new.
 *
 * An existing contact is added to the segment, and its `unsubscribed` flag
 * stays as it is (see the module comment).
 */
export async function addToList(input: ListSyncInput): Promise<ListSyncResult> {
  const email = input.email.trim().toLowerCase()
  if (!email) return { ok: false, error: 'empty email' }

  const resend = getResend()
  if (!resend) {
    console.warn(`[list] not configured (RESEND_API_KEY/EMAIL_FROM missing) — skipped ${input.segment} for ${email}`)
    return { ok: true, skipped: true, reason: 'email_not_configured' }
  }

  try {
    const segmentId = await resolveSegmentId(resend, input.segment)
    if (!segmentId) return { ok: false, error: `could not resolve segment ${input.segment}` }

    const found = await resend.contacts.get({ email })
    if (found.data) {
      // A failed segment add is logged, and the contact is still returned. The
      // contact and its unsubscribe flag are what the senders need, and a repeat
      // signup may meet a segment the contact already belongs to.
      const added = await resend.contacts.segments.add({ email, segmentId })
      if (added.error) console.warn('[list]', describe('contacts.segments.add', added.error))
      return {
        ok: true,
        created: false,
        contact: {
          id: found.data.id,
          email,
          unsubscribed: found.data.unsubscribed,
          properties: flattenProperties(found.data.properties),
        },
      }
    }
    const missing = found.error?.name === 'not_found' || found.error?.statusCode === 404
    if (found.error && !missing) {
      return { ok: false, error: describe('contacts.get', found.error) }
    }

    const firstName = input.firstName?.trim() || undefined
    const created = await resend.contacts.create({
      email,
      ...(firstName ? { firstName } : {}),
      segments: [{ id: segmentId }],
    })
    if (created.error || !created.data) {
      return { ok: false, error: describe('contacts.create', created.error) }
    }
    return {
      ok: true,
      created: true,
      contact: { id: created.data.id, email, unsubscribed: false, properties: {} },
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.error('[list] addToList threw', { email, segment: input.segment, reason })
    return { ok: false, error: reason }
  }
}

// ── Unsubscribe ─────────────────────────────────────────────────────────────

/**
 * Resend contact ids are random UUIDs, so the id itself is the unsubscribe
 * credential: only the mailbox that received it holds it. No signing secret
 * and no database column are needed.
 */
const CONTACT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isContactId(value: unknown): value is string {
  return typeof value === 'string' && CONTACT_ID_RE.test(value)
}

/** The page a reader lands on from the link in an email's footer. */
export function unsubscribePageUrl(contactId: string): string {
  return absoluteUrl(`/unsubscribe?c=${encodeURIComponent(contactId)}`)
}

/**
 * RFC 8058 one-click headers. Mail clients show their own unsubscribe button
 * and POST to the URL; the endpoint unsubscribes without asking again.
 */
export function listUnsubscribeHeaders(contactId: string): Record<string, string> {
  const oneClick = absoluteUrl(`/api/list/unsubscribe?c=${encodeURIComponent(contactId)}`)
  return {
    'List-Unsubscribe': `<${oneClick}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

export type UnsubscribeResult = { ok: true } | { ok: false; error: string }

/** Take a contact off every list. Idempotent: unsubscribing twice is fine. */
export async function unsubscribeContact(contactId: string): Promise<UnsubscribeResult> {
  if (!isContactId(contactId)) return { ok: false, error: 'invalid contact id' }
  const resend = getResend()
  if (!resend) return { ok: false, error: 'email_not_configured' }
  try {
    const res = await resend.contacts.update({ id: contactId, unsubscribed: true })
    if (res.error) return { ok: false, error: describe('contacts.update', res.error) }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Contact properties ──────────────────────────────────────────────────────

/**
 * Make sure a string contact property exists. Resend rejects writes to a
 * property that was never defined, so a job that records state on contacts
 * calls this once before it starts.
 */
export async function ensureStringProperty(key: string): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false
  try {
    const listed = await resend.contactProperties.list()
    if (listed.data?.data.some((property) => property.key === key)) return true
    const created = await resend.contactProperties.create({ key, type: 'string' })
    if (created.error) {
      console.error('[list]', describe(`contactProperties.create "${key}"`, created.error))
      return false
    }
    return true
  } catch (err) {
    console.error('[list] ensureStringProperty threw', err)
    return false
  }
}

/** Write one string property on a contact. Returns false on any failure. */
export async function setContactProperty(contactId: string, key: string, value: string): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false
  try {
    const res = await resend.contacts.update({ id: contactId, properties: { [key]: value } })
    if (res.error) {
      console.error('[list]', describe('contacts.update properties', res.error))
      return false
    }
    return true
  } catch (err) {
    console.error('[list] setContactProperty threw', err)
    return false
  }
}
