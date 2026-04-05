import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCampaignHomeData } from '@/actions/campaign-home'
import { getCampaignSkin } from '@/lib/ui/campaign-skin'
import { CampaignHomeView } from './CampaignHomeView'

/**
 * @page /campaign/:slug/home
 * @entity CAMPAIGN
 * @description Campaign home — post-join member landing page with actionable activity items.
 *   After joining a campaign, members see at least one actionable item (welcome quest,
 *   character creation prompt, first scene, contribution opportunity).
 * @permissions authenticated member of the campaign's instance
 * @params ref:string (path, required) - Campaign slug
 * @searchParams joined:string (optional, "true" shows welcome banner)
 * @relationships CAMPAIGN, CampaignTheme, Instance, InstanceMembership, Adventure, QuestTemplate
 * @dimensions WHO:member, WHAT:campaign home, WHERE:campaign, ENERGY:activity_selection
 * @example /campaign/bruised-banana/home
 */

export async function generateMetadata(props: {
  params: Promise<{ ref: string }>
}): Promise<Metadata> {
  const { ref } = await props.params
  const slug = decodeURIComponent(ref)
  const result = await getCampaignHomeData(slug)

  if ('error' in result) {
    return { title: 'Campaign Home' }
  }

  return {
    title: `${result.data.campaign.name} — Home`,
    description: result.data.campaign.description ?? `Your home in ${result.data.campaign.name}`,
  }
}

export default async function CampaignHomePage(props: {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ joined?: string }>
}) {
  const { ref } = await props.params
  const { joined } = await props.searchParams
  const slug = decodeURIComponent(ref)

  const result = await getCampaignHomeData(slug)

  if ('error' in result) {
    // Not authenticated → login
    if (result.error === 'Not authenticated') {
      redirect(`/login?returnTo=/campaign/${encodeURIComponent(slug)}/home`)
    }
    // Not a member → campaign landing (join flow)
    if (result.error === 'You are not a member of this campaign') {
      redirect(`/campaign/${encodeURIComponent(slug)}`)
    }
    // Campaign not found or inactive
    notFound()
  }

  const staticSkin = getCampaignSkin(result.data.campaign.slug)

  return (
    <CampaignHomeView
      data={result.data}
      staticSkin={staticSkin}
      isNewlyJoined={joined === 'true'}
    />
  )
}
