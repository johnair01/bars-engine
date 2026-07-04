import type { Metadata } from 'next'
import { QuestStudioComposerPage } from '../QuestStudioComposerPage'

export const metadata: Metadata = { title: 'Author a quest | BARs' }

/**
 * @page /campaign/[ref]/quests/new
 * @entity CAMPAIGN
 * @description Quest Studio composer — author a quest aligned to a myth × superpower ×
 *   GM face; AI-draft (with a deterministic fallback), edit, and save to the campaign pool.
 * @permissions steward (assertCampaignSteward)
 * @relationships CustomBar (quest + alignment tags), ALLYSHIP_MYTHS, SUPERPOWER_TRANSLATION, GM_FACE_STAGE_MOVES
 * @dimensions WHO:campaign steward, WHAT:author-a-quest, WHERE:[ref], ENERGY:grow-up
 */
export default async function ComposerRoute({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ forLead?: string }>
}) {
  const { ref } = await params
  const { forLead } = await searchParams
  return <QuestStudioComposerPage campaignRef={ref} basePath={`/campaign/${ref}/quests`} forLead={forLead ?? null} />
}
