import Link from 'next/link'

export default function LensesPage() {
  const calendlyUrl = process.env.NEXT_PUBLIC_LENSES_CALENDLY_URL ?? '/lenses/onboarding'

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-10 text-[#e8e6e0]">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#a855f7]">Lenses</p>
          <h1 className="text-4xl font-black leading-tight">Imagine the year you are moving toward.</h1>
          <p className="max-w-xl text-sm leading-7 text-[#a09e98]">
            Lenses turns vague desire into an authored year frame across Relationships, Career, Money,
            Health, and Allyship. Daily execution stays in Tap the Vein.
          </p>
        </header>

        <section className="rounded-xl border border-white/10 bg-[#1a1a18] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <h2 className="text-xl font-bold">Start the Lenses intake</h2>
          <p className="mt-3 text-sm leading-7 text-[#a09e98]">
            Give yourself about an hour if you want to complete the full year-frame ritual in one sitting.
            You can also save the frame and return to descend it later.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lenses/onboarding"
              className="inline-flex items-center justify-center rounded-lg bg-[#7c3aed] px-5 py-3 font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.35)]"
            >
              Begin Lenses
            </Link>
            <Link
              href="/lenses/descent"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-5 py-3 font-bold text-[#e8e6e0]"
            >
              Continue descent
            </Link>
            <Link
              href="/tap-the-vein"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-5 py-3 font-bold text-[#e8e6e0]"
            >
              Tap the Vein
            </Link>
            <a
              href={calendlyUrl}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-5 py-3 font-bold text-[#d8b4fe]"
            >
              Schedule guided support
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
