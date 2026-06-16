import type { Metadata } from 'next'
import Link from 'next/link'
import { LaunchOffers } from './LaunchOffers'
import { LAUNCH_GOAL_CENTS, formatPrice } from '@/lib/launch/offers'
import { BarnRaisingBar } from '@/components/event/BarnRaisingBar'
import { getBarnSnapshot } from '@/actions/barn'
import type { BarnState } from '@/lib/event/barn-raising'

export const metadata: Metadata = {
  title: 'Mastering Allyship — Launch',
  description:
    'Preorder the book, the RPG handbook, the deck, and the game. Become a Founding Ally.',
}

/**
 * /launch — the shareable offer page for the Mastering Allyship launch.
 *
 * Phase 1 commerce: Gumroad hosts checkout (see src/lib/launch/offers.ts).
 * This page is a server component; the interactive offer grid is the only
 * client island (LaunchOffers). No auth required — it is a public funnel,
 * shared directly and from the book's "unlock the goodies" link.
 */
export default async function LaunchPage() {
  // Live barn totals for the teaser — every Gumroad sale raises the pre-sale wall (see
  // the webhook bridge). DB-safe: fall back to the honest empty state on a preview deploy.
  let barnState: BarnState | undefined
  try {
    barnState = await getBarnSnapshot()
  } catch {
    barnState = undefined
  }

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Hero */}
        <header className="space-y-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-purple-400">
            Mastering the Game of Allyship
          </p>
          <h1 className="text-4xl font-bold text-[#e8e6e0] sm:text-5xl">
            The launch is open.
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#a09e98]">
            The book, the RPG handbook, the Oracle deck, and the game — all in one
            place. Buy what calls you, preorder the physical goods, or become a
            Founding Ally. Every purchase fuels the {formatPrice(LAUNCH_GOAL_CENTS)} launch
            goal and the July 18 book launch party.
          </p>
        </header>

        {/* Offers */}
        <LaunchOffers />

        {/* Barn raising — every purchase raises the pre-sale wall */}
        <section aria-label="Barn raising">
          <BarnRaisingBar variant="teaser" state={barnState} />
        </section>

        {/* Footer */}
        <footer className="space-y-2 border-t border-zinc-800 pt-8 text-center text-sm text-[#6b6965]">
          <p>
            Questions, or want to give time or space instead of money?{' '}
            <Link href="/event" className="text-purple-400 underline-offset-2 hover:underline">
              Support the residency
            </Link>
            .
          </p>
          <p>Payments are handled securely by Gumroad. Physical goods ship after the print run.</p>
        </footer>
      </div>
    </main>
  )
}
