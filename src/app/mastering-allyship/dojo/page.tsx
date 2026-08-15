import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Allyship Dojo — Mastering the Game of Allyship',
  description:
    'A weekly practice community for turning allyship from idea into real-world conversation practice.',
}

/**
 * @page /mastering-allyship/dojo
 * @entity CAMPAIGN
 * @description The weekly practice community. **No cohort is scheduled**, and the page
 *   says so above the alternatives rather than describing an implementation backlog to
 *   customers, which is what it did before. Hands a reader the deck (runs without a
 *   calendar) or the 1:1 (open, and priced after a conversation).
 * @permissions public
 * @relationships /deck/sales, /mastering-allyship/one-to-one, /mastering-allyship/chapter-1
 * @dimensions WHO:practitioner, WHAT:program state, WHERE:mastering-allyship, ENERGY:honest_state
 * @example /mastering-allyship/dojo
 * @agentDiscoverable true
 */
export default function AllyshipDojoOfferPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship/chapter-1" className="hover:text-zinc-300">
            Chapter 1
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Allyship Dojo</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
            Flagship weekly program
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Bring one real conversation.</h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            The Allyship Dojo is a weekly practice community where each session teaches one concrete
            move for staying in partnership while creating meaningful change.
          </p>
        </header>

        {/* Honest state. This section used to describe the implementation backlog
            to customers — dates, registration and pricing "in the next pass" —
            which tells a reader nothing she can act on and tells her the site is
            unfinished. It now says what is true and hands her something live. */}
        <section className="rounded-2xl border border-amber-600/40 bg-amber-950/20 p-6">
          <h2 className="text-lg font-bold">No cohort is scheduled</h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-100/90">
            The Dojo has run before and will run again, and there is no date on the board
            today. Nothing is for sale on this page, and there is no seat to hold.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">What to do meanwhile</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            The weekly move the Dojo teaches is a card in the deck, and the deck runs without
            a cohort or a calendar. If what you want is somebody in the fire with you rather
            than a group, the 1:1 is open and its page says what it costs to find out.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/deck/sales"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500"
            >
              Get the deck →
            </Link>
            <Link
              href="/mastering-allyship/one-to-one"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-5 font-bold text-zinc-200 transition-colors hover:border-zinc-500"
            >
              Look at the 1:1
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
