'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { maybeCompleteMilestoneAndAdvanceKotter } from '@/actions/campaign-deck'

const PENDING_DONATION_COOKIE = 'bars_pending_donation'
const DEFAULT_PACK_RATE_CENTS = 100 // 1 pack per $1
const VIBEULONS_PER_PACK = 1

const DSW_NARRATIVE_MAX = 280
const DSW_ALLOWED_PATH = new Set(['money', 'time', 'space'])
const DSW_ALLOWED_TIER = new Set(['small', 'medium', 'large', 'custom'])

const cuidSchema = z.string().cuid()

/** Post-login return for pending donation — allowlist only (blocks open redirects). */
function normalizeDonateReturnPath(raw: string | null | undefined): string {
  const v = raw?.trim() || '/event/donate'
  if (v === '/demo/bruised-banana/donate' || v.startsWith('/demo/bruised-banana/donate?')) {
    return v
  }
  if (v === '/campaign/initiation' || v.startsWith('/campaign/initiation?')) {
    return v
  }
  if (v === '/event/donate/wizard' || v.startsWith('/event/donate/wizard?')) {
    return v
  }
  if (v === '/event/donate' || v.startsWith('/event/donate?')) {
    return v
  }
  return '/event/donate'
}

export type DonationWizardMeta = {
  path?: string
  tier?: string
  narrative?: string
  /** Active `CampaignMilestone` for this instance’s campaign ref */
  milestoneId?: string
  /** Optional `CustomBar` (quest) id for steward-facing echo */
  echoQuestId?: string
}

function buildDswMetaRecord(dsw?: DonationWizardMeta): Record<string, string> | undefined {
  if (!dsw) return undefined
  const o: Record<string, string> = {}
  if (dsw.milestoneId) o.milestoneId = dsw.milestoneId
  if (dsw.echoQuestId) o.echoQuestId = dsw.echoQuestId
  if (Object.keys(o).length === 0) return undefined
  return o
}

function parseDswFromForm(formData: FormData): DonationWizardMeta | undefined {
  const rawPath = (formData.get('dswPath') as string | null)?.trim() || ''
  const rawTier = (formData.get('dswTier') as string | null)?.trim() || ''
  const path = DSW_ALLOWED_PATH.has(rawPath) ? rawPath : ''
  const tier = DSW_ALLOWED_TIER.has(rawTier) ? rawTier : ''
  let narrative = (formData.get('dswNarrative') as string | null)?.trim() || ''
  if (narrative.length > DSW_NARRATIVE_MAX) narrative = narrative.slice(0, DSW_NARRATIVE_MAX)

  const rawMilestone = (formData.get('dswMilestoneId') as string | null)?.trim() || ''
  const rawQuest = (formData.get('dswEchoQuestId') as string | null)?.trim() || ''
  const milestoneId = cuidSchema.safeParse(rawMilestone).success ? rawMilestone : ''
  const echoQuestId = cuidSchema.safeParse(rawQuest).success ? rawQuest : ''

  if (!path && !tier && !narrative && !milestoneId && !echoQuestId) return undefined
  return {
    ...(path ? { path } : {}),
    ...(tier ? { tier } : {}),
    ...(narrative ? { narrative } : {}),
    ...(milestoneId ? { milestoneId } : {}),
    ...(echoQuestId ? { echoQuestId } : {}),
  }
}

function buildDonationNote(dsw?: DonationWizardMeta, milestoneTitle?: string | null): string {
  const base = 'Self-reported donation'
  if (!dsw || (!dsw.path && !dsw.tier && !dsw.narrative && !dsw.milestoneId && !dsw.echoQuestId)) {
    return base
  }
  const kv: string[] = []
  if (dsw.path) kv.push(`path=${dsw.path}`)
  if (dsw.tier) kv.push(`tier=${dsw.tier}`)
  if (dsw.milestoneId) kv.push(`milestoneId=${dsw.milestoneId}`)
  if (milestoneTitle) kv.push(`milestoneTitle=${milestoneTitle.replace(/\|/g, '·').slice(0, 120)}`)
  if (dsw.echoQuestId) kv.push(`echoQuestId=${dsw.echoQuestId}`)
  const head = `[DSW] ${kv.join(' ')}`.trim()
  if (dsw.narrative) {
    const safe = dsw.narrative.replace(/\s+/g, ' ').replace(/\|/g, '·')
    return `${head} | ${base} | narrative=${safe}`
  }
  return `${head} | ${base}`
}

