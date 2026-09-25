import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Igniting Joy — Wendell Britt',
  description:
    'Transforming Anger’s Fire into Joy Through Humor. Anger read as a signal rather than a problem, and humor used to transform it rather than to cope with it. Digital only.',
}

/**
 * Same convention as `src/lib/launch/offers.ts`: the Gumroad URL comes from the
 * environment, and an absent URL renders "setup pending" rather than a dead
 * link.
 *
 * That convention earns its keep here specifically. The only URL for this book
 * anywhere in the repo is in a Twine source file and reads
 * `.../l/IgnnitingJoy` — with a doubled N — which is either the real slug or a
 * typo, and the egress proxy in this environment cannot reach gumroad.com to
 * settle it. Shipping an unverified link would be the exact defect the book
 * repo's own post-mortem names: checking that a bookmark is *where we put it*
 * rather than that *the page it opens says what it says*.
 *
 * Set NEXT_PUBLIC_GUMROAD_IGNITING_JOY_URL to the address you get by clicking
 * through from Gumroad itself.
 */
const IGNITING_JOY_URL = process.env.NEXT_PUBLIC_GUMROAD_IGNITING_JOY_URL ?? ''

/**
 * Excerpted from the book's own long-form blurb and re-aimed for the web, per
 * the handoff's instruction to excerpt rather than compose cold. The claims and
 * the phrasing are his; the glued em-dashes and the emoji bullets are not, and
 * the house style sheet retires both.
 */
const TEACHES = [
  'Recognize anger as a signal rather than a problem.',
  'Use humor to transform the charge instead of to cope with it.',
  'Move from frustration to a joy you can sustain, so you keep showing up without burning out.',
] as const

/**
 * @page /igniting-joy
 * @entity CAMPAIGN
 * @description The other book — *Igniting Joy: Transforming Anger's Fire into Joy Through
 *   Humor*, digital only. Copy is excerpted from Wendell's own blurb in the Twine source
 *   and re-aimed to the house style. **Says nothing about the app bundle**: the handoff
 *   forbids app copy on book-facing pages until that question is ruled on, and the
 *   brainstorm that bundles this book with a subscription is not a ruling.
 * @permissions public
 * @relationships /mastering-allyship, NEXT_PUBLIC_GUMROAD_IGNITING_JOY_URL
 * @dimensions WHO:reader, WHAT:offer, WHERE:igniting-joy, ENERGY:transmute
 * @example /igniting-joy
 * @agentDiscoverable true
 */
export default function IgnitingJoyPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            The other book
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Igniting Joy</h1>
          <p className="text-lg leading-relaxed text-[#a09e98]">
            Transforming Anger&apos;s Fire into Joy Through Humor.
          </p>
          <p className="text-base leading-relaxed text-[#a09e98]">
            What if the energy behind your anger was not something to suppress, but something
            to transform? What if humor could alchemize frustration into fuel?
          </p>
        </header>

        <section className="space-y-3">
          <p className="text-base leading-relaxed text-zinc-300">
            This book is not about pretending everything is fine. It is about harnessing the
            raw, untamed energy of anger and channeling it into something that fuels action,
            connection, and creative power.
          </p>
          <h2 className="pt-2 text-lg font-bold">What it teaches</h2>
          <ul className="space-y-2">
            {TEACHES.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
                <span aria-hidden className="text-amber-500/70">
                  ◆
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="pt-2 text-base leading-relaxed text-zinc-300">
            If you are ready to turn rage into laughter-fueled momentum, this is your guide.
          </p>
        </section>

        <section className="rounded-2xl border border-amber-600/40 bg-amber-950/20 p-6">
          <h2 className="text-lg font-bold">Get it</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Digital only, and no print edition is planned.
          </p>
          {IGNITING_JOY_URL ? (
            <a
              href={IGNITING_JOY_URL}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-600 px-5 font-bold text-black transition-colors hover:bg-amber-500"
            >
              Buy Igniting Joy →
            </a>
          ) : (
            /* Honest rather than dead: the same shape offers.ts uses for an
               offer whose checkout is not wired yet. */
            <p className="mt-4 text-sm leading-relaxed text-amber-100/80">
              The checkout link is not wired up on this page yet. Write to{' '}
              <a
                href="mailto:wendell@masteringallyship.com?subject=Igniting%20Joy"
                className="underline underline-offset-4"
              >
                wendell@masteringallyship.com
              </a>{' '}
              and I will send you the direct one.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">How it sits beside the other one</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Both books run on the same engine: a charge you are already carrying, metabolized
            into something you can use rather than managed until it stops bothering you.
            Igniting Joy points that engine at anger.{' '}
            <Link href="/mastering-allyship" className="text-zinc-300 underline underline-offset-4">
              Mastering the Game of Allyship
            </Link>{' '}
            points it at the moves you make with other people. Neither one needs the other, and
            reading them in either order works.
          </p>
        </section>
      </div>
    </main>
  )
}
