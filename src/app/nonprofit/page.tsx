import type { Metadata } from 'next'
import Link from 'next/link'
import { NonprofitFoundingCircle } from './NonprofitFoundingCircle'

export const metadata: Metadata = {
  title: 'The organization, in formation',
  description:
    'Not yet incorporated, no 501(c)(3) determination, and accepting no money. What it needs right now is people: a founding circle, governance help, legal skills, and a first program site.',
}

/**
 * Wendell writes this one. It is the paragraph saying what the organization is
 * FOR, and it is deliberately not written by anybody else — inventing a
 * nonprofit's purpose on its behalf is how an org ends up with a mission it has
 * to live up to and never agreed to.
 *
 * Set it to a string and the section renders. Left null, the page simply does
 * not claim a purpose, which is truthful and ships safely. Do NOT substitute a
 * bracketed placeholder: placeholders typeset, and they ship.
 */
const PURPOSE_PARAGRAPH: string | null = null

const NEEDS = [
  {
    title: 'A founding circle',
    detail:
      'The handful of people who agree to be in on it before it is real. This is the one that unblocks the others.',
  },
  {
    title: 'Board and governance help',
    detail:
      'Somebody who has sat on a small board and knows what bylaws, conflict-of-interest policy and a first meeting actually require.',
  },
  {
    title: 'Incorporation and legal skills',
    detail:
      'Filing the articles, and the 501(c)(3) application after that. Pointing at the right form counts as help.',
  },
  {
    title: 'A first program site',
    detail:
      'One place willing to run the work with real people. A program that has run once is worth more than a plan that reads well.',
  },
] as const

/**
 * @page /nonprofit
 * @entity CAMPAIGN
 * @description The organization, in formation — not incorporated, no 501(c)(3)
 *   determination, and **accepting no money**. The disclosure sits above the fold
 *   rather than in a footnote, because a page that reads like a charity while the
 *   charity does not legally exist is the exact move this project's book spends nine
 *   chapters teaching people to spot. Asks for founding circle, governance, legal
 *   help and a first program site.
 * @permissions public
 * @relationships FunnelSignup (intent: nonprofit), Kit tag source:nonprofit, /awaken
 * @dimensions WHO:visitor, WHAT:org state, WHERE:nonprofit, ENERGY:honest_state
 * @example /nonprofit
 * @agentDiscoverable true
 */
export default function NonprofitPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
            The organization
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">In formation.</h1>

          {/* The disclosure goes above everything, not below the ask. */}
          <div className="rounded-2xl border border-amber-600/50 bg-amber-950/25 p-5">
            <p className="text-sm font-bold leading-relaxed text-amber-200">
              The articles are unfiled and the 501(c)(3) application is unmade, so this
              organization does not legally exist yet. It takes no money today, and a gift made
              now would not be tax-deductible, because nothing exists yet to deduct against.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-amber-100/80">
              Everything below describes work that has not happened yet. When that changes, this
              box changes before anything else on the page does.
            </p>
          </div>

          {PURPOSE_PARAGRAPH && (
            <p className="text-base leading-relaxed text-[#a09e98]">{PURPOSE_PARAGRAPH}</p>
          )}
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">What it needs, in order</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            All four are people rather than money, which is accurate and also convenient,
            since taking money is the one option that stays closed until the paperwork clears.
          </p>
          {NEEDS.map((need, index) => (
            <div key={need.title} className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tabular-nums text-zinc-600">{index + 1}</span>
                <h3 className="text-base font-bold text-white">{need.title}</h3>
              </div>
              <p className="mt-2 pl-7 text-sm leading-relaxed text-zinc-400">{need.detail}</p>
            </div>
          ))}
        </section>

        <NonprofitFoundingCircle />

        <p className="text-sm leading-relaxed text-zinc-500">
          Money for the press run and the book tour is a separate matter, goes to a person
          rather than an organization, and says so.{' '}
          <Link href="/campaign/the-crossing" className="text-zinc-300 underline underline-offset-4">
            That lives at The Crossing
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
