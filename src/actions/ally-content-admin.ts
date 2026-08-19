'use server'

/**
 * Admin editing for ally-campaign prose.
 *
 * Follows `src/actions/launch-page-admin.ts`: admin-gated, persisted into
 * `AppConfig.theme` under one namespaced key (no migration), audit-logged, and
 * revalidating the affected paths on save.
 *
 * Two deliberate behaviours:
 *
 *  - **Empty means "restore the default."** A cleared textarea drops the override
 *    rather than storing `""`, so an admin cannot publish a blank letter by
 *    deleting text. `resetAllyContent` does the same thing wholesale.
 *  - **Merge, never replace.** A save touching one invite must not discard edits
 *    to another, so the incoming patch is merged over the stored object rather
 *    than overwriting it.
 */

import { z } from 'zod'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  ALLY_CONTENT_KEY,
  checkInviteSlug,
  checkOverrides,
  normalizeOverrides,
  parseAllyContentTheme,
  type AllyContentOverrides,
} from '@/lib/ally-campaign/content-overrides'
import { ALLIES } from '@/lib/ally-campaign/allies'

async function requireAdminId(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Authentication required')

  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
    select: { playerId: true },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

/** Long-form prose; generous but bounded so a paste accident can't fill the row. */
const prose = z.string().trim().max(20_000).optional()

/** The three content buckets, identical at global and per-invite scope. */
const layerSchema = z.object({
  myths: z.record(z.string(), z.object({
    myth: prose,
    truth: prose,
    reframe: prose,
  })).optional(),
  understanding: z.record(z.string(), z.object({
    kicker: z.string().trim().max(200).optional(),
    heading: z.string().trim().max(400).optional(),
    body: prose,
  })).optional(),
  workstreams: z.record(z.string(), z.object({
    title: z.string().trim().max(200).optional(),
    emergentProblem: prose,
    narrative: prose,
    theAsk: prose,
  })).optional(),
})

const patchSchema = z.object({
  invites: z.record(z.string(), z.object({
    displayName: z.string().trim().max(160).optional(),
    eyebrow: z.string().trim().max(200).optional(),
    opening: prose,
    closing: prose,
    /** This ally's own copy, layered over the global layer. */
    content: layerSchema.optional(),
  })).optional(),
  myths: z.record(z.string(), z.object({
    myth: prose,
    truth: prose,
    reframe: prose,
  })).optional(),
  understanding: z.record(z.string(), z.object({
    kicker: z.string().trim().max(200).optional(),
    heading: z.string().trim().max(400).optional(),
    body: prose,
  })).optional(),
  workstreams: z.record(z.string(), z.object({
    title: z.string().trim().max(200).optional(),
    emergentProblem: prose,
    narrative: prose,
    theAsk: prose,
  })).optional(),
})

export type SaveAllyContentResult = { ok: true } | { ok: false; error: string }

/** One override bucket: entity key → field → text. */
type Bucket = Record<string, Record<string, string | undefined>>

type InviteBucket = Record<string, Record<string, unknown>>

/**
 * Merge the invites bucket, which is the one bucket that is not flat: alongside
 * its string fields it carries a nested per-invite `content` layer. String
 * fields follow the usual empty-clears rule; `content` merges bucket by bucket
 * so editing one ally's workstream copy cannot drop their myth copy.
 */
function mergeInvites(
  current: InviteBucket | undefined,
  patch: InviteBucket | undefined,
): InviteBucket | undefined {
  if (!patch) return current
  const out: InviteBucket = { ...(current ?? {}) }

  for (const [slug, incoming] of Object.entries(patch)) {
    const existing = { ...(out[slug] ?? {}) }
    const { content: incomingContent, ...flat } = incoming
    const merged = mergeBucket(
      { one: existing as Record<string, string | undefined> },
      { one: flat as Record<string, string | undefined> },
    )?.one ?? {}

    const nextInvite: Record<string, unknown> = { ...merged }

    const currentContent = (existing.content ?? {}) as Record<string, Bucket | undefined>
    if (incomingContent && typeof incomingContent === 'object') {
      const patchContent = incomingContent as Record<string, Bucket | undefined>
      const nextContent: Record<string, Bucket> = {}
      for (const bucket of ['myths', 'understanding', 'workstreams']) {
        const m = mergeBucket(currentContent[bucket], patchContent[bucket])
        if (m) nextContent[bucket] = m
      }
      if (Object.keys(nextContent).length > 0) nextInvite.content = nextContent
    } else if (Object.keys(currentContent).length > 0) {
      nextInvite.content = currentContent
    }

    if (Object.keys(nextInvite).length > 0) out[slug] = nextInvite
    else delete out[slug]
  }

  return Object.keys(out).length > 0 ? out : undefined
}

/** Deep-merge one bucket, dropping keys whose value is now empty. */
function mergeBucket(current: Bucket | undefined, patch: Bucket | undefined): Bucket | undefined {
  if (!patch) return current
  const out: Bucket = { ...(current ?? {}) }

  for (const [key, fields] of Object.entries(patch)) {
    const merged: Record<string, string | undefined> = { ...(out[key] ?? {}) }
    for (const [field, value] of Object.entries(fields)) {
      const trimmed = typeof value === 'string' ? value.trim() : ''
      // Empty clears the override so the authored default takes over again.
      if (trimmed) merged[field] = trimmed
      else delete merged[field]
    }
    if (Object.keys(merged).length > 0) out[key] = merged
    else delete out[key]
  }

  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Apply a sparse patch of prose overrides. Only the fields present in `raw` are
 * touched; everything else keeps whatever it already had.
 */
export async function saveAllyContent(raw: unknown): Promise<SaveAllyContentResult> {
  let adminId: string
  try {
    adminId = await requireAdminId()
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Admin access required' }
  }

  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid content.' }
  }
  const patch = parsed.data

  // The invariant, reported rather than silently applied. `normalizeOverrides`
  // will drop a hard-coded figure regardless — but an admin whose paragraph
  // half-saved with no explanation would reasonably conclude the editor is
  // broken. Refuse the whole save and name the one fix.
  const rejections = checkOverrides(patch)
  if (rejections.length > 0) {
    const first = rejections[0]
    const more = rejections.length > 1 ? ` (+${rejections.length - 1} more)` : ''
    return { ok: false, error: `${first.bucket} · ${first.key} · ${first.field}: ${first.message}${more}` }
  }

  try {
    const existing = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })

    let theme: Record<string, unknown> = {}
    try {
      theme = existing?.theme ? (JSON.parse(existing.theme) as Record<string, unknown>) : {}
    } catch {
      theme = {}
    }

    const current = parseAllyContentTheme(existing?.theme)
    const next: AllyContentOverrides = normalizeOverrides({
      invites: mergeInvites(current.invites as InviteBucket | undefined, patch.invites as InviteBucket | undefined),
      myths: mergeBucket(current.myths, patch.myths),
      understanding: mergeBucket(current.understanding, patch.understanding),
      workstreams: mergeBucket(current.workstreams, patch.workstreams),
    })

    const nextTheme = JSON.stringify({ ...theme, [ALLY_CONTENT_KEY]: next })

    await db.appConfig.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', theme: nextTheme, updatedBy: adminId },
      update: { theme: nextTheme, updatedBy: adminId },
    })

    await db.adminAuditLog.create({
      data: {
        adminId,
        action: 'config_update',
        target: 'ally_campaign_content',
        payload: JSON.stringify({
          buckets: Object.keys(patch),
          invites: Object.keys(patch.invites ?? {}),
        }),
      },
    })

    revalidatePath('/ally/[slug]', 'page')
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not save the content.',
    }
  }
}

