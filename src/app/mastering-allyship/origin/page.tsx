import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The Face that never came up — Mastering the Game of Allyship',
  description:
    'Chapter 9 ends on a drill. Which Face answers a given moment, why the answer need not match the superpower your Face came with, and what to do with the Face that never came up at all.',
}

/**
 * Chapter 9's closing argument, quoted from the shipped trade edition.
 *
 * Kept verbatim rather than paraphrased. It is two sentences, it stands up
 * without the 300 pages in front of it, and it is the whole reason the page
 * exists — so re-aiming it would cost the thing it was brought here for.
 */
const ORIGIN_PULL_QUOTE =
  'Choosing between the Faces on a page is the easy version. The skill is choosing between them at speed, with something real at stake, while the moment is still open.'

/**
 * @page /mastering-allyship/origin
 * @entity CAMPAIGN
 * @description The page Chapter 9's closing drill points at. Its argument, from the book:
 *   the Face that answers a given moment need not match the superpower your Face came
 *   with, and the Face that never came up at all is the one worth walking toward. Routes
 *   the Superpower quiz (which already computes the avoided Face) into that frame and
 *   lands on the character sheet, where the chapter's own instruction applies — give it a
 *   name and a date, or it is a resolution.
 * @permissions public
 * @relationships /superpower, /mastering-allyship/myths-read, /mastering-allyship/sheet
 * @dimensions WHO:reader, WHAT:drill, WHERE:mastering-allyship, ENERGY:practice
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
          <span>The Face that never came up</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Chapter 9 sent you here
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            The Face that answers is not always the one you came with.
          </h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            The drill at the end of the book puts six moments in front of you and asks which
            Face answers each one. The argument sits in the aside: the answer does not have to
            match the superpower your Face came with. Six moments can come out across six
            different Faces, and that spread is a result rather than a failure.
          </p>
          <blockquote className="border-l-2 border-amber-600/60 pl-4 text-base italic leading-relaxed text-[#a09e98]">
            {ORIGIN_PULL_QUOTE}
            <footer className="mt-2 text-xs not-italic text-zinc-600">
              — <cite>Mastering the Game of Allyship</cite>, Chapter 9
            </footer>
          </blockquote>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">One · Get the Faces named</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            The drill wants you to already know the cast. The Superpower quiz ranks all seven
            and hands back two names that matter here: the Face you lead with, and the one
            sitting at the bottom of your ranking.
          </p>
          <Link
            href="/superpower"
            className="flex min-h-[44px] flex-col gap-1 rounded-2xl border border-violet-700/50 bg-violet-950/20 p-5 transition-colors hover:border-violet-500"
          >
            <span className="text-base font-bold text-white">Take the Superpower quiz →</span>
            <span className="text-sm leading-relaxed text-zinc-400">
              Seven ranked, the Face you lead with, and the one you steer around. The result
              reads without an email address.
            </span>
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Two · Go to the one that never came up</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            This is the instruction the chapter closes on, and it is the reason the quiz names
            your bottom-ranked Face out loud instead of leaving it buried in a spectrum. Open
            that Face&apos;s chapter. Find the one move you have never run in your life. Put it
            against the cause you named as your quest back in Chapter 1.
          </p>
          <div className="rounded-2xl border border-amber-600/50 bg-amber-950/20 p-5">
            <p className="text-base font-bold leading-relaxed text-amber-200">
              Give it a name and a date, or it is a resolution.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
              Chapter 9&apos;s words, and the reason the next section exists rather than a
              button that says &ldquo;commit&rdquo;.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">Three · Write it where the date sticks</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Line one of the character sheet is your Home Face and line three is your Myth. The
            move you just named goes down beside them, dated. Appendix H asks you to re-fill
            the sheet across a year for the same reason Chapter 9 asks you to run the drill
            again in three months: a sheet carrying one date cannot show you movement.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/mastering-allyship/sheet"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-zinc-200 px-5 font-bold text-[#0a0908] transition-colors hover:bg-white"
            >
              Get the character sheet →
            </Link>
            <Link
              href="/mastering-allyship/myths-read"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-5 font-bold text-zinc-200 transition-colors hover:border-zinc-500"
            >
              Fill line three →
            </Link>
          </div>
        </section>

        <p className="text-sm leading-relaxed text-zinc-500">
          Re-run the drill in three months with moments from your own week rather than the
          book&apos;s. Choosing on a page stays the easy version, and the sheet is how you find
          out whether the choosing got faster.
        </p>
      </div>
    </main>
  )
}
