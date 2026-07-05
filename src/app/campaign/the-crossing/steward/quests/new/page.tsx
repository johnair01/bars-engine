import type { Metadata } from 'next'
import { QuestStudioComposerPage } from '@/app/campaign/[ref]/quests/QuestStudioComposerPage'

export const metadata: Metadata = { title: 'Author a quest · The Crossing | BARs' }

/**
 * @page /campaign/the-crossing/steward/quests/new
 * @entity CAMPAIGN
 * @description The Crossing Quest Studio composer (static-segment shim).
 * @permissions steward (assertCampaignSteward)
 * @relationships CustomBar (quest + alignment tags)
 * @dimensions WHO:campaign steward, WHAT:author-a-quest, WHERE:the-crossing, ENERGY:grow-up
 */
export default async function TheCrossingComposer({ searchParams }: { searchParams: Promise<{ forLead?: string }> }) {
  const { forLead } = await searchParams
  return <QuestStudioComposerPage campaignRef="the-crossing" basePath="/campaign/the-crossing/steward/quests" forLead={forLead ?? null} />
}
