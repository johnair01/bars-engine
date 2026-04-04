import type { ReactNode } from 'react'
import Link from 'next/link'
import type { Instance } from '@prisma/client'
import { SelfReportDonationForm } from '@/app/event/donate/SelfReportDonationForm'
import type { ParsedDonatePageSearchParams } from '@/lib/donation-page-params'

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

export type DonatePageBackLink = {
  href: string
  label: string
}

export type DonatePageViewProps = {
  instance: Instance
  isLoggedIn: boolean
  wizardBackHref: string
  parsed: ParsedDonatePageSearchParams
  /** After login: banner from `processPendingDonation` */
  pendingDonationResult: {
    success?: boolean
    amountCents?: number
    vibeulonsMinted?: number
  } | null
  backLink?: DonatePageBackLink
  /** Extra context under the title (e.g. outreach / demo BAR copy) */
  intro?: ReactNode
  /** Post-login redirect for pending self-report (must match server allowlist in `reportDonation`). */
  donateReturnPath?: string
}

/**
 * Shared **donate** layout: payment provider buttons + self-report (auth required to record + mint vibeulons).
 * Used by `/event/donate` and public demo routes — **no login** required to view payment links.
 */
export function DonatePageView({
  instance,
  isLoggedIn,
  wizardBackHref,
  parsed,
  pendingDonationResult,
  backLink = { href: '/event', label: '← Back to event' },
  intro,
  donateReturnPath = '/event/donate',
}: DonatePageViewProps) {
  const providerLinks = PROVIDER_LINKS.filter((p) => {
    const url = instance[p.key]
    return url && typeof url === 'string' && url.trim().length > 0
  })

  const result = pendingDonationResult

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <Link href={backLink.href} className="text-sm text-zinc-500 hover:text-white">
            {backLink.label}
          </Link>
          <h1 className="text-3xl font-bold text-white">Donate to {instance.name}</h1>
          {intro}
          <p className="text-zinc-400 text-sm">
            Choose a payment method below, then self-report your donation. When signed in, vibeulons are minted
            to your wallet based on the amount (see instance rate).
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
              Your donation of {formatUsdCents(result.amountCents ?? 0)} was recorded.{' '}
              {result.vibeulonsMinted != null && result.vibeulonsMinted > 0
                ? `${result.vibeulonsMinted} vibeulon(s) were added to your wallet.`
                : 'Thank you for supporting the residency.'}
            </div>
          </section>
        )}

        {providerLinks.length > 0 && (
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Send your donation</h2>
            <p className="text-zinc-500 text-sm">Use one of these links to donate via your preferred method:</p>
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
            After donating, enter the amount below. Vibeulons are minted to your wallet based on your
            donation (when signed in). {!isLoggedIn && 'You&apos;ll need to sign in or create an account to complete this.'}
          </p>
          <SelfReportDonationForm
            instanceId={instance.id}
            instanceName={instance.name}
            isLoggedIn={isLoggedIn}
            defaultAmount={parsed.amount}
            dswPath={parsed.dswPath}
            dswTier={parsed.dswTier}
            dswNarrative={parsed.dswNarrative}
            dswMilestoneId={parsed.dswMilestoneId}
            dswEchoQuestId={parsed.dswEchoQuestId}
            donateReturnPath={donateReturnPath}
          />
        </section>
      </div>
    </div>
  )
}
