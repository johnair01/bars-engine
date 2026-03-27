'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { instanceDonationCtaSchema } from '@/lib/donation-cta-schema'

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

async function isGlobalAdmin(playerId: string): Promise<boolean> {
  const p = await db.player.findUnique({
    where: { id: playerId },
    include: { roles: { include: { role: true } } },
  })
  return p?.roles.some((r) => r.role.key === 'admin') ?? false
}

async function canCampaignOwnerEditInstance(playerId: string, instanceId: string): Promise<boolean> {
  const m = await db.instanceMembership.findFirst({
    where: {
      playerId,
      instanceId,
      roleKey: { in: ['owner', 'steward'] },
    },
    select: { id: true },
  })
  return !!m
}

export async function assertCanEditInstanceDonation(
  playerId: string,
  instanceId: string
): Promise<boolean> {
  if (await isGlobalAdmin(playerId)) return true
  return canCampaignOwnerEditInstance(playerId, instanceId)
}

/**
 * Update donation URLs + optional primary button label for a campaign Instance.
 * Authorized: global admin OR InstanceMembership (owner | steward).
 */
export async function updateInstanceDonationCta(
  instanceId: string,
  raw: Record<string, unknown>
): Promise<{ success: true } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  if (!(await assertCanEditInstanceDonation(playerId, instanceId))) {
    return { error: 'You do not have permission to edit fundraising for this campaign' }
  }

  const parsed = instanceDonationCtaSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join('; ') || 'Invalid input' }
  }

  const v = parsed.data
  const toNull = (s: string | null | undefined) => (s && s.trim().length > 0 ? s.trim() : null)

  await db.instance.update({
    where: { id: instanceId },
    data: {
      stripeOneTimeUrl: toNull(v.stripeOneTimeUrl),
      patreonUrl: toNull(v.patreonUrl),
      venmoUrl: toNull(v.venmoUrl),
      cashappUrl: toNull(v.cashappUrl),
      paypalUrl: toNull(v.paypalUrl),
      donationButtonLabel: v.donationButtonLabel ?? null,
    },
  })

  revalidatePath('/event/donate')
  revalidatePath('/event/donate/wizard')
  revalidatePath('/campaign', 'layout')
  revalidatePath('/admin/instances')
  return { success: true }
}

export type CampaignFundraisingFormState = { ok?: boolean; error?: string }

export async function submitCampaignFundraisingForm(
  _prev: CampaignFundraisingFormState,
  formData: FormData
): Promise<CampaignFundraisingFormState> {
  const instanceId = (formData.get('instanceId') as string | null)?.trim()
  if (!instanceId) return { error: 'Missing campaign' }
  const raw: Record<string, unknown> = {
    stripeOneTimeUrl: formData.get('stripeOneTimeUrl'),
    patreonUrl: formData.get('patreonUrl'),
    venmoUrl: formData.get('venmoUrl'),
    cashappUrl: formData.get('cashappUrl'),
    paypalUrl: formData.get('paypalUrl'),
    donationButtonLabel: formData.get('donationButtonLabel'),
  }
  const res = await updateInstanceDonationCta(instanceId, raw)
  if ('error' in res) return { error: res.error }
  return { ok: true }
}
