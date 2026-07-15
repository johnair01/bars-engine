import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '1:1 Allyship Work — Mastering the Game of Allyship',
  description:
    'Work directly with Wendell to apply the allyship engine to a real relationship, project, or leadership moment.',
}

export default function OneToOneOfferPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship/chapter-1" className="hover:text-zinc-300">
            Chapter 1
          </Link>
          <span aria-hidden="true"> / </span>
          <span>1:1 work</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
            High-touch practice
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Turn the situation you are carrying into a practice plan.
          </h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            1:1 work is for people who want direct support applying the allyship engine to a real
            relationship, leadership challenge, creative project, or community responsibility.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">First live version</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            This route now exists as the downstream premium offer destination. The next pass can add
            application questions, booking, pricing, and intake prompts.
          </p>
          <Link
            href="/mastering-allyship/dojo"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500"
          >
            Compare with the Dojo →
          </Link>
        </section>
      </div>
    </main>
  )
}
