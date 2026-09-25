import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The village is already playing — Mastering the Game of Allyship',
  description:
    'Two paths exist on the other side of the book, and they do not ask the same of you. The deck is the smaller step and the one you can take this week. The coaching is the more expensive, in every sense.',
}

/**
 * Chapter 9's closing offer, quoted from the shipped trade edition.
 *
 * These two lines are his and are kept verbatim. The first is the whole frame
 * for the page; the second is the recommendation the chapter actually makes,
 * and softening it into "explore your options" would invert it.
 */
const OPENING = 'Two paths exist on the other side of this book. They are not the same size, and they don’t ask the same of you.'
const CLOSING = 'Start with the deck. It is the one that begins the moment you open the box.'

/**
 * @page /mastering-allyship/what-comes-next
 * @entity CAMPAIGN
 * @description Chapter 9's two paths, in the order and the proportion the book puts them
 *   in: the deck first as the smaller step, the coaching second as the more expensive one.
 *   The coaching path forks the way the chapter does — a Founder move you already know has
 *   to be you goes to 1:1, and wanting the method itself goes to succession. Deliberately
 *   recommends the cheaper path, because the book does.
 * @permissions public
 * @relationships /deck/sales, /mastering-allyship/one-to-one, /succession,
 *   /mastering-allyship/origin
 * @dimensions WHO:reader, WHAT:offer, WHERE:mastering-allyship, ENERGY:choose
 * @example /mastering-allyship/what-comes-next
 * @agentDiscoverable true
 */
export default function WhatComesNextPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship" className="hover:text-zinc-300">
            Mastering the Game of Allyship
          </Link>
          <span aria-hidden="true"> / </span>
          <span>What comes next</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Chapter 9 sent you here
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            The village is already playing.
          </h1>
          <p className="text-base leading-relaxed text-[#a09e98]">{OPENING}</p>
        </header>

        {/* ── Path one: the deck ────────────────────────────────────────── */}
        <section className="rounded-2xl border border-emerald-700/50 bg-emerald-950/20 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            The smaller step · start here
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">The deck</h2>

          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            A hundred and twenty cards. Wake Up, Open Up, Clean Up, Grow Up and Show Up,
            crossed against gathering resources, raising awareness, direct action and skillful
            organizing, run through all six operations, one per Face. You met every one of
            them twenty at a time while you were reading.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">The private use comes first</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                Draw against the Face you have been performing, and watch what you do when the
                card names it.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">The public use comes after</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                Run it for a group. That order is the whole instruction, and reversing it is
                how the deck becomes a workshop prop.
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-zinc-400">
            This is the smaller of the two steps and the only one you can take this week. It
            costs you nothing except the willingness to sit with a card you would rather have
            shuffled back.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/deck/sales"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500"
            >
              Get the deck →
            </Link>
            <Link
              href="/deck/preview"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-5 font-bold text-zinc-200 transition-colors hover:border-zinc-500"
            >
              Read the cards first
            </Link>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Twenty-two dollars digital, sixty-nine printed.
          </p>
        </section>

        {/* ── Path two: the coaching ────────────────────────────────────── */}
        <section className="rounded-2xl border border-violet-700/50 bg-violet-950/20 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
            The larger step
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">The coaching</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            The more expensive of the two, in every sense of the word. It forks, and which
            branch you are on is usually already obvious to you.
          </p>

          <div className="mt-5 space-y-3">
            <Link
              href="/mastering-allyship/one-to-one"
              className="block rounded-xl border border-zinc-800 bg-black/30 p-5 transition-colors hover:border-violet-500"
            >
              <h3 className="text-base font-bold text-white">
                You have a Founder move, and you already know it has to be you →
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Working it through one-on-one is the fastest path I know. Not another person
                who listens — somebody in the fire with you, running the campaign at your side.
              </p>
            </Link>

            <Link
              href="/succession"
              className="block rounded-xl border border-zinc-800 bg-black/30 p-5 transition-colors hover:border-violet-500"
            >
              <h3 className="text-base font-bold text-white">
                You want the method itself →
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                To run these six Faces for other people, rather than only for what you are
                building. That is the succession I wrote the book to make possible, and it is
                the work I most want to hand off. Nothing is for sale there yet, and the page
                says so plainly.
              </p>
            </Link>
          </div>

          <a
            href="mailto:wendell@masteringallyship.com?subject=Coaching"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 font-bold text-white transition-colors hover:bg-violet-500"
          >
            wendell@masteringallyship.com
          </a>
        </section>

        <section className="rounded-2xl border border-amber-600/50 bg-amber-950/20 p-6">
          <p className="text-base font-bold leading-relaxed text-amber-200">{CLOSING}</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
            Chapter 9&apos;s recommendation, kept as written. The cheaper path is the one the
            book actually tells you to take.
          </p>
        </section>

        <p className="text-sm leading-relaxed text-zinc-500">
          Still working the drill at the end of the chapter?{' '}
          <Link
            href="/mastering-allyship/origin"
            className="text-zinc-300 underline underline-offset-4"
          >
            The Face that never came up is on its own page
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
