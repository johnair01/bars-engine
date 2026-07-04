import type { Metadata } from 'next'
import { QuestLibraryPage } from './QuestLibraryPage'

export const metadata: Metadata = { title: 'Quest library | BARs' }

/**
 * @page /campaign/[ref]/quests
 * @entity CAMPAIGN
 * @description Quest Studio library — the campaign's authored quests with queryable
 *   alignment tags (domain, myth, superpower, GM face); archive or author new.
 * @permissions steward (assertCampaignSteward)
 * @relationships CustomBar (quest + alignment tags)
 * @dimensions WHO:campaign steward, WHAT:manage-quests, WHERE:[ref], ENERGY:grow-up
 */
export default async function QuestLibraryRoute({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  return <QuestLibraryPage campaignRef={ref} basePath={`/campaign/${ref}/quests`} />
}
