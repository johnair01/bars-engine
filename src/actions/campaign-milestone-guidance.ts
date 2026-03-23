'use server'

/**
 * Server-side milestone snapshot + guided actions for active campaign instance.
 * @see .specify/specs/bruised-banana-milestone-throughput/spec.md
 */

import { db } from '@/lib/db'
import { getActiveInstance } from '@/actions/instance'
import { getOnboardingStatus } from '@/actions/onboarding'
import {
  countPrivateDraftBars,
  countUnplacedVaultQuests,
  getVaultMaxPrivateDrafts,
  getVaultMaxUnplacedQuests,
} from '@/lib/vault-limits'
import {
  buildMilestoneSnapshot,
  computeGuidedActions,
  type CampaignMilestoneGuidance,
} from '@/lib/bruised-banana-milestone'

async function playerHasGameboardParticipation(
  playerId: string,
  instanceId: string,
  campaignRef: string
): Promise<boolean> {
  const n = await db.gameboardSlot.count({
    where: {
      instanceId,
      campaignRef,
      OR: [
        { stewardId: playerId },
        { bids: { some: { bidderId: playerId } } },
        {
          aidOffers: {
            some: {
              OR: [{ offererId: playerId }, { stewardId: playerId }],
            },
          },
        },
      ],
    },
  })
  return n > 0
}

/**
 * Returns null when no suitable active instance or on error (fail-soft for dashboard).
 */
export async function getCampaignMilestoneGuidance(
  playerId: string,
  options?: { campaignRef?: string }
): Promise<CampaignMilestoneGuidance | null> {
  try {
    const instance = await getActiveInstance()
    if (!instance) return null

    const resolvedRef = options?.campaignRef ?? instance.campaignRef ?? 'bruised-banana'
    const isBb =
      resolvedRef === 'bruised-banana' || (instance.campaignRef ?? 'bruised-banana') === 'bruised-banana'
    if (!instance.isEventMode && !isBb) {
      return null
    }

    const snapshot = buildMilestoneSnapshot(instance, {
      campaignRefOverride: resolvedRef,
    })
    if (!snapshot) return null

    const onboarding = await getOnboardingStatus(playerId)
    const onboardingComplete =
      'isComplete' in onboarding && onboarding.isComplete === true

    const maxDrafts = getVaultMaxPrivateDrafts()
    const maxUnplaced = getVaultMaxUnplacedQuests()
    const [draftCount, unplacedCount] = await Promise.all([
      countPrivateDraftBars(playerId),
      countUnplacedVaultQuests(playerId),
    ])
    const vaultDraftsAtCap = maxDrafts != null && draftCount >= maxDrafts
    const vaultUnplacedAtCap = maxUnplaced != null && unplacedCount >= maxUnplaced

    const hasGameboardParticipation = await playerHasGameboardParticipation(
      playerId,
      instance.id,
      resolvedRef
    )

    const guidedActions = computeGuidedActions({
      campaignRef: resolvedRef,
      onboardingComplete,
      vaultDraftsAtCap,
      vaultUnplacedAtCap,
      hasGameboardParticipation,
      isEventMode: instance.isEventMode,
    })

    return { snapshot, guidedActions }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getCampaignMilestoneGuidance]', e)
    }
    return null
  }
}
