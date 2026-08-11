import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '1:1 coaching — Mastering the Game of Allyship',
  description:
    'The larger of Chapter 9’s two paths. For a Founder move you already know has to be you. Application-based, priced after a conversation, and the book says outright that none of it is required.',
}

/**
 * Wendell sets this. `src/lib/launch/offers.ts` has carried the same note since
 * the offer was defined: the coaching is application-based rather than a
 * fixed-price checkout, and the number is his.
 *
 * Set it to a string (e.g. '$X a month, three months minimum') and the rate
 * renders in place of the no-number paragraph. Left null, the page states
 * plainly that a number comes back in the first reply, which is what actually
 * happens with application-based work and is not the same as hiding it.
 */
const COACHING_RATE: string | null = null

/**
 * From the book's closing page, quoted in the site handoff as the register the
 * whole site is meant to hold. It earns its place on this page specifically:
 * this is the most expensive thing offered anywhere on the site, and conceding
 * the alternative is the move that makes the offer trustworthy rather than the
 * move that costs it a sale.
 */
const NONE_OF_IT_IS_REQUIRED =
  'None of it is required. You can run the rest alone, with this book and whatever your own Forest teaches you, and people do, and it takes longer.'

const INCLUDED = [
  '1:1 with me, for the length of the engagement',
  'The deck and digital book access, if you do not already have them',
  'The deprogramming, done with a partner rather than alone',
] as const

/**
 * @page /mastering-allyship/one-to-one
 * @entity CAMPAIGN
 * @description The Founder branch of Chapter 9's coaching path — the larger of the two
 *   paths and the most expensive offer on the site. Replaces a stub that shipped the
 *   implementation backlog as customer copy. Application-based by design, so the page
 *   says why there is no list price rather than hiding one; COACHING_RATE renders a
 *   number once Wendell sets it. Carries the book's own concession that none of it is
 *   required, because an offer this size is only trustworthy beside the alternative.
 * @permissions public
 * @relationships /mastering-allyship/what-comes-next, /succession, /deck/sales,
 *   src/lib/launch/offers.ts (key: coaching)
 * @dimensions WHO:founder, WHAT:offer, WHERE:mastering-allyship, ENERGY:commit
 * @example /mastering-allyship/one-to-one
 * @agentDiscoverable true
 */
export default function OneToOnePage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship/what-comes-next" className="hover:text-zinc-300">
            What comes next
          </Link>
          <span aria-hidden="true"> / </span>
          <span>1:1</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-violet-300">
            Chapter 9 · the larger path
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            For when you already know it has to be you.
          </h1>
          {/* The ask is named in the first screen: this is an application, and it costs money. */}
          <p className="text-base leading-relaxed text-[#a09e98]">
            This is the one only I do. Not another person who will listen — somebody in the
            fire with you, running the campaign at your side. Together we find the parts still
            loyal to the old rules and turn the saboteurs into allies.
          </p>
          <p className="text-base leading-relaxed text-[#a09e98]">
            You apply rather than check out, and this costs more than anything else on the
            site. Both facts belong here rather than three emails from now.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Who it is for</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Chapter 9 draws the line, and it is narrower than &ldquo;anyone who wants
            support&rdquo;. You have a Founder move — a campaign, an organization, a repair
            that has your name on it — and you already know it has to be you. If you are still
            deciding whether it has to be you, the deck answers that question for the price of
            a deck.
          </p>
          <h2 className="text-lg font-bold">Who it is not for</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Wanting the method itself, to run these six Faces for other people rather than for
            what you are building, is a different path with a different page. Nothing is for
            sale on it yet, and it says so.{' '}
            <Link href="/succession" className="text-zinc-300 underline underline-offset-4">
              That one is succession
            </Link>
            .
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">What is included</h2>
          <ul className="mt-3 space-y-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
                <span aria-hidden className="text-zinc-600">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-amber-600/40 bg-amber-950/20 p-6">
          <h2 className="text-lg font-bold">What it costs</h2>
          {COACHING_RATE ? (
            <p className="mt-3 text-base font-bold leading-relaxed text-amber-200">
              {COACHING_RATE}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-amber-100/90">
              No list price, because the shape varies with what you are building and how long
              it takes. A number comes back in my first reply, before you have spent anything
              except the message. If it is out of reach, say the figure you do have and I will
              tell you honestly whether it fits, rather than negotiating you upward.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Before you write</h2>
          <blockquote className="border-l-2 border-zinc-700 pl-4 text-base italic leading-relaxed text-[#a09e98]">
            {NONE_OF_IT_IS_REQUIRED}
            <footer className="mt-2 text-xs not-italic text-zinc-600">
              — <cite>Mastering the Game of Allyship</cite>, closing page
            </footer>
          </blockquote>
          <p className="text-sm leading-relaxed text-zinc-400">
            I am saying so plainly because you just spent a whole book learning to spot that
            move when somebody else makes it. The deck is the cheaper path and the one the
            book tells you to take first.{' '}
            <Link href="/deck/sales" className="text-zinc-300 underline underline-offset-4">
              It begins the moment you open the box
            </Link>
            .
          </p>
        </section>

        <section className="rounded-2xl border border-violet-700/50 bg-violet-950/20 p-6">
          <h2 className="text-lg font-bold">Apply</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            One address, answered by me. Tell me what you are building, what has already
            stalled on it, and what you have tried. Three paragraphs beats three pages. A reply
            from this address is always a person.
          </p>
          <a
            href="mailto:wendell@masteringallyship.com?subject=1%3A1%20application"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 font-bold text-white transition-colors hover:bg-violet-500"
          >
            wendell@masteringallyship.com
          </a>
        </section>
      </div>
    </main>
  )
}
