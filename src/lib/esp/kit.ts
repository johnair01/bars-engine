/**
 * Kit (formerly ConvertKit) v4 client — the one place this project talks to an ESP.
 *
 * Design mirrors `src/lib/email/send.ts` (persist-then-send): this NEVER throws
 * and never rejects. Callers save their own record first, then call
 * `syncSubscriber` and tolerate a non-ok result. A flaky provider must not 500
 * a quiz submission or lose the lead — the lead is already in our database, and
 * the ESP is a copy.
 *
 * Not configured is a normal state, not an error. Local, preview and CI all run
 * without `KIT_API_KEY` and get `{ ok: true, skipped: true }`.
 *
 * Who is allowed into a sequence is decided by `list-contract.ts`, not here.
 */
import {
  crossQuizTags,
  decideSequenceTags,
  type SequenceDecision,
} from './list-contract'

const KIT_API_BASE = 'https://api.kit.com/v4'
const TIMEOUT_MS = 8_000

export type KitSyncInput = {
  email: string
  firstName?: string | null
  /** Data tags for this event. Sequence triggers are filtered by the contract. */
  tags: readonly string[]
  /** Kit custom fields, keyed by field label. Missing fields are created. */
  fields?: Record<string, string>
}

export type KitSyncResult =
  | {
      ok: true
      skipped?: false
      subscriberId: number
      created: boolean
      tagsApplied: string[]
      withheld: SequenceDecision['withheld']
    }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string }

function getApiKey(): string | null {
  const key = process.env.KIT_API_KEY?.trim()
  return key ? key : null
}

async function kitFetch(
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown },
  apiKey: string,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${KIT_API_BASE}${path}`, {
      method: init.method,
      headers: {
        'X-Kit-Api-Key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body == null ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
      cache: 'no-store',
    })
    const text = await res.text()
    const data = text ? safeJson(text) : null
    if (!res.ok) {
      return { ok: false, error: `kit ${init.method} ${path} -> ${res.status} ${text.slice(0, 300)}` }
    }
    return { ok: true, data }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `kit ${init.method} ${path} -> ${reason}` }
  } finally {
    clearTimeout(timer)
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * Tag name → id, resolved once per process. Kit's tag list is small and stable,
 * and every quiz submission would otherwise pay for the same lookup.
 */
let tagCache: Map<string, number> | null = null

async function loadTags(apiKey: string): Promise<Map<string, number>> {
  if (tagCache) return tagCache
  const cache = new Map<string, number>()
  const res = await kitFetch('/tags?per_page=500', { method: 'GET' }, apiKey)
  if (res.ok) {
    const tags = (res.data as { tags?: { id: number; name: string }[] } | null)?.tags ?? []
    for (const tag of tags) cache.set(tag.name, tag.id)
  }
  tagCache = cache
  return cache
}

/** Exposed so a long-lived process can pick up tags created in the Kit UI. */
export function clearKitTagCache(): void {
  tagCache = null
}

async function resolveTagId(name: string, apiKey: string): Promise<number | null> {
  const cache = await loadTags(apiKey)
  const cached = cache.get(name)
  if (cached != null) return cached

  const created = await kitFetch('/tags', { method: 'POST', body: { name } }, apiKey)
  if (!created.ok) {
    // A concurrent submission may have created it between our read and write.
    clearKitTagCache()
    const refreshed = await loadTags(apiKey)
    return refreshed.get(name) ?? null
  }
  const tag = (created.data as { tag?: { id: number; name: string } } | null)?.tag
  if (!tag) return null
  cache.set(tag.name, tag.id)
  return tag.id
}

type ExistingSubscriber = { id: number; tags: string[] } | null

async function findSubscriber(email: string, apiKey: string): Promise<ExistingSubscriber> {
  const res = await kitFetch(
    `/subscribers?email_address=${encodeURIComponent(email)}`,
    { method: 'GET' },
    apiKey,
  )
  if (!res.ok) return null
  const subscribers =
    (res.data as { subscribers?: { id: number; email_address: string }[] } | null)?.subscribers ?? []
  const match = subscribers.find((s) => s.email_address?.toLowerCase() === email)
  if (!match) return null

  const tagsRes = await kitFetch(`/subscribers/${match.id}/tags?per_page=500`, { method: 'GET' }, apiKey)
  const tags = tagsRes.ok
    ? ((tagsRes.data as { tags?: { name: string }[] } | null)?.tags ?? []).map((t) => t.name)
    : []
  return { id: match.id, tags }
}

/**
 * Create or update a subscriber and apply its tags.
 *
 * Retaking a quiz updates the fields and adds the new data tags. It does not
 * duplicate the subscriber and does not re-trigger a sequence — see
 * `decideSequenceTags`.
 */
export async function syncSubscriber(input: KitSyncInput): Promise<KitSyncResult> {
  const apiKey = getApiKey()
  const email = input.email.trim().toLowerCase()
  if (!email) return { ok: false, error: 'empty email' }

  if (!apiKey) {
    console.warn(`[kit] not configured (KIT_API_KEY missing) — skipped sync for ${email}`)
    return { ok: true, skipped: true, reason: 'kit_not_configured' }
  }

  try {
    const existing = await findSubscriber(email, apiKey)

    // Cross-quiz marker needs to know what they already carry.
    const desiredTags = [
      ...input.tags,
      ...crossQuizTags({ desiredTags: input.tags, existingTags: existing?.tags ?? [] }),
    ]

    const decision = decideSequenceTags({
      desiredTags,
      existingTags: existing?.tags ?? [],
      isNewSubscriber: !existing,
    })

    const upsert = await kitFetch(
      '/subscribers',
      {
        method: 'POST',
        body: {
          email_address: email,
          ...(input.firstName ? { first_name: input.firstName } : {}),
          ...(input.fields && Object.keys(input.fields).length ? { fields: input.fields } : {}),
        },
      },
      apiKey,
    )
    if (!upsert.ok) return { ok: false, error: upsert.error }

    const subscriberId =
      (upsert.data as { subscriber?: { id: number } } | null)?.subscriber?.id ?? existing?.id
    if (subscriberId == null) return { ok: false, error: 'kit upsert returned no subscriber id' }

    const applied: string[] = []
    for (const name of dedupe(decision.tags)) {
      if (existing?.tags.includes(name)) continue
      const tagId = await resolveTagId(name, apiKey)
      if (tagId == null) continue
      const tagged = await kitFetch(
        `/tags/${tagId}/subscribers/${subscriberId}`,
        { method: 'POST' },
        apiKey,
      )
      if (tagged.ok) applied.push(name)
    }

    if (decision.withheld.length) {
      console.info(
        `[kit] withheld ${decision.withheld.map((w) => `${w.tag}(${w.reason})`).join(', ')} for ${email}`,
      )
    }

    return {
      ok: true,
      subscriberId,
      created: !existing,
      tagsApplied: applied,
      withheld: decision.withheld,
    }
  } catch (err) {
    // Belt and braces: this function is on the quiz submit path and must not throw.
    const reason = err instanceof Error ? err.message : String(err)
    console.error('[kit] sync failed', reason)
    return { ok: false, error: reason }
  }
}

function dedupe(values: readonly string[]): string[] {
  return Array.from(new Set(values))
}
