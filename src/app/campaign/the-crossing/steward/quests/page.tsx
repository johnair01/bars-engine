import type { Metadata } from 'next'
import { QuestLibraryPage } from '@/app/campaign/[ref]/quests/QuestLibraryPage'

export const metadata: Metadata = { title: 'Quest library · The Crossing | BARs' }

/**
 * @page /campaign/the-crossing/steward/quests
 * @entity CAMPAIGN
 * @description The Crossing Quest Studio library (static-segment shim).
 * @permissions steward (assertCampaignSteward)
 * @relationships CustomBar (quest + alignment tags)
 * @dimensions WHO:campaign steward, WHAT:manage-quests, WHERE:the-crossing, ENERGY:grow-up
 */
export default function TheCrossingQuestLibrary() {
  return <QuestLibraryPage campaignRef="the-crossing" basePath="/campaign/the-crossing/steward/quests" />
}
