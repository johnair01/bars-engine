import Link from 'next/link'

/**
 * Bruised Banana residency — surface /event nights from campaign hub (BBR P3).
 * Anchors match src/app/event/BruisedBananaApr2026EventBlocks.tsx.
 */
export function ResidencyEventsCallout() {
  return (
    <section
      className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4 space-y-3"
      aria-label="Residency event nights"
    >
      <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Show up — residency nights</p>
      <p className="text-sm text-zinc-400 leading-relaxed">
        RSVP (Partiful), invite bingo, and schedule — same campaign as this hub.
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <Link
          href="/event#apr-4"
          className="inline-flex items-center justify-center rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-900/35 hover:border-amber-600/50 transition-colors min-h-[44px]"
        >
          April 4 — Dance night →
        </Link>
        <Link
          href="/event#apr-5"
          className="inline-flex items-center justify-center rounded-lg border border-violet-800/50 bg-violet-950/25 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-900/30 transition-colors min-h-[44px]"
        >
          April 5 — The Game →
        </Link>
        <Link
          href="/event"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500 transition-colors min-h-[44px]"
        >
          Full event page →
        </Link>
      </div>
    </section>
  )
}
