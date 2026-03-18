'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

export type AcceptGoldenPathResult =
  | { success: true; redirectTo: string }
  | { error: string }

/**
 * Accept a golden path invitation.
 * Validates invite, ensures InstanceMembership when instanceId present,
 * increments uses, and returns redirect URL.
 */
export async function acceptGoldenPathInvitation(
  inviteId: string,
  playerId?: string
): Promise<AcceptGoldenPathResult> {
  const effectivePlayerId = playerId ?? (await getCurrentPlayer())?.id
  if (!effectivePlayerId) {
    return { error: 'Authentication required' }
  }

  const invite = await db.invite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      token: true,
      status: true,
      uses: true,
      maxUses: true,
      instanceId: true,
      instance: { select: { slug: true } },
    },
  })

  if (!invite) {
    return { error: 'Invitation not found' }
  }
  if (invite.status !== 'active') {
    return { error: 'Invitation is no longer active' }
  }
  if (invite.uses >= invite.maxUses) {
    return { error: 'Invitation has reached maximum uses' }
  }

  const now = new Date()
  const newUses = invite.uses + 1
  const usedAt = newUses >= invite.maxUses ? now : null

  await db.$transaction(async (tx) => {
    await tx.invite.update({
      where: { id: inviteId },
      data: { uses: newUses, usedAt },
    })

    if (invite.instanceId) {
      await tx.instanceMembership.upsert({
        where: {
          instanceId_playerId: {
            instanceId: invite.instanceId,
            playerId: effectivePlayerId,
          },
        },
        create: {
          instanceId: invite.instanceId,
          playerId: effectivePlayerId,
          roleKey: null,
        },
        update: {},
      })
    }
  })

  revalidatePath('/', 'layout')

  const basePath = invite.instance?.slug
    ? `/campaigns/landing/${invite.instance.slug}`
    : '/'
  const redirectTo =
    basePath !== '/' && invite.token
      ? `${basePath}?invite=${encodeURIComponent(invite.token)}`
      : basePath

  return { success: true, redirectTo }
}