// ── Creating and deleting invites ───────────────────────────────────────────

const createSchema = z.object({
  slug: z.string().trim().min(1).max(40),
  displayName: z.string().trim().min(1).max(160),
  eyebrow: z.string().trim().max(200).optional(),
  opening: z.string().trim().min(1).max(20_000),
  closing: z.string().trim().max(20_000).optional(),
  cohort: z.enum(['family', 'friends', 'colleagues', 'public']).optional(),
})

export type CreateInviteResult =
  | { ok: true; slug: string; href: string }
  | { ok: false; error: string }

/**
 * Create a brand-new invite — the last thing that used to require a code change.
 *
 * A created invite is just an override entry under a slug with no counterpart in
 * `allies.ts`; `DEFAULT_INVITE` supplies anything left blank. `/ally/<slug>` is
 * dynamic, so the page exists the moment this returns — no deploy, no rebuild.
 */
export async function createAllyInvite(raw: unknown): Promise<CreateInviteResult> {
  let adminId: string
  try {
    adminId = await requireAdminId()
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Admin access required' }
  }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid invite.' }
  }
  const input = parsed.data

  // Same rules the form shows — reserved routes, bad characters, existing slugs.
  const check = checkInviteSlug(input.slug)
  if (!check.ok) return { ok: false, error: check.error }
  const slug = check.slug

  try {
    const existing = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })

    let theme: Record<string, unknown> = {}
    try {
      theme = existing?.theme ? (JSON.parse(existing.theme) as Record<string, unknown>) : {}
    } catch {
      theme = {}
    }

    const current = parseAllyContentTheme(existing?.theme)
    if (current.invites?.[slug]) {
      return { ok: false, error: `“${slug}” already exists. Open it to edit instead.` }
    }

    const next = normalizeOverrides({
      ...current,
      invites: {
        ...(current.invites ?? {}),
        [slug]: {
          displayName: input.displayName,
          eyebrow: input.eyebrow,
          opening: input.opening,
          closing: input.closing,
          cohort: input.cohort,
        },
      },
    })

    const nextTheme = JSON.stringify({ ...theme, [ALLY_CONTENT_KEY]: next })

    await db.appConfig.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', theme: nextTheme, updatedBy: adminId },
      update: { theme: nextTheme, updatedBy: adminId },
    })

    await db.adminAuditLog.create({
      data: {
        adminId,
        action: 'config_update',
        target: 'ally_campaign_content',
        payload: JSON.stringify({ createdInvite: slug }),
      },
    })

    revalidatePath('/ally/[slug]', 'page')
    return { ok: true, slug, href: `/ally/${slug}` }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not create the invite.',
    }
  }
}

