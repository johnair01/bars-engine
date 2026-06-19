import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, STAGE_TOKENS } from '@/lib/ui/card-tokens'
import { formatPrice } from '@/lib/launch/offers'
import { isLaunchDemoMode, offerForKey } from '@/lib/launch/demo'
import { completeDemoCheckout } from '@/actions/launch-demo'

export const metadata: Metadata = {
  title: 'Demo checkout — Mastering Allyship',
  description: 'Walk the purchase funnel end-to-end without a real payment.',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ sku?: string }> }

/**
 * /launch/demo-checkout — payment-free stand-in for Gumroad's hosted checkout.
 *
 * Only reachable when NEXT_PUBLIC_LAUNCH_DEMO_MODE=1 (otherwise 404). Mirrors the
 * real hand-off: confirm the offer, "complete" the purchase, land on /success
 * with a freshly minted code. Three channels come straight from the registry —
 * element=color, altitude=border, stage=density (UI_COVENANT.md).
 */
export default async function DemoCheckoutPage({ searchParams }: Props) {
  if (!isLaunchDemoMode()) notFound()

  const sp = await searchParams
  const offer = offerForKey(sp.sku)
  if (!offer) notFound()

  const st = STAGE_TOKENS[offer.stage]
  const sigil = ELEMENT_TOKENS[offer.element].sigil
  const price = formatPrice(offer.priceCents)

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-16">
      <div className="mx-auto max-w-md space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-300">
            Demo checkout · no payment
          </p>
          <h1 className="text-3xl font-bold text-[#e8e6e0]">Confirm your demo purchase</h1>
          <p className="text-sm leading-relaxed text-[#a09e98]">
            This stands in for Gumroad so you can walk the whole funnel without paying. Completing
            it mints a real unlock code and drops you on the same success step a buyer sees.
          </p>
        </header>

        <CultivationCard
          element={offer.element}
          altitude={offer.altitude}
          stage={offer.stage}
          aria-label={`${offer.name} — ${price}, demo checkout`}
          className="flex flex-col"
        >
          <div
            className={`card-art-window ${st.artWindowHeight} flex items-center justify-center overflow-hidden rounded-t-xl`}
            aria-hidden="true"
          >
            <span className="text-5xl opacity-80" style={{ color: 'var(--element-glow)' }}>
              {sigil}
            </span>
          </div>
          <div className="relative z-10 flex flex-col gap-3 p-4">
            <h2 className="text-base font-bold text-[#e8e6e0]">{offer.name}</h2>
            <p className="text-sm leading-relaxed text-[#a09e98]">{offer.blurb}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-2xl font-bold text-[#e8e6e0]"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {price}
              </span>
              {offer.recurring && <span className="text-sm text-[#a09e98]">/{offer.recurring}</span>}
              {offer.pwyw && <span className="text-sm text-[#a09e98]">suggested</span>}
              <span className="text-[11px] font-bold uppercase tracking-wide text-amber-300">
                Demo · $0 charged
              </span>
            </div>
          </div>
        </CultivationCard>

        <form action={completeDemoCheckout} className="flex flex-col gap-2">
          <input type="hidden" name="sku" value={offer.key} />
          <button
            type="submit"
            className="flex min-h-12 items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white transition-colors hover:bg-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908]"
          >
            Complete demo purchase →
          </button>
          <Link
            href="/launch"
            className="flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 px-4 font-bold text-[#e8e6e0] transition-colors hover:border-zinc-500"
          >
            Cancel
          </Link>
        </form>

        <p className="text-center text-xs text-[#6b6965]">
          Demo mode is on (<span className="font-bold text-[#a09e98]">NEXT_PUBLIC_LAUNCH_DEMO_MODE</span>).
          Turn it off and these CTAs go straight to Gumroad.
        </p>
      </div>
    </main>
  )
}
