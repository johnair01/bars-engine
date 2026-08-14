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
  normalizeOverrides,
  parseAllyContentTheme,
  type AllyContentOverrides,
} from '@/lib/ally-campaign/content-overrides'

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

const patchSchema = z.object({
  invites: z.record(z.string(), z.object({
    displayName: z.string().trim().max(160).optional(),
    eyebrow: z.string().trim().max(200).optional(),
    opening: prose,
    closing: prose,
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
      invites: mergeBucket(current.invites, patch.invites),
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