/**
 * Delete a CREATED invite outright. Authored invites cannot be deleted here —
 * they live in code, and the destructive-looking action for those is
 * `resetAllyInvite`, which only clears edits.
 *
 * Deleting does not touch any `CampaignLead` already captured through the link;
 * those rows record `channel: 'ally:<slug>'` and stay on the steward board. The
 * link simply stops resolving to a personal letter and falls back to the generic
 * invite.
 */
export async function deleteAllyInvite(slug: string): Promise<SaveAllyContentResult> {
  let adminId: string
  try {
    adminId = await requireAdminId()
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Admin access required' }
  }

  const key = String(slug ?? '').trim().toLowerCase()
  if (!key) return { ok: false, error: 'No invite named.' }
  if (ALLIES[key]) {
    return { ok: false, error: `“${key}” is defined in code — use “Restore the original” instead.` }
  }

  try {
    const existing = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })

    let theme: Record<string, unknown> = {}
    try {
      theme = existing?.theme ? (JSON.parse(existing.theme) as Record<string, unknown>) : {}
    } catch {
      theme = {}
    }

    const current = parseAllyContentTheme(existing?.theme)
    if (!current.invites?.[key]) return { ok: false, error: 'That invite no longer exists.' }

    const invites = { ...current.invites }
    delete invites[key]

    const next = normalizeOverrides({ ...current, invites })
    const nextTheme = JSON.stringify({ ...theme, [ALLY_CONTENT_KEY]: next })

    await db.appConfig.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', theme: nextTheme, updatedBy: adminId },
      update: { theme: nextTheme, updatedBy: adminId },
    })

    await db.adminAuditLog.create({
      data: {
        adminId,
        action: 'config_update',
        target: 'ally_campaign_content',
        payload: JSON.stringify({ deletedInvite: key }),
      },
    })

    revalidatePath('/ally/[slug]', 'page')
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not delete the invite.',
    }
  }
}

/**
 * Drop every override for one invite, restoring the authored letter.
 * The undo for "I edited this and made it worse."
 */
export async function resetAllyInvite(slug: string): Promise<SaveAllyContentResult> {
  let adminId: string
  try {
    adminId = await requireAdminId()
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Admin access required' }
  }

  try {
    const existing = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })

    let theme: Record<string, unknown> = {}
    try {
      theme = existing?.theme ? (JSON.parse(existing.theme) as Record<string, unknown>) : {}
    } catch {
      theme = {}
    }

    const current = parseAllyContentTheme(existing?.theme)
    const invites = { ...(current.invites ?? {}) }
    delete invites[slug]

    const next = normalizeOverrides({ ...current, invites })
    const nextTheme = JSON.stringify({ ...theme, [ALLY_CONTENT_KEY]: next })

    await db.appConfig.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', theme: nextTheme, updatedBy: adminId },
      update: { theme: nextTheme, updatedBy: adminId },
    })

    await db.adminAuditLog.create({
      data: {
        adminId,
        action: 'config_update',
        target: 'ally_campaign_content',
        payload: JSON.stringify({ reset: slug }),
      },
    })

    revalidatePath('/ally/[slug]', 'page')
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not reset the letter.',
    }
  }
}
