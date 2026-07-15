import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Allyship Dojo — Mastering the Game of Allyship',
  description:
    'A weekly practice community for turning allyship from idea into real-world conversation practice.',
}

export default function AllyshipDojoOfferPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship/chapter-1" className="hover:text-zinc-300">
            Chapter 1
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Allyship Dojo</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
            Flagship weekly program
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Bring one real conversation.</h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            The Allyship Dojo is a weekly practice community where each session teaches one concrete
            move for staying in partnership while creating meaningful change.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">First live version</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            This page is now a real route in the funnel. The next implementation pass will add dates,
            registration, pricing, and the workshop-specific practice prompt.
          </p>
          <Link
            href="/mastering-allyship/chapter-1"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500"
          >
            Start with Chapter 1 →
          </Link>
        </section>
      </div>
    </main>
  )
}
