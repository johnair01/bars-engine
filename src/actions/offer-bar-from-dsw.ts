'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  serializeOfferBarDocQuest,
  validateAndBuildOfferBarMetadata,
  type OfferBarCreateInput,
} from '@/lib/offer-bar'
import { assertCanCreatePrivateDraft } from '@/lib/vault-limits'

export type CreateOfferBarFromDswResult =
  | { success: true; barId: string }
  | { error: string }

/**
 * Create a private Vault BAR from the donation wizard Time/Space flow (`offerBAR` / timebank protocol).
 * @see `.specify/specs/offer-bar-timebank-wizard-modal/spec.md`
 */
export async function createOfferBarFromDsw(input: OfferBarCreateInput): Promise<CreateOfferBarFromDswResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const built = validateAndBuildOfferBarMetadata(input)
  if (!built.ok) return { error: built.error }

  const cap = await assertCanCreatePrivateDraft(player.id)
  if (!cap.ok) return { error: cap.error }

  const { metadata } = built
  const campaignRef = metadata.campaignRef?.trim() || null

  let allyshipDomain: string | null = null
  if (campaignRef) {
    const instance = await db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      select: { allyshipDomain: true, primaryCampaignDomain: true },
    })
    allyshipDomain = instance?.allyshipDomain ?? instance?.primaryCampaignDomain ?? null
  }

  const docQuestMetadata = serializeOfferBarDocQuest(metadata)

  try {
    const bar = await db.customBar.create({
      data: {
        creatorId: player.id,
        title: input.title.trim().slice(0, 200),
        description: input.description.trim(),
        type: 'vibe',
        reward: 1,
        visibility: 'private',
        status: 'active',
        claimedById: player.id,
        inputs: JSON.stringify([]),
        rootId: 'temp',
        campaignRef,
        allyshipDomain,
        docQuestMetadata,
      },
    })

    await db.customBar.update({
      where: { id: bar.id },
      data: { rootId: bar.id },
    })

    revalidatePath('/', 'layout')
    revalidatePath('/hand')
    revalidatePath('/bars')
    return { success: true, barId: bar.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create offer BAR'
    console.error('[offer-bar-from-dsw]', msg, e)
    return { error: msg }
  }
}
