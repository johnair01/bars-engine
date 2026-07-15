import type { Metadata } from 'next'
import Link from 'next/link'
import { ChapterOneLeadForm } from './ChapterOneLeadForm'
import { stageForKey } from '@/lib/launch/funnel'

export const metadata: Metadata = {
  title: 'Read Chapter 1 — Mastering the Game of Allyship',
  description:
    'Get the first chapter of Mastering the Game of Allyship and begin practicing allyship as a learnable game.',
}

export default function MasteringAllyshipChapterOnePage() {
  const stage = stageForKey('chapter_one_lead')

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <nav className="text-xs text-zinc-500">
            <Link href="/mastering-allyship/hub" className="hover:text-zinc-300">
              Mastering Allyship
            </Link>
            <span aria-hidden="true"> / </span>
            <span>Chapter 1</span>
          </nav>

          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
              Free first chapter
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Start the book where allyship becomes practice.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[#a09e98]">
              {stage.promise}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['1', 'Download Chapter 1'],
              ['2', 'Buy the full book'],
              ['3', 'Practice with the deck, Dojo, or 1:1 work'],
            ].map(([n, label]) => (
              <div key={n} className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                <div className="text-2xl font-bold text-emerald-300">{n}</div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{label}</p>
              </div>
            ))}
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            The polished Chapter 1 PDF downloads immediately after signup. A live reader remains
            available as a fallback while the full launch funnel grows.
          </p>
        </section>

        <aside className="space-y-4">
          <ChapterOneLeadForm />
          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5 text-sm leading-relaxed text-zinc-400">
            <p className="font-semibold text-zinc-200">What happens after Chapter 1?</p>
            <p className="mt-2">
              You will be invited into the full book, the $22 Allyship Deck upsell, and the live
              practice paths: the weekly Allyship Dojo or 1:1 work with Wendell.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
