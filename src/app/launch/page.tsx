import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { LaunchOffers } from './LaunchOffers'
import { LAUNCH_GOAL_CENTS, formatPrice } from '@/lib/launch/offers'
import { BarnRaisingBar } from '@/components/event/BarnRaisingBar'
import { getBarnSnapshot } from '@/actions/barn'
import type { BarnState } from '@/lib/event/barn-raising'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import { getCurrentPlayerIsAdmin, getLaunchPageContent } from '@/lib/launch/page-content-server'

export const metadata: Metadata = {
  title: 'Mastering Allyship — Launch',
  description:
    'Start with Chapter 1, buy the book, add the Allyship Deck, and continue into live practice.',
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
  const [launchContent, isAdmin] = await Promise.all([
    getLaunchPageContent(),
    getCurrentPlayerIsAdmin(),
  ])

  return (
    <main
      className="min-h-screen px-4 py-10 sm:px-6 lg:px-8"
      style={{ backgroundColor: SURFACE_TOKENS.bgBase, color: SURFACE_TOKENS.textPrimary }}
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <nav className="flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
              <Link
                href="/mastering-allyship/hub"
                className="flex items-center gap-3 hover:text-zinc-300"
              >
                <Image
                  src="/launch/mtgoa-logo-transparent.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.35)]"
                />
                <span className="font-mono uppercase tracking-[0.22em]">
                  Mastering the Game of Allyship
                </span>
              </Link>
              <span className="font-mono uppercase tracking-[0.18em] text-zinc-600">
                Home <span aria-hidden="true">/</span>{' '}
                <span className="text-zinc-400">Launch</span>
              </span>
            </nav>

            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-purple-400">
                {launchContent.hero.eyebrow}
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
                {launchContent.hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[#a09e98]">
                {launchContent.hero.body} Every purchase fuels the{' '}
                {formatPrice(LAUNCH_GOAL_CENTS)} launch wall.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="#choose"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-purple-600 px-5 font-bold text-white transition-colors hover:bg-purple-500"
              >
                Help me choose
              </Link>
              <Link
                href="/mastering-allyship/chapter-1"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-700/70 px-5 font-bold text-emerald-200 transition-colors hover:bg-emerald-950/30"
              >
                Read Chapter 1 first
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              How the pieces fit
            </p>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-300">
              {launchContent.pieces.map((piece) => (
                <li key={piece.step} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-200 font-mono text-xs font-bold text-[#0a0908]">
                    {piece.step}
                  </span>
                  <span>
                    <strong className="text-zinc-100">{piece.name}:</strong> {piece.role}
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </header>

        <LaunchOffers content={launchContent} isAdmin={isAdmin} />

        <section aria-label="Barn raising">
          <BarnRaisingBar variant="teaser" state={barnState} />
        </section>

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
