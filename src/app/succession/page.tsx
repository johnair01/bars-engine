import type { Metadata } from 'next'
import Link from 'next/link'
import { SuccessionWaitlist } from './SuccessionWaitlist'

export const metadata: Metadata = {
  title: 'Certification & succession — Mastering the Game of Allyship',
  description:
    'There is no certification program yet. This page says what actually exists, and holds a list for when there is something real to say. Nothing is for sale.',
}

/**
 * @page /succession
 * @entity CAMPAIGN
 * @description Certification and succession — overdue by a printing. Chapter 9 puts
 *   wendell@masteringallyship.com in print next to certification with no intake behind
 *   it, so people wrote to an address that led nowhere. **Nothing is sold here.** The
 *   page states the actual current state and offers a waitlist, which enters no
 *   sequence (see src/lib/esp/list-contract.ts).
 * @permissions public
 * @relationships FunnelSignup (intent: succession), Kit tag source:succession, /speaking
 * @dimensions WHO:practitioner, WHAT:waitlist, WHERE:succession, ENERGY:honest_state
 * @example /succession
 * @agentDiscoverable true
 */
export default function SuccessionPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship" className="hover:text-zinc-300">
            Mastering the Game of Allyship
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Certification</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Chapter 9 sent you here
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            There is no certification yet.
          </h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            Chapter 9 prints my email address next to the word certification. People wrote to
            it. For a whole printing there was nothing on the other end of that address, and
            the honest word for that is overdue. So here is the actual state, in the order you
            would want it.
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">What exists</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            The book, the deck, and a number of people already running the moves in their own
            communities without anybody certifying them. That last one deserves saying
            plainly: the moves work without a credential, and they worked before I wrote them
            down.
          </p>
          <h2 className="text-lg font-bold">What does not exist</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            A curriculum, a cohort, a price, a date, or a credential. Nothing on this page is
            for sale, and there is no deposit to place or seat to hold.
          </p>
          <h2 className="text-lg font-bold">What happens next</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            If a certification gets built, it gets built with the people who were already
            teaching this before there was a program to teach it in. The list below is how I
            find them. Joining it asks nothing of you and promises you nothing except that the
            next honest update goes to you first.
          </p>
        </section>

        <SuccessionWaitlist />

        <p className="text-sm leading-relaxed text-zinc-500">
          Booking a talk or a training is a separate matter and does exist today.{' '}
          <Link href="/speaking" className="text-zinc-300 underline underline-offset-4">
            Fees and one-sheets are on the speaking page
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
