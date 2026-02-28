'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const PENDING_DONATION_COOKIE = 'bars_pending_donation'
const DEFAULT_PACK_RATE_CENTS = 100 // 1 pack per $1
const VIBEULONS_PER_PACK = 1

export type ReportDonationState = {
  success?: boolean
  error?: string
  requiresAuth?: boolean
  redirectTo?: string
  amountCents?: number
  packsCreated?: number
}

function parseAmountCents(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return null
  const n = parseFloat(s)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

/**
 * Report a donation (honor system). If not logged in, stores pending donation in cookie
 * and returns requiresAuth + redirectTo. If logged in, creates Donation + RedemptionPacks.
 */
export async function reportDonation(formData: FormData): Promise<ReportDonationState> {
  const instanceId = (formData.get('instanceId') as string | null)?.trim()
  const amountCents = parseAmountCents(formData.get('amount'))

  if (!instanceId) return { error: 'Instance is required' }
  if (amountCents == null || amountCents < 1) return { error: 'Please enter a valid amount' }

  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { id: true, donationPackRateCents: true },
  })
  if (!instance) return { error: 'Instance not found' }

  const player = await getCurrentPlayer()

  if (!player) {
    const cookieStore = await cookies()
    cookieStore.set(PENDING_DONATION_COOKIE, JSON.stringify({ instanceId, amountCents }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    })
    const returnTo = encodeURIComponent('/event/donate')
    return {
      requiresAuth: true,
      redirectTo: `/login?returnTo=${returnTo}`,
      amountCents,
    }
  }

  return createDonationAndPacks(instanceId, player.id, amountCents)
}

export async function reportDonationWithState(
  _prevState: ReportDonationState | null,
  formData: FormData
): Promise<ReportDonationState> {
  return reportDonation(formData)
}

async function createDonationAndPacks(
  instanceId: string,
  playerId: string,
  amountCents: number
): Promise<ReportDonationState> {
  const instance = await db.instance.findUnique({
    where: { id: instanceId },
    select: { donationPackRateCents: true },
  })
  if (!instance) return { error: 'Instance not found' }

  const rate = instance.donationPackRateCents ?? DEFAULT_PACK_RATE_CENTS
  const packsCount = Math.floor(amountCents / rate)
  if (packsCount < 1) {
    return { error: `Minimum donation for a pack is $${(rate / 100).toFixed(2)}` }
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          instanceId,
          playerId,
          amountCents,
          provider: 'honor_system',
          note: 'Self-reported donation',
        },
      })

      const packs = []
      for (let i = 0; i < packsCount; i++) {
        packs.push(
          tx.redemptionPack.create({
            data: {
              instanceId,
              playerId,
              donationId: donation.id,
              packType: 'donation',
              status: 'unredeemed',
              vibeulonAmount: VIBEULONS_PER_PACK,
            },
          })
        )
      }

      await tx.instance.update({
        where: { id: instanceId },
        data: {
          currentAmountCents: { increment: amountCents },
        },
      })

      return { donation, packs }
    })

    revalidatePath('/event')
    revalidatePath('/event/donate')
    revalidatePath('/')
    revalidatePath('/wallet')

    return {
      success: true,
      amountCents,
      packsCreated: result.packs.length,
    }
  } catch (e) {
    console.error('[donate] createDonationAndPacks failed:', e)
    return { error: 'Failed to record donation. Please try again.' }
  }
}

/**
 * Process pending donation from cookie (post-auth). Called when user lands on donate page
 * after logging in. Creates Donation + RedemptionPacks and clears cookie.
 */
export async function processPendingDonation(playerId: string): Promise<{
  success?: boolean
  amountCents?: number
  packsCreated?: number
} | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(PENDING_DONATION_COOKIE)?.value
  if (!raw) return null

  let data: { instanceId: string; amountCents: number }
  try {
    data = JSON.parse(raw) as { instanceId: string; amountCents: number }
    if (!data?.instanceId || typeof data.amountCents !== 'number' || data.amountCents < 1) {
      cookieStore.delete(PENDING_DONATION_COOKIE)
      return null
    }
  } catch {
    cookieStore.delete(PENDING_DONATION_COOKIE)
    return null
  }

  const result = await createDonationAndPacks(data.instanceId, playerId, data.amountCents)
  cookieStore.delete(PENDING_DONATION_COOKIE)

  if (result.success) {
    return { success: true, amountCents: result.amountCents, packsCreated: result.packsCreated }
  }
  return null
}

/**
 * Redeem a RedemptionPack for vibeulons. Mints vibeulons and marks pack as redeemed.
 */
export async function redeemPack(packId: string): Promise<{ error?: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Sign in to redeem' }

  const pack = await db.redemptionPack.findFirst({
    where: { id: packId, playerId: player.id, status: 'unredeemed' },
    include: { instance: true },
  })
  if (!pack) return { error: 'Pack not found or already redeemed' }

  const { mintVibulon } = await import('@/actions/economy')
  await mintVibulon(player.id, pack.vibeulonAmount, {
    source: 'redemption_pack',
    id: pack.id,
    title: `Donation pack: ${pack.instance.name}`,
  })

  await db.redemptionPack.update({
    where: { id: packId },
    data: { status: 'redeemed', redeemedAt: new Date() },
  })

  revalidatePath('/wallet')
  revalidatePath('/event/donate')
  revalidatePath('/')
  return {}
}
