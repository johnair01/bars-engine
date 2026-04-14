import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCampaignSkin } from '@/lib/ui/campaign-skin'
import { CampaignLanding } from './CampaignLanding'

/**
 * @page /campaign/:slug
 * @entity CAMPAIGN
 * @description Public campaign landing/visit page — renders campaign skin (poster, title,
 *   description) and shows a Join/RSVP button for unauthenticated or non-member visitors.
 *   Members see an "Enter Campaign" CTA instead.
 * @permissions public (only APPROVED/LIVE campaigns visible)
 * @params ref:string (path, required) - Campaign slug
 * @searchParams invite:string (invite token, optional)
 * @relationships CAMPAIGN, CampaignTheme (L2 skin), Instance, InstanceMembership
 * @dimensions WHO:public, WHAT:campaign landing, WHERE:campaign, ENERGY:visitor_check
 * @example /campaign/bruised-banana
 */

export type CampaignPageData = {
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
  instanceId: string
  instanceName: string
  createdByName: string | null
  shareUrl: string | null
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
}

/** Visitor status — determines which CTA the landing page shows. */
export type VisitorStatus = 'unauthenticated' | 'non_member' | 'member'

const CAMPAIGN_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  status: true,
  allyshipDomain: true,
  wakeUpContent: true,
  showUpContent: true,
  storyBridgeCopy: true,
  shareUrl: true,
  startDate: true,
  endDate: true,
  instanceId: true,
  instance: {
    select: {
      name: true,
      campaignRef: true,
    },
  },
  createdBy: {
    select: {
      name: true,
    },
  },
  theme: true,
} as const

/**
 * Load an approved campaign by its public slug.
 * Returns null for non-ACTIVE or missing campaigns — caller should notFound().
 */
async function getApprovedCampaign(slug: string): Promise<CampaignPageData | null> {
  const campaign = await db.campaign.findUnique({
    where: { slug },
    select: CAMPAIGN_SELECT,
  })

  // Only APPROVED or LIVE campaigns are publicly visible
  if (!campaign || (campaign.status !== 'APPROVED' && campaign.status !== 'LIVE')) {
    return null
  }

  return {
    id: campaign.id,
    slug: campaign.slug,
    name: campaign.name,
    description: campaign.description,
    allyshipDomain: campaign.allyshipDomain,
    wakeUpContent: campaign.wakeUpContent,
    showUpContent: campaign.showUpContent,
    storyBridgeCopy: campaign.storyBridgeCopy,
    shareUrl: campaign.shareUrl,
    startDate: campaign.startDate?.toISOString() ?? null,
    endDate: campaign.endDate?.toISOString() ?? null,
    instanceId: campaign.instanceId,
    instanceName: campaign.instance.name,
    createdByName: campaign.createdBy.name,
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
  }
}

export async function generateMetadata(props: {
  params: Promise<{ ref: string }>
}): Promise<Metadata> {
  const { ref } = await props.params
  const slug = decodeURIComponent(ref)
  const campaign = await getApprovedCampaign(slug)

  if (!campaign) {
    return { title: 'Campaign Not Found' }
  }

  const description = campaign.description ?? `Join the ${campaign.name} campaign`

  return {
    title: `${campaign.name} | BARs`,
    description,
    openGraph: {
      title: campaign.name,
      description,
      type: 'website',
      ...(campaign.theme?.posterImageUrl
        ? { images: [{ url: campaign.theme.posterImageUrl, alt: campaign.name }] }
        : {}),
    },
    twitter: {
      card: campaign.theme?.posterImageUrl ? 'summary_large_image' : 'summary',
      title: campaign.name,
      description,
      ...(campaign.theme?.posterImageUrl
        ? { images: [campaign.theme.posterImageUrl] }
        : {}),
    },
  }
}

/**
 * Determine the visitor's relationship to this campaign.
 * - unauthenticated: no player cookie
 * - non_member: logged in but not a member of the campaign's instance
 * - member: logged in and has InstanceMembership for this campaign's instance
 */
async function resolveVisitorStatus(
  instanceId: string,
): Promise<VisitorStatus> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) return 'unauthenticated'

  const membership = await db.instanceMembership.findUnique({
    where: {
      instanceId_playerId: { instanceId, playerId },
    },
    select: { id: true },
  })

  return membership ? 'member' : 'non_member'
}

export default async function CampaignPage(props: {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ invite?: string }>
}) {
  const { ref } = await props.params
  const { invite: inviteToken } = await props.searchParams
  const slug = decodeURIComponent(ref)
  const campaign = await getApprovedCampaign(slug)

  if (!campaign) {
    notFound()
  }

  // Merge DB theme with static skin (DB theme takes priority)
  const staticSkin = getCampaignSkin(campaign.slug)

  // Determine visitor relationship to this campaign
  const visitorStatus = await resolveVisitorStatus(campaign.instanceId)

  return (
    <CampaignLanding
      campaign={campaign}
      staticSkin={staticSkin}
      visitorStatus={visitorStatus}
      inviteToken={inviteToken}
    />
  )
}
