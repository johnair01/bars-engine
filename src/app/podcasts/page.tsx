import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Podcasts — Wendell Britt',
  description:
    'Two directions on one page: book Wendell on your show, or let him introduce you to somebody worth having on instead. Topics, formats, bio and headshot below.',
}

const TOPICS = [
  {
    title: 'Allyship is a game, and most people are playing the unwinnable version',
    detail:
      'The core argument of the book. Why a verdict on your goodness cannot be practiced, and what a move is instead. Works as a whole episode or as the first ten minutes.',
  },
  {
    title: 'The ten myths',
    detail:
      'Chapter 1 takes apart ten claims about allyship, and the first one is the master the other nine are versions of. Hosts tend to have opinions about at least three, which makes for a better conversation than agreement.',
  },
  {
    title: 'Building the book badly, in public',
    detail:
      'I raised money for a book about allyship and then built it out of scarcity and self-punishment, which made me a worse ally while I did it. That story is in the book because leaving it out would have proved the book wrong.',
  },
  {
    title: 'Six Faces, and the one you avoid',
    detail:
      'The roles people take in a conflict, and why the Face somebody avoids is more diagnostic than the one they lead with. Good for shows whose audience already knows a typology and is tired of it.',
  },
  {
    title: 'Games, IFS and shadow work in the same sentence',
    detail:
      'For the deeper-end shows. How a game designer ends up using parts work, and why a scoreboard is the wrong instrument for a practice.',
  },
] as const

const FORMATS = [
  'Remote, on your platform. I record locally if you want a clean track.',
  'In person in Portland, Oregon.',
  'Solo interview, co-host, or panel. Panels want a real disagreement on the table.',
  'Live audience, if the format holds a practice segment.',
] as const

/**
 * @page /podcasts
 * @entity CAMPAIGN
 * @description Podcast page carrying two directions on one surface: book Wendell, or
 *   take an introduction to a practitioner who fits the audience better. The second
 *   exists because a page that only extracts bookings fails the book's own argument,
 *   and it is disclosed in the first screen alongside the first rather than offered as
 *   a consolation after a no. Bio facts are sourced from the sales letter and the
 *   handoff's facts ledger; no fee applies to appearing on a show.
 * @permissions public
 * @relationships /speaking (paid events), /mastering-allyship, public/mastering-allyship/wendell.jpg
 * @dimensions WHO:host, WHAT:offer, WHERE:podcasts, ENERGY:invite
 * @example /podcasts
 * @agentDiscoverable true
 */
export default function PodcastsPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship" className="hover:text-zinc-300">
            Mastering the Game of Allyship
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Podcasts</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            For podcast hosts and producers
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Book me, or let me hand you somebody better.
          </h1>
          {/* Both asks disclosed in the first screen, per the handoff's disclosure rule. */}
          <p className="text-base leading-relaxed text-[#a09e98]">
            Two directions, and you can take either. The first is the ordinary one: I come on
            your show. The second is the one I would rather you knew about, which is that if I
            am wrong for your audience I will introduce you to somebody who is right for it,
            and expect nothing back.
          </p>
        </header>

        {/* ── Direction one ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">One · Have me on</h2>

          <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-black/30 p-6 sm:flex-row sm:items-start">
            <Image
              src="/mastering-allyship/wendell.jpg"
              alt="Wendell Britt"
              width={132}
              height={132}
              className="h-[132px] w-[132px] flex-none rounded-2xl object-cover"
            />
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-zinc-300">
                Wendell Britt wrote <em>Mastering the Game of Allyship</em>, a 383-page argument
                that allyship is a set of practicable moves rather than a verdict on who you
                are. He ran DEI and inclusivity at Blue Sky Studios, has built and taught
                allyship curriculum for years, and designs games for a living. He is trained in
                IFS, shadow work, Integral and Jungian practice, and he lives in Portland,
                Oregon.
              </p>
              <p className="text-sm leading-relaxed text-zinc-400">
                Three hundred seventy-one people funded the book before it existed and then
                waited while he learned, publicly, that you cannot build a book about allyship
                out of scarcity without becoming a worse ally while you do it. That story is in
                the book, and he will tell it on air.
              </p>
              <a
                href="/mastering-allyship/wendell.jpg"
                download
                className="inline-block text-sm text-amber-200 underline underline-offset-4"
              >
                Download the headshot →
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold">Topics that have legs</h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              Pick one and I will shape it to your audience. Telling me who listens is worth
              more than telling me how long the episode runs.
            </p>
            {TOPICS.map((topic) => (
              <div key={topic.title} className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
                <h4 className="text-base font-bold text-white">{topic.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{topic.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
            <h3 className="text-lg font-bold">Formats</h3>
            <ul className="mt-3 space-y-2">
              {FORMATS.map((format) => (
                <li key={format} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
                  <span aria-hidden className="text-zinc-600">
                    ·
                  </span>
                  {format}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              No fee to come on a show. Booking me to speak at an event is a different
              arrangement and{' '}
              <Link href="/speaking" className="text-zinc-300 underline underline-offset-4">
                its fees are on the speaking page
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ── Direction two ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-6">
          <h2 className="text-2xl font-bold">Two · Let me introduce you to somebody else</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            I know practitioners who have been doing this work far longer than I have been
            writing about it, and several of them have never been on a show. If your audience
            would be better served by one of them than by me, say so and I will make the
            introduction. You do not have to book me first, and you do not owe me an episode
            afterward.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Tell me who listens to you and what you have already covered, and I will tell you
            who I would send. If nobody I know fits, I will say that too rather than reaching
            for a name.
          </p>
        </section>

        <section className="rounded-2xl border border-amber-600/40 bg-amber-950/20 p-6">
          <h2 className="text-lg font-bold">The ask</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            One address, answered by me. Say which of the two you want, who your audience is,
            and roughly when. A reply from this address is always a person.
          </p>
          <a
            href="mailto:wendell@masteringallyship.com?subject=Podcast"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-600 px-5 font-bold text-black transition-colors hover:bg-amber-500"
          >
            wendell@masteringallyship.com
          </a>
        </section>
      </div>
    </main>
  )
}
