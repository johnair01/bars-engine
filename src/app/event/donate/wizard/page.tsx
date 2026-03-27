import Link from 'next/link'
import { Suspense } from 'react'
import { getInstanceForDonation } from '@/lib/donation-instance'
import { DonationSelfServiceWizard } from '@/components/event/DonationSelfServiceWizard'
import { getCurrentPlayer } from '@/lib/auth'
import { resolveMarketplaceCampaignRef } from '@/lib/resolve-marketplace-campaign-ref'
import { listActiveMilestonesForInstance } from '@/lib/donation-wizard'

export default async function DonationWizardPage(props: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref: urlRef } = await props.searchParams
  const resolvedRef = await resolveMarketplaceCampaignRef()
  const campaignRef = (urlRef?.trim() || resolvedRef || '').trim() || ''

  const instance = await getInstanceForDonation(campaignRef || null)
  if (!instance) {
    const title = campaignRef ? 'Campaign not found' : 'No active instance'
    const detail = campaignRef
      ? `No residency instance matches ref “${campaignRef}”.`
      : 'The contribution wizard isn&apos;t available yet.'
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

  const effectiveRef = campaignRef || instance.campaignRef || instance.slug || ''
  const marketplaceHref = `/campaign/marketplace?ref=${encodeURIComponent(effectiveRef)}`
  const milestones = await listActiveMilestonesForInstance(instance.id)
  const directDonateHref = `/event/donate?ref=${encodeURIComponent(effectiveRef)}`
  const player = await getCurrentPlayer()

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <Link href={directDonateHref} className="text-sm text-zinc-500 hover:text-white">
            ← Direct donate page
          </Link>
          <Link href="/event" className="block text-sm text-zinc-500 hover:text-white">
            ← Event hub
          </Link>
          <h1 className="text-3xl font-bold text-white">How do you want to contribute?</h1>
          <p className="text-zinc-400 text-sm">
            Guided path for <span className="text-zinc-200">{instance.name}</span> — money or services (time, space), or host.
          </p>
        </header>

        <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
          <Suspense
            fallback={<p className="text-zinc-500 text-sm">Loading contribution options…</p>}
          >
            <DonationSelfServiceWizard
              instanceName={instance.name}
              campaignRef={effectiveRef}
              marketplaceHref={marketplaceHref}
              milestones={milestones}
              isLoggedIn={!!player}
            />
          </Suspense>
        </section>
      </div>
    </div>
  )
}
