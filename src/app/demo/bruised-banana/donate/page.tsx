import Link from 'next/link'
import { getInstanceForDonation } from '@/lib/donation-instance'
import { getCurrentPlayer } from '@/lib/auth'
import { processPendingDonation } from '@/actions/donate'
import { DonatePageView } from '@/components/donation/DonatePageView'
import { parseDonatePageSearchParams } from '@/lib/donation-page-params'

const BB_REF = 'bruised-banana'

/**
 * @page /demo/bruised-banana/donate
 * @entity CAMPAIGN
 * @description Public **outreach** donate surface — same layout as `/event/donate?ref=bruised-banana` (no login to use payment links). Use in deep links from outbound BARs, wiki, and email without requiring app context.
 * @permissions public
 * @searchParams amount, dswPath, dswTier, dswNarrative, dswMilestoneId, dswEchoQuestId (optional; DSW handoff)
 * @relationships INSTANCE (bruised-banana donation), DONATION self-report when signed in
 * @agentDiscoverable false
 */
export default async function BruisedBananaDemoDonatePage(props: {
  searchParams: Promise<{
    amount?: string
    dswPath?: string
    dswTier?: string
    dswNarrative?: string
    dswMilestoneId?: string
    dswEchoQuestId?: string
  }>
}) {
  const sp = await props.searchParams
  const wizardBackHref = `/event/donate/wizard?ref=${encodeURIComponent(BB_REF)}`
  const parsed = parseDonatePageSearchParams(sp)
  const instance = await getInstanceForDonation(BB_REF)
  const player = await getCurrentPlayer()

  if (!instance) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex items-center justify-center">
        <div className="max-w-xl w-full space-y-6 text-center">
          <div className="text-4xl">🧩</div>
          <h1 className="text-2xl font-bold text-white">Campaign not found</h1>
          <p className="text-zinc-500">
            No residency instance matches Bruised Banana. Check the link or ask a steward.
          </p>
          <Link href="/wiki/campaign/bruised-banana" className="inline-block px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
            ← Bruised Banana on the wiki
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
      donateReturnPath="/demo/bruised-banana/donate"
      backLink={{
        href: '/wiki/campaign/bruised-banana',
        label: '← Bruised Banana (wiki)',
      }}
      intro={
        <p className="text-zinc-500 text-sm border-l-2 border-emerald-700/60 pl-3">
          You can support the residency here without an account — use the links below. Self-report for
          self-report still requires sign-in (same as the main donate page).
        </p>
      }
    />
  )
}
