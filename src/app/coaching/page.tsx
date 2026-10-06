import type { Metadata } from 'next'
import Link from 'next/link'

import { ThreeTwoOneDemo } from './ThreeTwoOneDemo'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Coaching with Wendell Britt',
  description:
    'Find the part of you running the thing you are stuck on, and put it to work for you. Try the 3-2-1 practice on the page, then book a session.',
}

/**
 * Every booking button on the page goes to the tier list, which holds
 * Wendell's four Calendly links (Wendell, 2026-10-06). Reading the four as
 * one session on a sliding scale is a choice (Claude, 2026-10-06), taken
 * from the link names; the copy says so.
 */
const BOOK_HREF = '#book'

const TIERS = [
  { price: '$250', href: 'https://calendly.com/wendell-britt/coaching-250' },
  { price: '$150', href: 'https://calendly.com/wendell-britt/coaching-150' },
  { price: '$75', href: 'https://calendly.com/wendell-britt/coaching-75' },
  { price: 'Pay what feels right', href: 'https://calendly.com/wendell-britt/pay-what-feels-right' },
] as const

/**
 * The practices named here are the ones already written down in the project:
 * the 3-2-1 (`tech-3-2-1`, canonical.ts), the daemon interview (Daemons from
 * Big Mind, Findings and Proposal v0, §1 and §3), and Emotional Alchemy.
 * The lineage line follows that proposal's §4: credit the source plainly and
 * keep its name off the product.
 */
const TOOLS = [
  {
    name: 'The 3-2-1',
    body: 'Take something with charge on it, a person or a part of you. Describe it, talk to it, then speak as it. What you were spending energy pushing away comes back as something you can use. You can try it below.',
  },
  {
    name: 'Interviewing your parts',
    body: 'Seven parts take the controls when nobody is steering: the Protector, the Controller, the Skeptic, the Fixer, the Emotional Body, the Victim and the Damaged Self. We interview each one like an employee. What is your job? How are the hours? How is the pay? Who do you work for? The aim is to get each one working for you.',
  },
  {
    name: 'Emotional Alchemy',
    body: 'My map of five emotional energies, what each one is for, and how each moves when it is stuck and when it is flowing. We use it to read what is live in you in a session, and to turn it into fuel for the next move.',
  },
] as const

/**
 * @page /coaching
 * @entity CAMPAIGN
 * @description Wendell's coaching page: the tools he coaches with, a working 3-2-1 that runs
 *   in the browser with no account and no AI, and four booking tiers, each linking to
 *   Wendell's Calendly. Every booking button scrolls to the tiers (BOOK_HREF).
 * @permissions public
 * @relationships /mastering-allyship/one-to-one, src/lib/coaching/three-two-one.ts,
 *   src/lib/technique-library/canonical.ts (tech-3-2-1)
 * @dimensions WHO:client, WHAT:offer, WHERE:coaching, ENERGY:clean_up
 * @example /coaching
 * @agentDiscoverable true
 */
export default function CoachingPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-14">
        <header className="space-y-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-violet-300">
            Coaching with Wendell Britt
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Find the part of you that is running the show, and give it a better job.
          </h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            Most of us know what we want and keep stalling on it. Usually a part of us is doing
            that on purpose, and it has a reason. I coach people to meet that part, hear what it is
            protecting, and put its strength to work on the thing they actually want.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <a href="#try-321" className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500">
              Try the 3-2-1 now
            </a>
            <a href={BOOK_HREF} className="text-sm font-semibold text-zinc-200 underline underline-offset-4">
              Book a session
            </a>
          </div>
        </header>

        <section className="space-y-5">
          <h2 className="text-2xl font-bold">What we work with</h2>
          <div className="space-y-4">
            {TOOLS.map((tool) => (
              <div key={tool.name} className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
                <h3 className="font-bold">{tool.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{tool.body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            The parts work draws on Voice Dialogue and the Big Mind process. The 3-2-1 comes from
            Ken Wilber&rsquo;s Integral Life Practice.
          </p>
        </section>

        <section id="try-321" className="scroll-mt-24 space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Try the 3-2-1</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              This is the same practice I use in sessions, in a form you can run alone. It moves
              something across three seats: out there (it), face to face (you), and from inside (I).
              The charge tends to build as you go, and that is the practice working.
            </p>
          </div>
          <ThreeTwoOneDemo bookHref={BOOK_HREF} />
        </section>

        <section id="book" className="scroll-mt-24 space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Book a session</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              One session with me, at four prices. You get the same session at every tier, so
              pick the one that fits what you can pay today. Bring the thing you are stuck on, or
              the 3-2-1 you just ran.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIERS.map((tier) => (
              <a
                key={tier.href}
                href={tier.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-24 flex-col justify-between rounded-2xl border border-zinc-800 bg-black/30 p-4 transition-colors hover:border-violet-400"
              >
                <span className="text-lg font-bold text-amber-200">{tier.price}</span>
                <span className="mt-3 text-sm font-semibold text-violet-200">Book &rarr;</span>
              </a>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            If you are building something with your name on it and want me alongside for the whole
            campaign, the{' '}
            <Link href="/mastering-allyship/one-to-one" className="text-zinc-200 underline underline-offset-4">
              founder track
            </Link>{' '}
            is the larger version.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 p-5 text-sm leading-relaxed text-zinc-400">
          <h2 className="font-bold text-zinc-200">Before you start</h2>
          <p className="mt-2">
            Coaching works with where you are now and your next move. It suits people who are
            steady enough to look at what is in the way. If you are in crisis, call or text 988 in
            the United States, or your local emergency number, and come back when you are on
            firmer ground.
          </p>
        </section>
      </div>
    </main>
  )
}
