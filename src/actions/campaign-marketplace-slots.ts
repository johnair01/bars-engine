'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { MARKETPLACE_BASE_SLOTS, vibeulonCostForNextSlot } from '@/lib/campaign-marketplace'
import { getOrCreateMarketplaceProfile } from '@/lib/campaign-marketplace-queries'

export type AttachArtifactToSlotResult = { success: true } | { error: string }

/**
 * Attach a BAR or quest (CustomBar) the player owns to an empty stall.
 */
export async function attachArtifactToMarketplaceSlot(input: {
  campaignRef: string
  slotIndex: number
  source: { type: 'bar' | 'quest'; id: string }
}): Promise<AttachArtifactToSlotResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const ref = input.campaignRef.trim() || 'bruised-banana'
  const profile = await getOrCreateMarketplaceProfile(player.id, ref)

  if (input.slotIndex < 0 || input.slotIndex >= profile.maxSlots) {
    return { error: 'Invalid stall index' }
  }

  const bar = await db.customBar.findUnique({
    where: { id: input.source.id },
    select: { id: true, creatorId: true, type: true },
  })
  if (!bar || bar.creatorId !== player.id) {
    return { error: 'You can only list your own BARs or quests' }
  }

  const existingListing = await db.marketplaceStallSlot.findFirst({
    where: { listedCustomBarId: bar.id },
  })
  if (existingListing) {
    return { error: 'This item is already listed in a stall' }
  }

  const occupied = await db.marketplaceStallSlot.findUnique({
    where: { profileId_slotIndex: { profileId: profile.id, slotIndex: input.slotIndex } },
  })
  if (occupied?.listedCustomBarId) {
    return { error: 'This stall is already filled' }
  }

  await db.$transaction(async (tx) => {
    await tx.marketplaceStallSlot.upsert({
      where: { profileId_slotIndex: { profileId: profile.id, slotIndex: input.slotIndex } },
      create: {
        profileId: profile.id,
        slotIndex: input.slotIndex,
        listedCustomBarId: bar.id,
      },
      update: { listedCustomBarId: bar.id },
    })
  })

  revalidatePath('/campaign/marketplace')
  revalidatePath('/hand')
  return { success: true }
}

export type PurchaseSlotResult = { success: true; newMaxSlots: number } | { error: string }

export async function purchaseAdditionalMarketplaceSlot(campaignRef: string): Promise<PurchaseSlotResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const ref = campaignRef.trim() || 'bruised-banana'
  const profile = await getOrCreateMarketplaceProfile(player.id, ref)
  const cost = vibeulonCostForNextSlot(profile.paidExtensions)

  const wallet = await db.vibulon.findMany({
    where: { ownerId: player.id },
    orderBy: { createdAt: 'asc' },
    take: cost,
  })
  if (wallet.length < cost) {
    return { error: `Need ${cost} vibeulons to unlock the next stall (you have ${wallet.length}).` }
  }

  const newPaid = profile.paidExtensions + 1
  const newMax = MARKETPLACE_BASE_SLOTS + newPaid

  await db.$transaction(async (tx) => {
    const tokenIds = wallet.map((t) => t.id)
    await tx.vibulon.deleteMany({ where: { id: { in: tokenIds } } })
    await tx.vibulonEvent.create({
      data: {
        playerId: player.id,
        source: 'marketplace_slot',
        amount: -cost,
        notes: `Unlocked marketplace stall ${newMax} for ${ref}`,
      },
    })
    await tx.playerMarketplaceProfile.update({
      where: { id: profile.id },
      data: { paidExtensions: newPaid, maxSlots: newMax },
    })
  })

  revalidatePath('/campaign/marketplace')
  revalidatePath('/')
  return { success: true, newMaxSlots: newMax }
}

export type ClearSlotResult = { success: true } | { error: string }

export async function clearMarketplaceSlot(campaignRef: string, slotIndex: number): Promise<ClearSlotResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const ref = campaignRef.trim() || 'bruised-banana'
  const profile = await db.playerMarketplaceProfile.findUnique({
    where: { playerId_campaignRef: { playerId: player.id, campaignRef: ref } },
  })
  if (!profile) return { error: 'No marketplace profile' }

  await db.marketplaceStallSlot.updateMany({
    where: { profileId: profile.id, slotIndex },
    data: { listedCustomBarId: null },
  })

  revalidatePath('/campaign/marketplace')
  return { success: true }
}
