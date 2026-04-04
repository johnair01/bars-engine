import Link from 'next/link'
import { getInstanceForDonation } from '@/lib/donation-instance'
import { getCurrentPlayer } from '@/lib/auth'
import { processPendingDonation } from '@/actions/donate'
import { DonatePageView } from '@/components/donation/DonatePageView'
import { parseDonatePageSearchParams } from '@/lib/donation-page-params'

/**
 * @page /event/donate
 * @entity EVENT
 * @description Campaign donation page — payment links (public) + self-report (signed-in) mints vibeulons
 * @permissions public (donation links), authenticated (self-report + vibeulon mint)
 * @relationships links to active CAMPAIGN instance, records donations, processes pending self-report
 * @energyCost 0 (donation tracking, vibeulons minted post self-report)
 * @dimensions WHO:playerId, WHAT:EVENT, WHERE:fundraiser, ENERGY:vibulons, PERSONAL_THROUGHPUT:show_up
 * @example /event/donate
 * @agentDiscoverable false
 */
export default async function DonatePage(props: {
  searchParams: Promise<{
    amount?: string
    dswPath?: string
    dswTier?: string
    dswNarrative?: string
    dswMilestoneId?: string
    dswEchoQuestId?: string
    ref?: string
  }>
}) {
  const sp = await props.searchParams
  const refParam = sp.ref?.trim()
  const wizardBackHref = refParam
    ? `/event/donate/wizard?ref=${encodeURIComponent(refParam)}`
    : '/event/donate/wizard'
  const parsed = parseDonatePageSearchParams(sp)
  const instance = await getInstanceForDonation(refParam ?? null)
  const player = await getCurrentPlayer()

  if (!instance) {
    const title = refParam ? 'Campaign not found' : 'No active instance'
    const detail = refParam
      ? `No residency instance matches ref “${refParam}”. Check the link or ask a steward.`
      : 'The donation page isn&apos;t configured yet.'
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex items-center justify-center">
        <div className="max-w-xl w-full space-y-6 text-center">
          <div className="text-4xl">🧩</div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-zinc-500">{detail}</p>
          <Link href="/event" className="inline-block px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
            ← Back to event
          </Link>
        </div>
      </div>
    )
  }

  const result = player ? await processPendingDonation(player.id) : null

  return (
    <DonatePageView
      instance={instance}
      isLoggedIn={!!player}
      wizardBackHref={wizardBackHref}
      parsed={parsed}
      pendingDonationResult={result}
    />
  )
}