export type ReportDonationState = {
  success?: boolean
  error?: string
  requiresAuth?: boolean
  redirectTo?: string
  amountCents?: number
  /** Vibeulons minted to the player when self-report succeeds (no intermediate “pack” step). */
  vibeulonsMinted?: number
}

function parseAmountCents(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return null
  const n = parseFloat(s)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

function pendingCookiePayload(
  instanceId: string,
  amountCents: number,
  dsw?: DonationWizardMeta
): Record<string, unknown> {
  return {
    instanceId,
    amountCents,
    ...(dsw?.path ? { dswPath: dsw.path } : {}),
    ...(dsw?.tier ? { dswTier: dsw.tier } : {}),
    ...(dsw?.narrative ? { dswNarrative: dsw.narrative } : {}),
    ...(dsw?.milestoneId ? { dswMilestoneId: dsw.milestoneId } : {}),
    ...(dsw?.echoQuestId ? { dswEchoQuestId: dsw.echoQuestId } : {}),
  }
}

function dswFromPendingCookie(data: Record<string, unknown>): DonationWizardMeta | undefined {
  const p =
    typeof data.dswPath === 'string' && DSW_ALLOWED_PATH.has(data.dswPath.trim())
      ? data.dswPath.trim()
      : ''
  const t =
    typeof data.dswTier === 'string' && DSW_ALLOWED_TIER.has(data.dswTier.trim())
      ? data.dswTier.trim()
      : ''
  let n = typeof data.dswNarrative === 'string' ? data.dswNarrative.trim() : ''
  if (n.length > DSW_NARRATIVE_MAX) n = n.slice(0, DSW_NARRATIVE_MAX)
  const m =
    typeof data.dswMilestoneId === 'string' && cuidSchema.safeParse(data.dswMilestoneId.trim()).success
      ? data.dswMilestoneId.trim()
      : ''
  const q =
    typeof data.dswEchoQuestId === 'string' && cuidSchema.safeParse(data.dswEchoQuestId.trim()).success
      ? data.dswEchoQuestId.trim()
      : ''
  if (!p && !t && !n && !m && !q) return undefined
  return {
    ...(p ? { path: p } : {}),
    ...(t ? { tier: t } : {}),
    ...(n ? { narrative: n } : {}),
    ...(m ? { milestoneId: m } : {}),
    ...(q ? { echoQuestId: q } : {}),
  }
}

/**
 * Report a donation (honor system). If not logged in, stores pending donation in cookie
 * and returns requiresAuth + redirectTo. If logged in, creates Donation + mints vibeulons.
 */
export async function reportDonation(formData: FormData): Promise<ReportDonationState> {
  const instanceId = (formData.get('instanceId') as string | null)?.trim()
  const amountCents = parseAmountCents(formData.get('amount'))

  const rawMilestone = (formData.get('dswMilestoneId') as string | null)?.trim() || ''
  if (rawMilestone && !cuidSchema.safeParse(rawMilestone).success) {
    return { error: 'Invalid milestone selection.' }
  }
  const rawQuest = (formData.get('dswEchoQuestId') as string | null)?.trim() || ''
  if (rawQuest && !cuidSchema.safeParse(rawQuest).success) {
    return { error: 'Quest BAR id is not valid.' }
  }

  const dsw = parseDswFromForm(formData)

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
    cookieStore.set(PENDING_DONATION_COOKIE, JSON.stringify(pendingCookiePayload(instanceId, amountCents, dsw)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    })
    const returnPath = normalizeDonateReturnPath(formData.get('donateReturnPath') as string | null)
    const returnTo = encodeURIComponent(returnPath)
    return {
      requiresAuth: true,
      redirectTo: `/login?returnTo=${returnTo}`,
      amountCents,
    }
  }

  return createDonationAndPacks(instanceId, player.id, amountCents, dsw)
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
  amountCents: number,
  dsw?: DonationWizardMeta
): Promise<ReportDonationState> {
  const inst = await db.instance.findUnique({
    where: { id: instanceId },
    select: { name: true, donationPackRateCents: true, campaignRef: true, slug: true },
  })
  if (!inst) return { error: 'Instance not found' }

  const campaignRef = inst.campaignRef?.trim() || inst.slug?.trim() || ''

  if (dsw?.milestoneId) {
    if (!campaignRef) {
      return { error: 'This fundraiser has no campaign ref; milestone linking is unavailable.' }
    }
    const ok = await db.campaignMilestone.findFirst({
      where: { id: dsw.milestoneId, campaignRef, status: 'active' },
      select: { id: true },
    })
    if (!ok) {
      return {
        error: 'That milestone is not active for this campaign. Refresh the page and pick again.',
      }
    }
  }

  if (dsw?.echoQuestId) {
    const bar = await db.customBar.findFirst({
      where: { id: dsw.echoQuestId },
      select: { id: true },
    })
    if (!bar) {
      return { error: 'Linked quest BAR was not found. Clear the quest link and try again.' }
    }
  }

  const rate = inst.donationPackRateCents ?? DEFAULT_PACK_RATE_CENTS
  const packsCount = Math.floor(amountCents / rate)
  if (packsCount < 1) {
    return { error: `Minimum self-reported donation to mint vibeulons is $${(rate / 100).toFixed(2)}` }
  }

  let linkedMilestoneId: string | null = null

  try {
    const result = await db.$transaction(async (tx) => {
      const msRow =
        dsw?.milestoneId && campaignRef
          ? await tx.campaignMilestone.findFirst({
              where: { id: dsw.milestoneId, campaignRef, status: 'active' },
              select: { id: true, title: true },
            })
          : null

      const donation = await tx.donation.create({
        data: {
          instanceId,
          playerId,
          amountCents,
          provider: 'honor_system',
          note: buildDonationNote(dsw, msRow?.title ?? null),
          dswMeta: buildDswMetaRecord(dsw) ?? undefined,
        },
      })

      if (msRow) {
        const dollars = amountCents / 100
        await tx.milestoneContribution.create({
          data: {
            milestoneId: msRow.id,
            playerId,
            donationRef: donation.id,
            value: dollars,
            note: dsw?.narrative ?? null,
          },
        })
        await tx.campaignMilestone.update({
          where: { id: msRow.id },
          data: { currentValue: { increment: dollars } },
        })
        linkedMilestoneId = msRow.id
      }

      await tx.instance.update({
        where: { id: instanceId },
        data: {
          currentAmountCents: { increment: amountCents },
        },
      })

      const existingCampaign = await tx.blessedObjectEarned.findFirst({
        where: {
          playerId,
          source: 'campaign_completion',
          instanceId,
        },
      })
      if (!existingCampaign) {
        await tx.blessedObjectEarned.create({
          data: {
            playerId,
            source: 'campaign_completion',
            instanceId,
          },
        })
      }

      return { donation }
    })

    if (linkedMilestoneId) {
      try {
        await maybeCompleteMilestoneAndAdvanceKotter(linkedMilestoneId)
      } catch (e) {
        console.warn('[donate] maybeCompleteMilestoneAndAdvanceKotter', e)
      }
    }

    const vibeulonsMinted = packsCount * VIBEULONS_PER_PACK
    const { mintVibulon } = await import('@/actions/economy')
    await mintVibulon(
      playerId,
      vibeulonsMinted,
      {
        source: 'donation',
        id: result.donation.id,
        title: `Donation: ${inst.name?.trim() || 'Campaign'}`,
      },
      { skipRevalidate: true }
    )

    revalidatePath('/event')
    revalidatePath('/event/donate')
    revalidatePath('/event/donate/wizard')
    revalidatePath('/demo/bruised-banana/donate')
    revalidatePath('/')
    revalidatePath('/wallet')

    return {
      success: true,
      amountCents,
      vibeulonsMinted,
    }
  } catch (e) {
    console.error('[donate] createDonationAndPacks failed:', e)
    return { error: 'Failed to record donation. Please try again.' }
  }
}

/**
 * Process pending donation from cookie (post-auth). Called when user lands on donate page
 * after logging in. Creates Donation + mints vibeulons and clears cookie.
 */
export async function processPendingDonation(playerId: string): Promise<{
  success?: boolean
  amountCents?: number
  vibeulonsMinted?: number
} | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(PENDING_DONATION_COOKIE)?.value
  if (!raw) return null

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw) as Record<string, unknown>
    if (
      typeof data.instanceId !== 'string' ||
      typeof data.amountCents !== 'number' ||
      data.amountCents < 1
    ) {
      cookieStore.delete(PENDING_DONATION_COOKIE)
      return null
    }
  } catch {
    cookieStore.delete(PENDING_DONATION_COOKIE)
    return null
  }

  const dsw = dswFromPendingCookie(data)

  const result = await createDonationAndPacks(
    data.instanceId as string,
    playerId,
    data.amountCents as number,
    dsw
  )
  cookieStore.delete(PENDING_DONATION_COOKIE)

  if (result.success) {
    return { success: true, amountCents: result.amountCents, vibeulonsMinted: result.vibeulonsMinted }
  }
  return null
}
