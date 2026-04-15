'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createQuestFromWizard } from '@/actions/create-bar'

/**
 * Create a bounty: public quest with staked vibeulons.
 * Constraint: stakeAmount >= maxCompletions * rewardPerCompletion.
 * Spec: .specify/specs/offers-bounty-donation-packs/spec.md
 */
export async function createBountyAction(input: {
  barId: string
  stakeAmount: number
  maxCompletions: number
  rewardPerCompletion: number
}): Promise<{ success: true; barId: string } | { error: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return { error: 'Not logged in' }

  const { barId, stakeAmount, maxCompletions, rewardPerCompletion } = input

  if (stakeAmount < 1 || maxCompletions < 1 || rewardPerCompletion < 1) {
    return { error: 'Stake, max completions, and reward must be at least 1' }
  }
  if (stakeAmount < maxCompletions * rewardPerCompletion) {
    return { error: `Stake (${stakeAmount}) must be >= max completions (${maxCompletions}) × reward (${rewardPerCompletion}) = ${maxCompletions * rewardPerCompletion}` }
  }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true, visibility: true, questSource: true, stakedPool: true },
  })
  if (!bar) return { error: 'Quest not found' }
  if (bar.creatorId !== playerId) return { error: 'Not your quest' }
  if (bar.questSource === 'bounty' || (bar.stakedPool ?? 0) > 0) {
    return { error: 'Quest is already a bounty' }
  }
  if (bar.visibility !== 'public') return { error: 'Quest must be public to become a bounty' }

  const wallet = await db.vibulon.findMany({
    where: { ownerId: playerId },
    orderBy: { createdAt: 'asc' },
    take: stakeAmount,
  })
  if (wallet.length < stakeAmount) {
    return { error: `Insufficient balance. Need ${stakeAmount} vibeulons, have ${wallet.length}` }
  }

  await db.$transaction(async (tx) => {
    for (const v of wallet) {
      await tx.bountyStake.create({
        data: {
          barId,
          vibulonId: v.id,
          playerId,
        },
      })
    }
    await tx.customBar.update({
      where: { id: barId },
      data: {
        questSource: 'bounty',
        stakedPool: stakeAmount,
        maxAssignments: maxCompletions,
        reward: rewardPerCompletion,
      },
    })
  })

  revalidatePath('/')
  revalidatePath('/bars/available')
  revalidatePath('/hand')
  return { success: true, barId }
}
