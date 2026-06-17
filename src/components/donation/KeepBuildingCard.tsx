import Link from 'next/link'
import type { KeepBuildingGuidance } from '@/lib/event/barn-raising'

/**
 * FR6 — "keep building" redirect. Shown after a self-report tops off a barn wall:
 * celebrates the filled wall and points the giver to the next plank (other open walls,
 * then in-kind, then access). Presentational; guidance is computed server-side.
 *
 * @see .specify/specs/barn-raising-live-data/spec.md (FR6)
 */
export function KeepBuildingCard({ guidance }: { guidance: KeepBuildingGuidance }) {
  return (
    <section className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-5 text-amber-100">
      <h3 className="text-base font-bold text-amber-200">{guidance.title}</h3>
      <p className="mt-1 text-sm text-amber-100/80">{guidance.message}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {guidance.actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="min-h-[44px] rounded-lg border border-amber-700/60 bg-amber-900/30 px-4 py-2.5 text-center text-sm font-semibold text-amber-100 transition-colors hover:border-amber-500 hover:bg-amber-900/50"
          >
            {a.label} →
          </Link>
        ))}
      </div>
    </section>
  )
}
