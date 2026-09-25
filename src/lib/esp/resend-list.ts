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
 * Who belongs on which list is decided by `list-contract.ts`, not here.
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
import { LIST_TERMS, MAILING_LIST_SEGMENT, type ListName } from './list-contract'

export type ListSyncInput = {
  email: string
  firstName?: string | null
  list: ListName
}

/**
 * The topics this code has opted a contact into, comma-separated, kept on the
 * contact itself. Resend's topic listing cannot tell a reader who left a topic
 * from one who never joined it, so this record is what lets a repeat signup
 * leave a reader's own opt-out alone.
 */
export const TOPICS_JOINED_PROPERTY = 'list_topics_joined'

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

// ── The segment and topic ids, resolved once per process ────────────────────

let segmentId: string | null = null
let topicCache: Map<string, string> | null = null
let joinedPropertyReady = false

/** Exposed for tests, and for a long-lived process that renames things. */
export function clearListCaches(): void {
  segmentId = null
  topicCache = null
  joinedPropertyReady = false
}

/** The mailing-list segment's id, creating the segment the first time. */
async function resolveMailingListSegment(resend: Resend): Promise<string | null> {
  if (segmentId) return segmentId
  let after: string | undefined
  for (let page = 0; page < 10; page++) {
    const res = await resend.segments.list(after ? { limit: 100, after } : { limit: 100 })
    if (res.error || !res.data) break
    const found = res.data.data.find((segment) => segment.name === MAILING_LIST_SEGMENT)
    if (found) return (segmentId = found.id)
    if (!res.data.has_more || res.data.data.length === 0) break
    after = res.data.data[res.data.data.length - 1].id
  }
  const created = await resend.segments.create({ name: MAILING_LIST_SEGMENT })
  if (created.error || !created.data) {
    console.error('[list]', describe(`segments.create "${MAILING_LIST_SEGMENT}"`, created.error))
    return null
  }
  return (segmentId = created.data.id)
}

/** A topic's id, creating it with opt-out as the default the first time. */
async function resolveTopicId(resend: Resend, name: string): Promise<string | null> {
  if (!topicCache) {
    const listed = await resend.topics.list()
    topicCache = new Map((listed.data?.data ?? []).map((topic) => [topic.name, topic.id]))
  }
  const cached = topicCache.get(name)
  if (cached) return cached
  const created = await resend.topics.create({ name, defaultSubscription: 'opt_out' })
  if (created.error || !created.data) {
    console.error('[list]', describe(`topics.create "${name}"`, created.error))
    return null
  }
  topicCache.set(name, created.data.id)
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
 * Put an address on a list, creating the contact if it is new.
 *
 * For a list with a topic, the contact joins the mailing-list segment and is
 * opted into that topic once. For the reminder-only character sheet, the
 * contact exists and joins nothing, so no Broadcast can reach it.
 *
 * An existing contact's `unsubscribed` flag stays as it is (see the module
 * comment), and so does a topic it has already been through once: a reader
 * who left a topic is not put back in by a repeat signup.
 */
export async function addToList(input: ListSyncInput): Promise<ListSyncResult> {
  const email = input.email.trim().toLowerCase()
  if (!email) return { ok: false, error: 'empty email' }

  const resend = getResend()
  if (!resend) {
    console.warn(`[list] not configured (RESEND_API_KEY/EMAIL_FROM missing) — skipped ${input.list} for ${email}`)
    return { ok: true, skipped: true, reason: 'email_not_configured' }
  }

  const topicName = LIST_TERMS[input.list].topic

  try {
    let listSegmentId: string | null = null
    let topicId: string | null = null
    if (topicName) {
      listSegmentId = await resolveMailingListSegment(resend)
      if (!listSegmentId) return { ok: false, error: `could not resolve segment "${MAILING_LIST_SEGMENT}"` }
      topicId = await resolveTopicId(resend, topicName)
      if (!topicId) return { ok: false, error: `could not resolve topic "${topicName}"` }
      if (!joinedPropertyReady) {
        joinedPropertyReady = await ensureStringProperty(TOPICS_JOINED_PROPERTY)
        if (!joinedPropertyReady) return { ok: false, error: `could not create property ${TOPICS_JOINED_PROPERTY}` }
      }
    }

    const found = await resend.contacts.get({ email })
    const missing = found.error?.name === 'not_found' || found.error?.statusCode === 404
    if (found.error && !missing) {
      return { ok: false, error: describe('contacts.get', found.error) }
    }

    if (found.data) {
      const contact: ListContact = {
        id: found.data.id,
        email,
        unsubscribed: found.data.unsubscribed,
        properties: flattenProperties(found.data.properties),
      }
      if (listSegmentId && topicId && topicName) {
        // A failed segment add is logged and the contact is still returned: a
        // repeat signup may meet a segment the contact already belongs to.
        const added = await resend.contacts.segments.add({ email, segmentId: listSegmentId })
        if (added.error) console.warn('[list]', describe('contacts.segments.add', added.error))

        const joined = (contact.properties[TOPICS_JOINED_PROPERTY] ?? '').split(',').filter(Boolean)
        if (!joined.includes(topicName)) {
          const opted = await resend.contacts.topics.update({ email, topics: [{ id: topicId, subscription: 'opt_in' }] })
          if (opted.error) return { ok: false, error: describe('contacts.topics.update', opted.error) }
          const record = [...joined, topicName].join(',')
          const stamped = await resend.contacts.update({ email, properties: { [TOPICS_JOINED_PROPERTY]: record } })
          if (stamped.error) console.warn('[list]', describe('contacts.update properties', stamped.error))
          contact.properties[TOPICS_JOINED_PROPERTY] = record
        }
      }
      return { ok: true, created: false, contact }
    }

    const firstName = input.firstName?.trim() || undefined
    const created = await resend.contacts.create({
      email,
      ...(firstName ? { firstName } : {}),
      ...(listSegmentId && topicId && topicName
        ? {
            segments: [{ id: listSegmentId }],
            topics: [{ id: topicId, subscription: 'opt_in' as const }],
            properties: { [TOPICS_JOINED_PROPERTY]: topicName },
          }
        : {}),
    })
    if (created.error || !created.data) {
      return { ok: false, error: describe('contacts.create', created.error) }
    }
    return {
      ok: true,
      created: true,
      contact: {
        id: created.data.id,
        email,
        unsubscribed: false,
        properties: topicName ? { [TOPICS_JOINED_PROPERTY]: topicName } : {},
      },
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.error('[list] addToList threw', { email, list: input.list, reason })
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
