import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CHAPTER_ONE_LEAD_PROMISE,
  CHAPTER_ONE_LEAD_TITLE,
} from '@/lib/mastering-allyship/chapter-one-lead'

export const metadata: Metadata = {
  title: 'Chapter 1: The Call to Play',
  description: CHAPTER_ONE_LEAD_PROMISE,
}

const sections = [
  {
    eyebrow: 'Threshold',
    title: 'You have already heard the call.',
    body:
      'It is the faint signal under ordinary life: the ache that says this could be better, the moment when good intentions stop being enough, the quiet knowing that allyship has to become something you can practice.',
  },
  {
    eyebrow: 'Practice',
    title: 'Allyship is not a personality badge.',
    body:
      'It is a game of moves. You notice what is happening, choose how to show up, make one concrete move, and learn from what the move changes. The work becomes less mystical when it becomes playable.',
  },
  {
    eyebrow: 'First move',
    title: 'Name the signal and make it small enough to do.',
    body:
      'Chapter 1 begins at the place where a reader becomes a player. The first practice is not to solve everything. It is to name the signal that brought you here and choose one move you are willing to make now.',
  },
]

/**
 * @page /mastering-allyship/chapter-1/read
 * @entity CAMPAIGN
 * @description Public Chapter 1 lead-magnet reader while the polished PDF receives design.
 * @permissions public
 * @relationships delivery target for FunnelSignup source mastering-allyship-chapter-1
 * @dimensions WHO:visitor, WHAT:Chapter 1 sample, WHERE:Mastering Allyship funnel, ENERGY:wake_up
 * @example /mastering-allyship/chapter-1/read
 * @agentDiscoverable true
 */
export default function ChapterOneReadPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-10 text-[#e8e6e0] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <nav className="mb-10 text-xs text-zinc-500">
          <Link href="/mastering-allyship/chapter-1" className="hover:text-zinc-300">
            Chapter 1 opt-in
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Read</span>
        </nav>

        <header className="border-b border-zinc-800 pb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
            Mastering the Game of Allyship
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            {CHAPTER_ONE_LEAD_TITLE}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#cfcac0]">{CHAPTER_ONE_LEAD_PROMISE}</p>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            This live reader is the current delivery edition while the polished PDF receives its
            design pass. The email link stays valid as the artifact improves.
          </p>
        </header>

        <div className="space-y-10 py-10">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-500/80">
                {section.eyebrow}
              </p>
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              <p className="text-base leading-8 text-[#d6d3cd]">{section.body}</p>
            </section>
          ))}

          <section className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
              Make your first move
            </p>
            <h2 className="mt-3 text-xl font-semibold text-white">Answer the call in one sentence.</h2>
            <p className="mt-3 text-sm leading-7 text-emerald-50/80">
              What signal brought you to this work, and what is one move you are willing to make
              right now?
            </p>
          </section>
        </div>

        <footer className="border-t border-zinc-800 py-8">
          <p className="text-sm leading-7 text-zinc-400">
            The full path is simple: the book gives you the map, the Allyship Deck gives you a
            concrete move, and the Dojo or cohort path gives you practice with other people.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/launch"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500"
            >
              See the book and deck
            </Link>
            <Link
              href="/mastering-allyship/dojo"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-600/60 px-5 font-bold text-emerald-100 transition-colors hover:bg-emerald-900/30"
            >
              Explore the Dojo
            </Link>
          </div>
        </footer>
      </article>
    </main>
  )
}
