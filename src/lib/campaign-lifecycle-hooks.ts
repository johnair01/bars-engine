/**
 * Campaign Lifecycle Hooks — side-effects that fire after status transitions.
 *
 * Hook registration happens at module load time (imported by the approval
 * actions module). Hooks are fire-and-forget — errors are logged but do not
 * roll back the transition.
 */

import { db } from '@/lib/db'
import { onTransition } from '@/lib/campaign-lifecycle'
import { buildCampaignShareUrl } from '@/lib/campaign-share-url'

// ---------------------------------------------------------------------------
// APPROVED hook — generate shareable URL
// ---------------------------------------------------------------------------

/**
 * When a campaign is approved, generate and persist the canonical share URL.
 * This makes the campaign discoverable at `/campaign/[slug]` and signals to
 * the UI that it's share-ready.
 */
onTransition('APPROVED', async (event) => {
  const campaign = await db.campaign.findUnique({
    where: { id: event.campaignId },
    select: { slug: true, shareUrl: true },
  })

  if (!campaign) {
    console.error(
      `[campaign-lifecycle-hooks] Campaign ${event.campaignId} not found for share URL generation`
    )
    return
  }

  // Don't overwrite if already set (e.g. re-approval after rejection cycle)
  if (campaign.shareUrl) return

  const shareUrl = buildCampaignShareUrl(campaign.slug)

  await db.campaign.update({
    where: { id: event.campaignId },
    data: { shareUrl },
  })

  console.log(
    `[campaign-lifecycle-hooks] Share URL generated for campaign ${event.campaignId}: ${shareUrl}`
  )
})
