import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * @page /nonprofit
 * @entity CAMPAIGN
 * @description About the non-profit — placeholder under construction. Linked
 *   from the /awaken funnel. Real org details land here once the non-profit
 *   work is done.
 * @permissions public
 * @relationships linked from /awaken
 * @dimensions WHO:visitor, WHAT:org info, WHERE:campaign, ENERGY:learn
 * @example /nonprofit
 * @agentDiscoverable true
 */
export const metadata: Metadata = {
  title: 'About the non-profit — coming soon',
  description: 'Our non-profit home is being built. Check back soon.',
}

export default function NonprofitPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-zinc-200">
      <div className="max-w-md space-y-6">
        <div className="text-5xl">🏗️</div>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-green-400">
          The non-profit
        </p>
        <h1 className="text-3xl font-bold text-white">Under construction</h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          We&apos;re building the home for the non-profit story — mission, structure, and how your
          support compounds. It&apos;s coming soon.
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          In the meantime, the most direct way to help is still the simplest one.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/event/donate"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-bold text-white transition-all hover:from-green-500 hover:to-emerald-500"
          >
            Fuel the car fund →
          </Link>
          <Link
            href="/awaken"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-6 py-3 font-bold text-zinc-200 transition-colors hover:border-zinc-500"
          >
            ← Back to all the ways to help
          </Link>
        </div>
      </div>
    </main>
  )
}
