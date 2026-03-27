import Link from 'next/link'
import { z } from 'zod'
import { getInstanceForDonation } from '@/lib/donation-instance'
import { getCurrentPlayer } from '@/lib/auth'
import { processPendingDonation } from '@/actions/donate'
import { SelfReportDonationForm } from './SelfReportDonationForm'

/**
 * @page /event/donate
 * @entity EVENT
 * @description Campaign donation page - self-report donations to receive redemption packs
 * @permissions public (donation links), authenticated (pack rewards)
 * @relationships links to active CAMPAIGN instance, creates redemption packs, processes pending donations
 * @energyCost 0 (donation tracking, reward packs awarded post-donation)
 * @dimensions WHO:playerId, WHAT:EVENT, WHERE:fundraiser, ENERGY:vibulon_packs, PERSONAL_THROUGHPUT:show_up
 * @example /event/donate
 * @agentDiscoverable false
 */
const DSW_ALLOWED_PATH = new Set(['money', 'time', 'space'])
const DSW_ALLOWED_TIER = new Set(['small', 'medium', 'large', 'custom'])

function formatUsdCents(cents: number) {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars)
}

const PROVIDER_LINKS = [
  { key: 'venmoUrl' as const, label: 'Venmo', color: 'bg-teal-600 hover:bg-teal-500' },
  { key: 'cashappUrl' as const, label: 'Cash App', color: 'bg-green-600 hover:bg-green-500' },
  { key: 'paypalUrl' as const, label: 'PayPal', color: 'bg-blue-600 hover:bg-blue-500' },
  { key: 'stripeOneTimeUrl' as const, label: 'Stripe (Card)', color: 'bg-indigo-600 hover:bg-indigo-500' },
] as const

const cuidSchema = z.string().cuid()

export default async function DonatePage(props: {
  searchParams: Promise<{
    amount?: string
    dswPath?: string
    dswTier?: string
    dswNarrative?: string
    dswMilestoneId?: string
    dswEchoQuestId?: string
    /** Campaign context from DSW / campaign CTAs (Phase 3). */
    ref?: string
  }>
}) {
  const sp = await props.searchParams
  const refParam = sp.ref?.trim()
  const wizardBackHref = refParam
    ? `/event/donate/wizard?ref=${encodeURIComponent(refParam)}`
    : '/event/donate/wizard'
  const amount = sp.amount?.trim()
  const rawPath = sp.dswPath?.trim()
  const rawTier = sp.dswTier?.trim()
  let dswNarrative = sp.dswNarrative?.trim() ?? ''
  if (dswNarrative.length > 280) dswNarrative = dswNarrative.slice(0, 280)
  const rawMilestone = sp.dswMilestoneId?.trim() ?? ''
  const rawEchoQuest = sp.dswEchoQuestId?.trim() ?? ''
  const safePath = rawPath && DSW_ALLOWED_PATH.has(rawPath) ? rawPath : undefined
  const safeTier = rawTier && DSW_ALLOWED_TIER.has(rawTier) ? rawTier : undefined
  const safeNarrative = dswNarrative || undefined
  const safeMilestoneId = cuidSchema.safeParse(rawMilestone).success ? rawMilestone : undefined
  const safeEchoQuestId = cuidSchema.safeParse(rawEchoQuest).success ? rawEchoQuest : undefined
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

  // Post-auth: process pending donation if present
  const result = player ? await processPendingDonation(player.id) : null

  const providerLinks = PROVIDER_LINKS.filter((p) => {
    const url = instance[p.key]
    return url && typeof url === 'string' && url.trim().length > 0
  })

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <Link href="/event" className="text-sm text-zinc-500 hover:text-white">← Back to event</Link>
          <h1 className="text-3xl font-bold text-white">Donate to {instance.name}</h1>
          <p className="text-zinc-400 text-sm">
            Choose a payment method below, then self-report your donation to receive BARs (redemption packs) you can redeem for vibeulons.
          </p>
          <p className="text-sm">
            <Link
              href={wizardBackHref}
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              Guided wizard
            </Link>
            <span className="text-zinc-600"> — </span>
            <span className="text-zinc-500">money or services (time, space)</span>
          </p>
        </header>

        {result?.success && (
          <section className="bg-green-950/30 border border-green-900/60 rounded-xl p-4 text-green-200">
            <div className="font-bold">Thank you!</div>
            <div className="text-sm mt-1">
              Your donation of {formatUsdCents(result.amountCents ?? 0)} was recorded. You received {result.packsCreated ?? 0} pack(s). Redeem them in your wallet for vibeulons.
            </div>
          </section>
        )}

        {providerLinks.length > 0 && (
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Send your donation</h2>
            <p className="text-zinc-500 text-sm">
              Use one of these links to donate via your preferred method:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {providerLinks.map(({ key, label, color }) => (
                <a
                  key={key}
                  href={instance[key]!}
                  target="_blank"
                  rel="noreferrer"
                  className={`text-center px-5 py-3 rounded-xl ${color} text-white font-bold transition`}
                >
                  {label}
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">I donated — self-report</h2>
          <p className="text-zinc-400 text-sm">
            After donating, enter the amount below. You&apos;ll receive BARs (redemption packs) based on your donation. {!player && 'You&apos;ll need to sign in or create an account to complete this.'}
          </p>
          <SelfReportDonationForm
            instanceId={instance.id}
            instanceName={instance.name}
            isLoggedIn={!!player}
            defaultAmount={amount || undefined}
            dswPath={safePath}
            dswTier={safeTier}
            dswNarrative={safeNarrative}
            dswMilestoneId={safeMilestoneId}
            dswEchoQuestId={safeEchoQuestId}
          />
        </section>
      </div>
    </div>
  )
}
