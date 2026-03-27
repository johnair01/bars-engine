import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertCanEditInstanceDonation } from '@/actions/donation-cta'
import { CampaignFundraisingForm } from '@/components/campaign/CampaignFundraisingForm'

export default async function CampaignFundraisingPage(props: { params: Promise<{ ref: string }> }) {
  const { ref: rawRef } = await props.params
  const campaignRef = decodeURIComponent(rawRef)

  const player = await getCurrentPlayer()
  if (!player) {
    redirect(`/login?returnTo=${encodeURIComponent(`/campaign/${rawRef}/fundraising`)}`)
  }

  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
  })
  if (!instance) notFound()

  const canEdit = await assertCanEditInstanceDonation(player.id, instance.id)
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-center max-w-md">
          You don&apos;t have permission to edit fundraising for this campaign.
        </p>
        <Link
          href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
          className="text-purple-400 hover:text-purple-300"
        >
          ← Back to campaign hub
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-10 max-w-2xl mx-auto space-y-8">
      <header className="space-y-2">
        <Link
          href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
          className="text-sm text-zinc-500 hover:text-white inline-block"
        >
          ← Campaign hub
        </Link>
        <h1 className="text-2xl font-bold text-white">Fundraising — {instance.name}</h1>
        <p className="text-zinc-500 text-sm">
          Payment links and the primary donate button label for this residency. Donors reach these via{' '}
          <code className="text-zinc-400">/event/donate?ref={campaignRef}</code> and campaign CTAs.
        </p>
      </header>

      <CampaignFundraisingForm
        instance={{
          id: instance.id,
          stripeOneTimeUrl: instance.stripeOneTimeUrl,
          patreonUrl: instance.patreonUrl,
          venmoUrl: instance.venmoUrl,
          cashappUrl: instance.cashappUrl,
          paypalUrl: instance.paypalUrl,
          donationButtonLabel: instance.donationButtonLabel,
        }}
      />
    </div>
  )
}
