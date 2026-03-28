'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'

const ALLOWED = new Set(['new', 'triaged', 'in_progress', 'done', 'wontfix'])

const PLAYER_SIGNAL_SOURCES = ['share_your_signal', 'site_signal_nav', 'certification'] as const

export async function updatePlayerSignalBacklogStatus(formData: FormData): Promise<void> {
  const player = await getCurrentPlayer()
  if (!player) return

  const withRoles = await db.player.findUnique({
    where: { id: player.id },
    include: { roles: { include: { role: true } } },
  })
  const isAdmin = withRoles?.roles.some((r) => r.role.key === 'admin')
  if (!isAdmin) return

  const id = String(formData.get('id') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  if (!id || !ALLOWED.has(status)) return

  const updated = await db.backlogItem.updateMany({
    where: { id, source: { in: [...PLAYER_SIGNAL_SOURCES] } },
    data: { status },
  })
  if (updated.count === 0) return

  revalidatePath('/admin/player-signal-backlog')
}
