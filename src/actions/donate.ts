'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { mintVibulon } from '@/actions/economy'
import { revalidatePath } from 'next/cache'

/**
 * Claim support token: logged-in user declares support for the instance
 * and receives 1 vibeulon (Energy) as a thank-you.
 * One claim per player per instance.
 */
export async function claimSupportToken(instanceId: string): Promise<{ error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Sign in to claim your support token' }

  const existing = await db.donation.findFirst({
    where: {
      instanceId,
      playerId: player.id,
      provider: 'support_token',
    },
  })
  if (existing) return { error: 'You have already claimed your support token for this cause' }

  await db.$transaction(async (tx) => {
    await tx.donation.create({
      data: {
        instanceId,
        playerId: player.id,
        amountCents: 0,
        provider: 'support_token',
        note: 'Support token claim',
      },
    })
  })

  await mintVibulon(player.id, 1, {
    source: 'donation',
    id: instanceId,
    title: 'Support the Residency',
  })

  revalidatePath('/event')
  revalidatePath('/')
  revalidatePath('/wallet')
  return {}
}

/**
 * Check if the player has already claimed a support token for this instance.
 */
export async function hasClaimedSupportToken(instanceId: string): Promise<boolean> {
  const player = await getCurrentPlayer()
  if (!player) return false

  const existing = await db.donation.findFirst({
    where: {
      instanceId,
      playerId: player.id,
      provider: 'support_token',
    },
  })
  return !!existing
}
