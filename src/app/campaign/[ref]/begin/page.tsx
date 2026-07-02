import type { Metadata } from 'next'
import { BeginPage } from './BeginPage'

export const metadata: Metadata = {
  title: 'Cross the threshold | BARs',
  description: 'Discover your allyship superpower, shed a myth, choose your domain, and create your character.',
}

/**
 * @page /campaign/[ref]/begin
 * @entity CAMPAIGN
 * @description Onboarding funnel — the vibey CYOA social-post landing. Superpower
 *   discovery → allyship myths → domain → offered quests → "create your character".
 *   Completing it records a CampaignLead (source automated) on the owner board.
 * @permissions public (no sign-up wall — parity with the Superpower quiz)
 * @relationships CampaignLead (automated), LatentAllyshipIntake, CustomBar (quest pool)
 * @dimensions WHO:prospective player, WHAT:choose-a-path, WHERE:[ref], ENERGY:invite
 */
export default async function BeginRoute({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  return <BeginPage campaignRef={ref} />
}
