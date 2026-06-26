import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertSteward, getCampaignState } from '@/actions/the-crossing-support'
import {
  computeFund,
  computeStewardStats,
  filterCounts,
  parseContribution,
  THE_CROSSING_CAMPAIGN_REF,
} from '@/lib/the-crossing-support-moves'
import { StewardDashboard } from './StewardDashboard'

export const metadata: Metadata = { title: 'Steward · The Crossing | BARs' }

const STEWARD_PATH = '/campaign/the-crossing/steward'

export default async function TheCrossingStewardPage() {
  const player = await getCurrentPlayer()
  if (!player) {
    redirect(`/login?returnTo=${encodeURIComponent(STEWARD_PATH)}`)
  }

  if (!(await assertSteward(player.id))) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0908] px-6 text-center text-[#cfcdc6]">
        <p className="max-w-sm text-sm">
          This board is for The Crossing’s steward. You’re signed in, but don’t have steward access to
          this campaign.
        </p>
        <Link href="/campaign/the-crossing" className="text-sm font-semibold" style={{ color: '#8b5cf6' }}>
          ← Back to The Crossing
        </Link>
      </main>
    )
  }

  const bars = await db.customBar.findMany({
    where: { campaignRef: THE_CROSSING_CAMPAIGN_REF, evidenceKind: 'support_intake' },
    select: { id: true, contextLines: true, createdAt: true },
  })

  const contributions = bars
    .map(parseContribution)
    .sort(
      (a, b) =>
        (b.status === 'new' ? 1 : 0) - (a.status === 'new' ? 1 : 0) ||
        b.createdAt.localeCompare(a.createdAt),
    )

  const [state] = await Promise.all([getCampaignState()])

  return (
    <StewardDashboard
      contributions={contributions}
      stats={computeStewardStats(contributions)}
      fund={computeFund(contributions)}
      counts={filterCounts(contributions)}
      state={state}
    />
  )
}
