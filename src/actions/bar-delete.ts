'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Delete a BAR. Creator or admin only.
 * Prisma handles cascades: BarShare, BarShareExternal, etc. cascade delete.
 * Invite.invitationBarId and CampaignInvitation.barId use onDelete: SetNull.
 */
export async function deleteBar(barId: string): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true },
  })

  if (!bar) return { error: 'BAR not found' }

  const isAdmin = player.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')
  const isCreator = bar.creatorId === player.id

  if (!isCreator && !isAdmin) {
    return { error: 'You can only delete BARs you created' }
  }

  try {
    await db.customBar.delete({
      where: { id: barId },
    })

    revalidatePath('/hand')
    revalidatePath('/bars')
    revalidatePath(`/bars/${barId}`)
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    console.error('[bar-delete]', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to delete BAR',
    }
  }
}
