'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { mapCustomBarToBarCardData, type BarCardData } from '@/lib/bar-card-data'

/**
 * Get BarCardData for a BAR. Used by BarCard component and all BAR surfaces.
 * Spec: .specify/specs/mobile-ui-redesign/spec.md
 *
 * Access: owner, recipient (via BarShare), or public visibility.
 */
export async function getBarCardData(
  barId: string
): Promise<{ success: true; data: BarCardData } | { error: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value ?? null

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    include: {
      creator: { select: { id: true, name: true } },
      shares: { where: { toUserId: playerId ?? '' }, select: { id: true } },
    },
  })

  if (!bar) return { error: 'BAR not found' }

  const isPublic = bar.visibility === 'public'
  const isOwner = bar.creatorId === playerId
  const isRecipient = bar.shares.length > 0

  if (!isOwner && !isRecipient && !isPublic) {
    return { error: 'Not authorized to view this BAR' }
  }

  const data = mapCustomBarToBarCardData({
    id: bar.id,
    title: bar.title,
    description: bar.description,
    type: bar.type,
    inputs: bar.inputs,
    createdAt: bar.createdAt,
    status: bar.status,
    creator: bar.creator,
  })

  return { success: true, data }
}

/**
 * Get recent charge BARs as BarCardData for the current player.
 * Used by RecentChargeSection and other list consumers.
 */
export async function getRecentChargeBarsAsCardData(
  limit: number = 5
): Promise<{ success: true; bars: BarCardData[] } | { error: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value ?? null
  if (!playerId) return { error: 'Not logged in' }

  const bars = await db.customBar.findMany({
    where: {
      creatorId: playerId,
      type: 'charge_capture',
      status: 'active',
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 20),
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      inputs: true,
      createdAt: true,
      status: true,
      creator: { select: { name: true } },
    },
  })

  const cardData = bars.map((b) =>
    mapCustomBarToBarCardData({
      id: b.id,
      title: b.title,
      description: b.description,
      type: b.type,
      inputs: b.inputs,
      createdAt: b.createdAt,
      status: b.status,
      creator: b.creator,
    })
  )

  return { success: true, bars: cardData }
}
