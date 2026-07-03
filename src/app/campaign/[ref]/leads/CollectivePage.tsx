/**
 * The Collective — shared server component. Steward-gated; lists published leads.
 * Spec: campaign-lead-forge Phase 6.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { assertCampaignSteward } from '@/lib/campaign-leads/auth'
import { listCollectiveLeads } from '@/actions/campaign-leads'
import { CollectiveDirectory } from './CollectiveDirectory'

export async function CollectivePage({ campaignRef, basePath }: { campaignRef: string; basePath: string }) {
  const player = await getCurrentPlayer()
  if (!player) redirect(`/login?returnTo=${encodeURIComponent(`${basePath}/collective`)}`)

  if (!(await assertCampaignSteward(player.id, campaignRef))) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0908] px-6 text-center text-[#cfcdc6]">
        <p className="max-w-sm text-sm">The collective is for stewards of {campaignRef}.</p>
        <Link href={basePath} className="text-sm font-semibold" style={{ color: '#8b5cf6' }}>← Back to your list</Link>
      </main>
    )
  }

  const res = await listCollectiveLeads(campaignRef)
  const leads = res.ok ? res.leads : []
  return <CollectiveDirectory leads={leads} basePath={basePath} campaignRef={campaignRef} />
}
