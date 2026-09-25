import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BARN_WALLS,
  RUNWAY_HORIZON_CENTS,
  formatMoneyCents,
} from '@/lib/event/barn-raising'

export const metadata: Metadata = {
  title: 'Support the work',
  description:
    'Money here goes to a person rather than to an organization, and is not tax-deductible. The car, the monthly runway, and the ways to help that cost no money at all.',
}

/**
 * The two walls this page speaks for. Read from the barn config rather than
 * retyped, so the targets cannot drift between the barn and this page.
 *
 * `presale` is excluded on purpose: buying a book is commerce and belongs on
 * the storefront. This page is for the asks that give you nothing back.
 */
const CAR = BARN_WALLS.find((w) => w.key === 'car')!
const RUNWAY = BARN_WALLS.find((w) => w.key === 'runway')!

const IN_KIND = [
  {
    title: 'A car lead',
    detail:
      'Somebody selling something reliable, or a mechanic who will look at one before money changes hands.',
  },
  {
    title: 'An introduction',
    detail:
      'To a venue, a host, a show, or a person who books the kind of talk described on the speaking page.',
  },
  {
    title: 'Space, or hours',
    detail:
      'A place to run a stop, or the production work that makes one happen. Both are worth more than their cash equivalent, and neither costs you cash.',
  },
] as const

/**
 * @page /support
 * @entity CAMPAIGN
 * @description The personal-need ask, off the storefront and on its own page, per the site
 *   handoff's rule. **Money here goes to a person and is not tax-deductible** — the
 *   in-formation organization takes none, and that distinction is the first block on the
 *   page rather than a footnote. Lists the car and the monthly runway (both read from
 *   barn-raising so targets cannot drift), then the three kinds of help that cost nothing.
 *   Deliberately excludes the pre-sale: buying a book is commerce and lives on the
 *   storefront.
 * @permissions public
 * @relationships /campaign/the-crossing, /event/donate, /nonprofit, /speaking,
 *   src/lib/event/barn-raising.ts
 * @dimensions WHO:supporter, WHAT:ask, WHERE:support, ENERGY:gift
 * @example /support
 * @agentDiscoverable true
 */
export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Support
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            This one goes to a person.
          </h1>

          {/* The disclosure leads, because the nonprofit page exists and a reader
              could reasonably assume the two pages ask for the same kind of money. */}
          <div className="rounded-2xl border border-amber-600/50 bg-amber-950/25 p-5">
            <p className="text-sm font-bold leading-relaxed text-amber-200">
              Money given here reaches me directly and is not tax-deductible.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-amber-100/80">
              The organization is still in formation and accepts nothing at all.{' '}
              <Link href="/nonprofit" className="underline underline-offset-4">
                Its page says where that stands
              </Link>
              . Keeping the two apart matters more than making either easier to give to.
            </p>
          </div>

          <p className="text-base leading-relaxed text-[#a09e98]">
            Buying the book or the deck is a different act with a different page, and you get
            an object at the end of it. Everything below gives you nothing back, which is why
            it sits here rather than on the storefront.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">The car</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            {CAR.blurb} The whole target is{' '}
            {formatMoneyCents(CAR.targetCents)}, and it covers the vehicle, tax, title,
            registration, an inspection before money moves, and the margin that keeps a cheap
            car from becoming a second problem.
          </p>
          <Link
            href="/campaign/the-crossing"
            className="flex min-h-[44px] flex-col gap-1 rounded-2xl border border-amber-700/50 bg-amber-950/20 p-5 transition-colors hover:border-amber-500"
          >
            <span className="text-base font-bold text-white">The Crossing →</span>
            <span className="text-sm leading-relaxed text-zinc-400">
              Money is one path of several. The campaign asks what you actually have before it
              asks for a number.
            </span>
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">The runway</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Monthly rather than one-time. {formatMoneyCents(RUNWAY.targetCents, 'month')} is the
            near target and {formatMoneyCents(RUNWAY_HORIZON_CENTS, 'month')} is the horizon at
            which this work stops competing with paid work for the same hours. A recurring five
            dollars is worth more here than a one-time fifty, and it is the least exciting
            sentence on this page.
          </p>
          <Link
            href={RUNWAY.cta.href}
            className="flex min-h-[44px] flex-col gap-1 rounded-2xl border border-violet-700/50 bg-violet-950/20 p-5 transition-colors hover:border-violet-500"
          >
            <span className="text-base font-bold text-white">{RUNWAY.cta.label} →</span>
            <span className="text-sm leading-relaxed text-zinc-400">
              Cancel it whenever you want, and nobody will write to ask why.
            </span>
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Help that costs no money</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            None of these three is a consolation option. Two of them have moved this further
            than money has.
          </p>
          {IN_KIND.map((item) => (
            <div key={item.title} className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.detail}</p>
            </div>
          ))}
          <a
            href="mailto:wendell@masteringallyship.com?subject=Support"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-5 font-bold text-zinc-200 transition-colors hover:border-zinc-500"
          >
            wendell@masteringallyship.com
          </a>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">You do not owe this</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Reading the book and running one move from it is a complete way to be involved,
            and it costs nothing after the book itself. Nobody who gives here gets a better
            version of anything, and nobody who does not is missing one. Nothing here has a tier, a
            badge, or a list of names.
          </p>
        </section>
      </div>
    </main>
  )
}
