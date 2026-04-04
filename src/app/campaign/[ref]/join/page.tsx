import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCampaignSkin } from '@/lib/ui/campaign-skin'
import { CampaignJoinView } from './CampaignJoinView'

/**
 * @page /campaign/:slug/join
 * @entity CAMPAIGN
 * @description Campaign join page — unauthenticated visitors see signup/login,
 *   authenticated non-members see a one-click join confirmation.
 *   Members are redirected to the campaign hub.
 * @permissions public
 * @params ref:string (path, required) - Campaign slug
 * @searchParams invite:string (invite token, optional)
 * @relationships CAMPAIGN, CampaignTheme, InstanceMembership
 * @dimensions WHO:visitor, WHAT:campaign join, WHERE:campaign, ENERGY:membership
 */

async function getCampaignBySlug(slug: string) {
  const campaign = await db.campaign.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      status: true,
      instanceId: true,
      instance: { select: { name: true } },
      theme: true,
    },
  })

  if (!campaign || (campaign.status !== 'APPROVED' && campaign.status !== 'LIVE')) {
    return null
  }

  return campaign
}

export default async function CampaignJoinPage(props: {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ invite?: string }>
}) {
  const { ref } = await props.params
  const { invite: inviteToken } = await props.searchParams
  const slug = decodeURIComponent(ref)

  const campaign = await getCampaignBySlug(slug)
  if (!campaign) notFound()

  // Check if visitor is already a member — redirect to hub
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (playerId) {
    const membership = await db.instanceMembership.findUnique({
      where: {
        instanceId_playerId: {
          instanceId: campaign.instanceId,
          playerId,
        },
      },
      select: { id: true },
    })

    if (membership) {
      redirect(`/campaign/hub?ref=${encodeURIComponent(campaign.slug)}`)
    }
  }

  const staticSkin = getCampaignSkin(campaign.slug)
  const isAuthenticated = !!playerId

  return (
    <CampaignJoinView
      campaign={{
        id: campaign.id,
        slug: campaign.slug,
        name: campaign.name,
        description: campaign.description,
        instanceId: campaign.instanceId,
        instanceName: campaign.instance.name,
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
      }}
      staticSkin={staticSkin}
      isAuthenticated={isAuthenticated}
      inviteToken={inviteToken}
    />
  )
}
