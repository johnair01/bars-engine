'use server'

import { db } from '@/lib/db'

/**
 * Public campaign data exposed on the invite landing page.
 * No auth required — public-facing, read-only.
 */
export type CampaignInviteData = {
  campaign: {
    id: string
    slug: string
    name: string
    description: string | null
    allyshipDomain: string | null
    wakeUpContent: string | null
    showUpContent: string | null
    storyBridgeCopy: string | null
    startDate: string | null
    endDate: string | null
    instanceName: string
    createdByName: string | null
  }
  theme: {
    bgGradient: string | null
    bgDeep: string | null
    titleColor: string | null
    accentPrimary: string | null
    accentSecondary: string | null
    accentTertiary: string | null
    fontDisplayKey: string | null
    posterImageUrl: string | null
    cssVarOverrides: Record<string, string> | null
  } | null
  invite: {
    forgerName: string | null
    invitationMessage: string | null
  }
}

/**
 * Fetch campaign data for a campaign-linked invite token.
 * Only returns data for APPROVED or LIVE campaigns.
 * Returns null if invite has no campaign or campaign is not publicly visible.
 */
export async function getCampaignInviteData(
  token: string,
): Promise<CampaignInviteData | null> {
  const invite = await db.invite.findUnique({
    where: { token },
    select: {
      campaignId: true,
      invitationMessage: true,
      forger: { select: { name: true } },
      campaign: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          status: true,
          allyshipDomain: true,
          wakeUpContent: true,
          showUpContent: true,
          storyBridgeCopy: true,
          startDate: true,
          endDate: true,
          instance: { select: { name: true } },
          createdBy: { select: { name: true } },
          theme: true,
        },
      },
    },
  })

  if (!invite?.campaign) return null

  const { campaign } = invite

  // Only APPROVED or LIVE campaigns are publicly visible on invite pages
  if (campaign.status !== 'APPROVED' && campaign.status !== 'LIVE') {
    return null
  }

  return {
    campaign: {
      id: campaign.id,
      slug: campaign.slug,
      name: campaign.name,
      description: campaign.description,
      allyshipDomain: campaign.allyshipDomain,
      wakeUpContent: campaign.wakeUpContent,
      showUpContent: campaign.showUpContent,
      storyBridgeCopy: campaign.storyBridgeCopy,
      startDate: campaign.startDate?.toISOString() ?? null,
      endDate: campaign.endDate?.toISOString() ?? null,
      instanceName: campaign.instance.name,
      createdByName: campaign.createdBy.name,
    },
    theme: campaign.theme
      ? {
          bgGradient: campaign.theme.bgGradient,
          bgDeep: campaign.theme.bgDeep,
          titleColor: campaign.theme.titleColor,
          accentPrimary: campaign.theme.accentPrimary,
          accentSecondary: campaign.theme.accentSecondary,
          accentTertiary: campaign.theme.accentTertiary,
          fontDisplayKey: campaign.theme.fontDisplayKey,
          posterImageUrl: campaign.theme.posterImageUrl,
          cssVarOverrides: campaign.theme.cssVarOverrides as Record<string, string> | null,
        }
      : null,
    invite: {
      forgerName: invite.forger?.name ?? null,
      invitationMessage: invite.invitationMessage ?? null,
    },
  }
}
