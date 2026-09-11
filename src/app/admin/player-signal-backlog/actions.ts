'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { extractComplaintText, displayTitleForRow } from '@/lib/feedback/feedback-title'

const ALLOWED = new Set(['new', 'triaged', 'in_progress', 'done', 'wontfix'])

const PLAYER_SIGNAL_SOURCES = ['share_your_signal', 'site_signal_nav', 'certification'] as const

const PAGE_PATH = '/admin/player-signal-backlog'

async function requireAdmin(): Promise<{ id: string } | null> {
  const player = await getCurrentPlayer()
  if (!player) return null

  const withRoles = await db.player.findUnique({
    where: { id: player.id },
    include: { roles: { include: { role: true } } },
  })
  const isAdmin = withRoles?.roles.some((r) => r.role.key === 'admin')
  return isAdmin ? { id: player.id } : null
}

export async function updatePlayerSignalBacklogStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const id = String(formData.get('id') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  if (!id || !ALLOWED.has(status)) return

  const updated = await db.backlogItem.updateMany({
    where: { id, source: { in: [...PLAYER_SIGNAL_SOURCES] } },
    data: { status },
  })
  if (updated.count === 0) return

  revalidatePath(PAGE_PATH)
}

/**
 * Sets one status across every checked row. Triage of 77 rows one form at a time
 * is why none of them were ever triaged.
 */
export async function bulkUpdatePlayerSignalStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const status = String(formData.get('status') ?? '').trim()
  if (!ALLOWED.has(status)) return

  const ids = formData
    .getAll('ids')
    .map((v) => String(v).trim())
    .filter(Boolean)
  if (ids.length === 0) return

  await db.backlogItem.updateMany({
    where: { id: { in: ids }, source: { in: [...PLAYER_SIGNAL_SOURCES] } },
    data: { status },
  })

  revalidatePath(PAGE_PATH)
}

function mergeContext(existing: string | null, patch: Record<string, unknown>): string {
  let base: Record<string, unknown> = {}
  if (existing) {
    try {
      const parsed = JSON.parse(existing)
      if (parsed && typeof parsed === 'object') base = parsed as Record<string, unknown>
    } catch {
      base = { raw: existing }
    }
  }
  return JSON.stringify({ ...base, ...patch })
}

/**
 * Turns a signal into actual work: spawns a private system BAR carrying the
 * complaint and the page it came from, then marks the signal `triaged`.
 *
 * The BAR description is built from the extracted complaint — never the raw
 * stored description, which carries the submitter's playerId in its footer.
 */
export async function promoteSignalToBar(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  if (!admin) return

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const row = await db.backlogItem.findFirst({
    where: { id, source: { in: [...PLAYER_SIGNAL_SOURCES] } },
  })
  if (!row) return

  // Already promoted — don't spawn a duplicate BAR on a double submit.
  if (row.contextJson?.includes('"promotedBarId"')) return

  let pageUrl: string | null = null
  let imageUrl: string | null = null
  if (row.contextJson) {
    try {
      const ctx = JSON.parse(row.contextJson) as Record<string, unknown>
      if (typeof ctx.pageUrl === 'string') pageUrl = ctx.pageUrl
      if (typeof ctx.imageUrl === 'string') imageUrl = ctx.imageUrl
    } catch {
      // Context is best-effort; a malformed blob shouldn't block promotion.
    }
  }

  const complaint = extractComplaintText(row.description)
  const description = [
    complaint,
    '',
    '---',
    `Promoted from player signal (${row.source}).`,
    pageUrl ? `Page: ${pageUrl}` : null,
    imageUrl ? `Screenshot: ${imageUrl}` : null,
    `Signal id: ${row.id}`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  const bar = await db.customBar.create({
    data: {
      creatorId: admin.id,
      title: displayTitleForRow(row).slice(0, 200),
      description,
      type: 'vibe',
      moveType: 'cleanUp',
      visibility: 'private',
      isSystem: true,
      reward: 1,
    },
    select: { id: true },
  })

  await db.backlogItem.update({
    where: { id: row.id },
    data: {
      status: row.status === 'new' ? 'triaged' : row.status,
      contextJson: mergeContext(row.contextJson, { promotedBarId: bar.id }),
    },
  })

  revalidatePath(PAGE_PATH)
}
