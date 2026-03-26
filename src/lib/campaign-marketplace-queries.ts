import { db } from '@/lib/db'
import { MARKETPLACE_BASE_SLOTS } from '@/lib/campaign-marketplace'

export type MarketplaceSlotRow = {
  slotIndex: number
  status: 'empty' | 'listed'
  listingQuestId: string | null
  listingBarId: string | null
  title: string | null
  campaignId: string
}

export type ListPlayerMarketplaceSlotsData =
  | {
      success: true
      slots: MarketplaceSlotRow[]
      maxSlots: number
      paidExtensions: number
      profileId: string
    }
  | { error: string }

export async function getOrCreateMarketplaceProfile(playerId: string, campaignRef: string) {
  let profile = await db.playerMarketplaceProfile.findUnique({
    where: { playerId_campaignRef: { playerId, campaignRef } },
  })
  if (!profile) {
    profile = await db.playerMarketplaceProfile.create({
      data: {
        playerId,
        campaignRef,
        maxSlots: MARKETPLACE_BASE_SLOTS,
        paidExtensions: 0,
      },
    })
  }
  return profile
}

export async function listPlayerMarketplaceSlotsForPlayer(
  playerId: string,
  campaignRef: string
): Promise<ListPlayerMarketplaceSlotsData> {
  const ref = campaignRef.trim() || 'bruised-banana'
  const profile = await getOrCreateMarketplaceProfile(playerId, ref)
  const filled = await db.marketplaceStallSlot.findMany({
    where: { profileId: profile.id },
    include: { listedCustomBar: { select: { id: true, title: true, type: true } } },
    orderBy: { slotIndex: 'asc' },
  })
  const byIndex = new Map(filled.map((s) => [s.slotIndex, s]))
  const slots: MarketplaceSlotRow[] = []
  for (let i = 0; i < profile.maxSlots; i++) {
    const row = byIndex.get(i)
    const bar = row?.listedCustomBar
    slots.push({
      slotIndex: i,
      status: bar ? 'listed' : 'empty',
      listingQuestId: bar?.id ?? null,
      listingBarId: bar?.id ?? null,
      title: bar?.title ?? null,
      campaignId: profile.id,
    })
  }

  return {
    success: true,
    slots,
    maxSlots: profile.maxSlots,
    paidExtensions: profile.paidExtensions,
    profileId: profile.id,
  }
}

export type SystemShowcaseItem = { id: string; title: string; description: string; href: string }

export async function listSystemMarketplaceShowcase(
  campaignRef: string,
  limit = 6
): Promise<SystemShowcaseItem[]> {
  const ref = campaignRef.trim() || 'bruised-banana'
  const bars = await db.customBar.findMany({
    where: {
      campaignRef: ref,
      isSystem: true,
      visibility: 'public',
      status: { not: 'archived' },
    },
    select: { id: true, title: true, description: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return bars.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description.slice(0, 160) + (b.description.length > 160 ? '…' : ''),
    href: `/bars/${b.id}`,
  }))
}
