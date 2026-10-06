import type { Metadata } from 'next'
import Link from 'next/link'

import { ThreeTwoOneDemo } from './ThreeTwoOneDemo'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Coaching with Wendell Britt',
  description:
    'Find the part of you running the thing you are stuck on, and put it to work for you. Try the 3-2-1 practice on the page, then book a free call.',
}

/**
 * Where "book a free call" goes. A mailto until Wendell names a booking link;
 * swap the string and every button on the page follows. (Choice, Claude,
 * 2026-10-06: the address is the one the site footer already publishes.)
 */
const BOOK_HREF = 'mailto:wendell@masteringallyship.com?subject=Coaching%20%E2%80%94%20free%20call'

/**
 * Prices are Wendell's to set, the same rule `/mastering-allyship/one-to-one`
 * follows with COACHING_RATE. Set a string and it renders on the offer card;
 * left null, the card says the number comes back in the first reply.
 */
const PRICES: Record<'session' | 'coaching', string | null> = {
  session: null,
  coaching: null,
}

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

const PATHS = [
  {
    name: 'A free call',
    price: 'Free',
    body: 'Bring the thing you are stuck on, or the 3-2-1 you just ran. We find out whether working together fits, and you leave with at least one move.',
  },
  {
    name: 'One facilitated session',
    price: PRICES.session,
    body: 'Ninety minutes. I walk you through the full sequence of parts, live, including the ones that are better met with someone beside you.',
  },
  {
    name: 'Ongoing coaching',
    price: PRICES.coaching,
    body: 'Regular sessions while you take on something real: a change at work, a relationship, a project with your name on it. We use these tools on what comes up week to week.',
  },
] as const

/**
 * @page /coaching
 * @entity CAMPAIGN
 * @description Wendell's coaching page: the tools he coaches with, a working 3-2-1 that runs
 *   in the browser with no account and no AI, and three ways to work together, ending in a
 *   free call. Prices render once Wendell sets PRICES; the booking link is BOOK_HREF.
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
              Book a free call
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

        <section className="space-y-5">
          <h2 className="text-2xl font-bold">Ways to work together</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {PATHS.map((path) => (
              <div key={path.name} className="flex flex-col rounded-2xl border border-zinc-800 bg-black/30 p-5">
                <h3 className="font-bold">{path.name}</h3>
                <p className="mt-1 text-sm font-semibold text-amber-200">
                  {path.price ?? 'Price in my first reply'}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{path.body}</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Every path starts with the free call.{' '}
            <a href={BOOK_HREF} className="text-zinc-200 underline underline-offset-4">
              Write to me to set one up
            </a>
            . If you are building something with your name on it and want me alongside for the
            whole campaign, the{' '}
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
