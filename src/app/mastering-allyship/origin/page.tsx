import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Your origin — Mastering the Game of Allyship',
  description:
    'The Face your history handed you and the Face you are strongest in are rarely the same one. Both quizzes name theirs; this page is where you put them side by side and date it.',
}

/**
 * Chapter 9, p309. Wendell writes this one.
 *
 * The page below carries the MECHANISM — both quizzes, the comparison, the
 * dated sheet line. What it deliberately does not carry is the book's own
 * argument for why the two Faces diverge, because that argument is on a page of
 * a book this repo does not contain, and writing a plausible version of
 * somebody else's chapter is how a product surface ends up teaching the wrong
 * thing in the author's name.
 *
 * Set this to the passage (or a re-aimed version of it) and the section
 * renders above the two quizzes. Left null, the page still works: it asks the
 * question and hands over the two instruments that answer it. Do NOT substitute
 * a bracketed placeholder — placeholders typeset, and they ship.
 */
const ORIGIN_PASSAGE: string | null = null

/**
 * @page /mastering-allyship/origin
 * @entity CAMPAIGN
 * @description The history-face vs. superpower-face page Chapter 9 p309 promises. Routes
 *   the Superpower quiz (which names a Home Face and an avoided Face) and the Myths Read
 *   into one frame, and lands on the character sheet where the pair gets dated. The
 *   book's own exposition is a typed null awaiting Wendell — see ORIGIN_PASSAGE.
 * @permissions public
 * @relationships /superpower, /mastering-allyship/myths-read, /mastering-allyship/sheet
 * @dimensions WHO:reader, WHAT:frame, WHERE:mastering-allyship, ENERGY:reflect
 * @example /mastering-allyship/origin
 * @agentDiscoverable true
 */
export default function OriginPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship" className="hover:text-zinc-300">
            Mastering the Game of Allyship
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Origin</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Chapter 9 sent you here
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Two Faces, and they are rarely the same one.
          </h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            One Face you arrived with. Something in your history rewarded it often enough that
            it became the move you make before you decide to make a move. The other is the one
            you are actually strongest in, which you can find out by measuring rather than by
            remembering.
          </p>
          <p className="text-base leading-relaxed text-[#a09e98]">
            The distance between those two is worth knowing, and it is the kind of distance
            that only shows up when both are written down on the same day.
          </p>
        </header>

        {ORIGIN_PASSAGE && (
          <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
            <p className="text-base leading-relaxed text-zinc-300">{ORIGIN_PASSAGE}</p>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Measure one</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            The Superpower quiz ranks all seven and hands you two names: the Face you lead
            with, and the Face you avoid. Chapter 9 argues the second is the more interesting
            of the pair, so the result names it rather than burying it in a ranking.
          </p>
          <Link
            href="/superpower"
            className="flex min-h-[44px] flex-col gap-1 rounded-2xl border border-violet-700/50 bg-violet-950/20 p-5 transition-colors hover:border-violet-500"
          >
            <span className="text-base font-bold text-white">Take the Superpower quiz →</span>
            <span className="text-sm leading-relaxed text-zinc-400">
              Seven ranked, a Home Face, and the one you steer around. No email required to see
              the result.
            </span>
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Remember the other</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Your history is harder to measure, so approach it sideways. The Myths Read scores
            the moves you actually make under pressure, and the myth running loudest is usually
            the one whichever Face you arrived with was hired to protect.
          </p>
          <Link
            href="/mastering-allyship/myths-read"
            className="flex min-h-[44px] flex-col gap-1 rounded-2xl border border-amber-700/50 bg-amber-950/20 p-5 transition-colors hover:border-amber-500"
          >
            <span className="text-base font-bold text-white">Take the Myths Read →</span>
            <span className="text-sm leading-relaxed text-zinc-400">
              Ten myths sorted, the loudest named, and a charge you can metabolize into a first
              move.
            </span>
          </Link>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">Then date it</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Line one of the character sheet is your Home Face and line three is your Myth. Put
            both down with today&apos;s date on them. Appendix H&apos;s argument is that across
            a year of play you can watch your Face, your shadow and your myths move, and a
            sheet with one date on it cannot show you any movement at all.
          </p>
          <Link
            href="/mastering-allyship/sheet"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-zinc-200 px-5 font-bold text-[#0a0908] transition-colors hover:bg-white"
          >
            Get the character sheet →
          </Link>
        </section>

        <p className="text-sm leading-relaxed text-zinc-500">
          Neither instrument is a verdict, and the gap between the two is not a fault to
          correct. Both are readings, and you are the authority on what they mean.
        </p>
      </div>
    </main>
  )
}
