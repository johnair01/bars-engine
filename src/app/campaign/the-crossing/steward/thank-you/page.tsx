import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertSteward, getCampaignState } from '@/actions/the-crossing-support'
import {
  parseContribution,
  recipientsOf,
  THE_CROSSING_CAMPAIGN_REF,
} from '@/lib/the-crossing-support-moves'
import { ThankYouBroadcast } from './ThankYouBroadcast'

const PAGE_BG = 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)'

export const metadata: Metadata = { title: 'Thank your contributors · The Crossing' }

const PATH = '/campaign/the-crossing/steward/thank-you'

export default async function ThankYouPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect(`/login?returnTo=${encodeURIComponent(PATH)}`)
  if (!(await assertSteward(player.id))) redirect('/campaign/the-crossing/steward')

  const state = await getCampaignState()
  // The thank-you broadcast is the close-the-loop step after the car is secured.
  if (!state.carPurchased) redirect('/campaign/the-crossing/steward')
  if (state.thanked) redirect('/campaign/the-crossing/steward/thank-you/sent')

  const bars = await db.customBar.findMany({
    where: { campaignRef: THE_CROSSING_CAMPAIGN_REF, evidenceKind: 'support_intake' },
    select: { id: true, contextLines: true, createdAt: true },
  })
  const recipients = recipientsOf(bars.map(parseContribution))

  return (
    <main
      className="min-h-screen px-5 py-8 text-[#f4f2ec] sm:px-8"
      style={{ background: PAGE_BG, backgroundColor: '#0a0908' }}
    >
      <div className="mx-auto w-full max-w-[560px]">
        <ThankYouBroadcast recipients={recipients} />
      </div>
    </main>
  )
}
