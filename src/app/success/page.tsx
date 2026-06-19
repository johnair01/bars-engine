import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import { LAUNCH_OFFERS, type OfferKey } from '@/lib/launch/offers'

export const metadata: Metadata = {
  title: 'Thanks for backing Mastering Allyship',
  description: 'Your purchase is in — redeem your code to unlock the deck, the book, and the game.',
}

type Props = { searchParams: Promise<{ sku?: string; code?: string; demo?: string }> }

/**
 * /success — the post-purchase return surface.
 *
 * Gumroad hosts checkout off-site, so a buyer otherwise dead-ends on Gumroad's receipt
 * with no path back into the app. Point each Gumroad product's "redirect after purchase"
 * at this page (optionally `?sku=<offer-key>` to name the product, and `?code=<license>`
 * if you pass the key through) so buyers always land on a clear "redeem your code" step.
 *
 * Public + auth-tolerant: works signed-in or out (the redeem step handles sign-in). Never
 * asserts the purchase itself — fulfillment lives in the webhook/redeem flow; this is the
 * handoff that gets buyers there.
 *
 * @see src/app/redeem/page.tsx
 * @see src/app/api/webhooks/gumroad/route.ts
 */
export default async function SuccessPage({ searchParams }: Props) {
  const sp = await searchParams
  const sku = (sp.sku ?? '').trim() as OfferKey
  const code = (sp.code ?? '').trim()
  const demo = sp.demo === '1'

  const offer = LAUNCH_OFFERS.find((o) => o.key === sku)
  const { playerId } = await getCurrentPlayerSafe()
  const signedIn = Boolean(playerId)

  const redeemHref = code ? `/redeem?code=${encodeURIComponent(code)}` : '/redeem'

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-16">
      <div className="mx-auto max-w-md space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-purple-400">
            Mastering the Game of Allyship
          </p>
          <h1 className="text-3xl font-bold text-[#e8e6e0]">Thank you 🎉</h1>
          <p className="text-sm leading-relaxed text-[#a09e98]">
            {offer ? (
              <>
                Your <span className="font-semibold text-[#e8e6e0]">{offer.name}</span> purchase is in.
              </>
            ) : (
              <>Your purchase is in.</>
            )}{' '}
            One step to unlock it inside the app.
          </p>
        </header>

        {demo && (
          <p
            role="status"
            className="rounded-xl border border-amber-400/40 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-200"
          >
            <span className="font-bold uppercase tracking-wide">Demo</span> — no payment was made.
            Your unlock code is already attached below.
          </p>
        )}

        <ol className="space-y-3 rounded-xl border border-zinc-800 bg-[#141412] p-5 text-sm text-[#a09e98]">
          {!demo && (
            <li className="flex gap-3">
              <span className="font-bold text-purple-400">1.</span>
              <span>
                Check your email for the receipt from Gumroad — it carries your{' '}
                <span className="font-semibold text-[#e8e6e0]">unlock code</span> (license key).
              </span>
            </li>
          )}
          <li className="flex gap-3">
            <span className="font-bold text-purple-400">{demo ? '1.' : '2.'}</span>
            <span>
              {signedIn ? (
                <>Redeem it below — it attaches to your account.</>
              ) : (
                <>Redeem it below — you&apos;ll sign in or create an account so it attaches to you.</>
              )}
            </span>
          </li>
        </ol>

        <div className="flex flex-col gap-2">
          <Link
            href={redeemHref}
            className="flex min-h-12 items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white transition-colors hover:bg-purple-500"
          >
            {code ? 'Redeem your code →' : 'Redeem your code'}
          </Link>
          <Link
            href="/collection"
            className="flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 px-4 font-bold text-[#e8e6e0] transition-colors hover:border-zinc-500"
          >
            {signedIn ? 'Open your collection' : 'Already redeemed? Sign in'}
          </Link>
        </div>

        <p className="text-center text-xs text-[#6b6965]">
          Trouble finding your code? It&apos;s in your Gumroad receipt email. You can redeem any time at{' '}
          <Link href="/redeem" className="text-purple-400 underline-offset-2 hover:underline">
            /redeem
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
