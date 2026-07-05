/**
 * Quest Studio — library shared server component. Steward-gated; lists authored quests.
 * Spec: campaign-lead-forge Phase 7.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { assertCampaignSteward } from '@/lib/campaign-leads/auth'
import { listCampaignQuests } from '@/actions/quest-studio'
import { QuestLibrary } from './QuestLibrary'

export async function QuestLibraryPage({ campaignRef, basePath }: { campaignRef: string; basePath: string }) {
  const player = await getCurrentPlayer()
  if (!player) redirect(`/login?returnTo=${encodeURIComponent(basePath)}`)

  if (!(await assertCampaignSteward(player.id, campaignRef))) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0908] px-6 text-center text-[#cfcdc6]">
        <p className="max-w-sm text-sm">The Quest Studio is for stewards of {campaignRef}.</p>
        <Link href={`/campaign/${campaignRef}`} className="text-sm font-semibold" style={{ color: '#8b5cf6' }}>← Back</Link>
      </main>
    )
  }

  const res = await listCampaignQuests(campaignRef)
  return <QuestLibrary quests={res.ok ? res.quests : []} basePath={basePath} />
}
