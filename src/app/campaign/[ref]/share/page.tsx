import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCampaignSkin } from '@/lib/ui/campaign-skin'
import {
  ShareableCampaignPage,
  type ShareableCampaignData,
} from '@/components/campaign/ShareableCampaignPage'

/**
 * @page /campaign/:ref/share
 * @entity CAMPAIGN
 * @description Public shareable campaign page — optimized for link sharing with OG metadata,
 *   campaign skin/theme, and join/invite CTA. This is the URL distributed via social media,
 *   messaging, and email to attract new participants.
 * @permissions public (only APPROVED/LIVE campaigns visible)
 * @params ref:string (path, required) - Campaign slug
 * @searchParams invite:string (invite token, optional)
 * @relationships CAMPAIGN, CampaignTheme (L2 skin), Instance, Player (creator)
 * @dimensions WHO:public, WHAT:campaign share, WHERE:campaign, ENERGY:invite_token
 * @example /campaign/bruised-banana/share?invite=abc123
 * @agentDiscoverable false
 */

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
  startDate: true,
  endDate: true,
  instanceId: true,
  instance: {
    select: { name: true },
  },
  createdBy: {
    select: { name: true },
  },
  theme: true,
} as const

async function getShareableCampaign(slug: string): Promise<ShareableCampaignData | null> {
  const campaign = await db.campaign.findUnique({
    where: { slug },
    select: CAMPAIGN_SELECT,
  })

  // Only APPROVED or LIVE campaigns are publicly shareable
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
    startDate: campaign.startDate?.toISOString() ?? null,
    endDate: campaign.endDate?.toISOString() ?? null,
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

/** Resolve inviter name from invite token */
async function getInviterName(token: string | undefined): Promise<string | null> {
  if (!token) return null
  const invite = await db.invite.findUnique({
    where: { token, status: 'active' },
    select: { forger: { select: { name: true } } },
  })
  return invite?.forger?.name ?? null
}

// ─── Metadata (OG tags for social sharing) ──────────────────────────────────

export async function generateMetadata(props: {
  params: Promise<{ ref: string }>
}): Promise<Metadata> {
  const { ref } = await props.params
  const slug = decodeURIComponent(ref)
  const campaign = await getShareableCampaign(slug)

  if (!campaign) {
    return { title: 'Campaign Not Found' }
  }

  const description =
    campaign.description ?? `Join the ${campaign.name} campaign`

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

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function ShareCampaignPage(props: {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ invite?: string }>
}) {
  const { ref } = await props.params
  const { invite: inviteToken } = await props.searchParams
  const slug = decodeURIComponent(ref)

  const campaign = await getShareableCampaign(slug)
  if (!campaign) notFound()

  const staticSkin = getCampaignSkin(campaign.slug)
  const inviterName = await getInviterName(inviteToken)

  // Check if viewer is authenticated
  const cookieStore = await cookies()
  const isAuthenticated = !!cookieStore.get('bars_player_id')?.value

  return (
    <ShareableCampaignPage
      campaign={campaign}
      staticSkin={staticSkin}
      inviteToken={inviteToken}
      inviterName={inviterName}
      isAuthenticated={isAuthenticated}
    />
  )
}
