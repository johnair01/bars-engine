'use client'

/**
 * SuperpowerReveal — the discovery result surface (campaign Phase 2, FR7;
 * quiz-design Phase 3, FR7/T3.2).
 *
 * Renders a scored result as a lens, not a verdict: primary + secondary + a
 * visible margin band + the primary's shadow + the mechanism disclosure. NO email
 * gate. UI_COVENANT: CultivationCard for the card aesthetic (element=color via the
 * superpower's channel; altitude=confidence), Tailwind for layout only — zero
 * hardcoded hex.
 */
import Link from 'next/link'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { SUPERPOWER_DEFS } from '@/lib/superpowers/types'
import type { SuperpowerRoutingResult } from '@/lib/superpowers/routing'
import type { ResultCopy } from '@/lib/superpowers/quiz/descriptions'

export interface SuperpowerRevealProps {
  routing: SuperpowerRoutingResult
  copy: ResultCopy
}

const ORIENTATION_LABEL = {
  internal: 'Internal — self-allyship',
  external: 'External — world-facing allyship',
} as const

export function SuperpowerReveal({ routing, copy }: SuperpowerRevealProps) {
  const primaryDef = SUPERPOWER_DEFS[routing.superpower]
  const secondaryDef = SUPERPOWER_DEFS[routing.secondary]
  const marginPct = copy.marginPct

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      {/* Primary result card — element = superpower channel, altitude = confidence */}
      <CultivationCard element={primaryDef.channel} altitude={routing.confident ? 'satisfied' : 'neutral'} stage="growing">
        <div className="space-y-3 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight">{primaryDef.label}</h2>
            {routing.orientation ? (
              <span className="text-xs opacity-80">{ORIENTATION_LABEL[routing.orientation]}</span>
            ) : null}
          </div>

          <p className="text-sm leading-relaxed">{copy.primary.gift}</p>

          {/* Shadow — included on purpose (anti-Barnum: favorability not equalized) */}
          <p className="text-sm leading-relaxed opacity-80">
            <span className="font-semibold">Shadow:</span> {copy.primary.shadow}
          </p>
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">At your best:</span> {copy.primary.atBest}
          </p>
        </div>
      </CultivationCard>

      {/* Margin band + secondary ("try the adjacent one") */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{primaryDef.label}</span>
          <span className="opacity-70">{secondaryDef.label}</span>
        </div>
        <MarginBar primary={primaryDef.label} marginPct={marginPct} />
        <p className="text-sm opacity-90">{copy.tryAdjacent}</p>
        {!routing.confident ? (
          <p className="text-xs opacity-70">
            These two are close — you may carry both. Read each and choose for yourself.
          </p>
        ) : null}
      </div>

      {/* Full spectrum — all seven, so the result reads as a position, not a box */}
      <details className="rounded-lg border border-white/10 p-3">
        <summary className="cursor-pointer text-xs font-medium opacity-80">See your full spectrum</summary>
        <ul className="mt-3 space-y-2">
          {routing.ranked.map((r) => (
            <li key={r.superpower} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0">{SUPERPOWER_DEFS[r.superpower].label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded bg-white/10" aria-hidden="true">
                <span className="block h-full bg-white/40" style={{ width: `${Math.round(r.pct * 100)}%` }} />
              </span>
              <span className="w-9 shrink-0 text-right tabular-nums opacity-70">{Math.round(r.pct * 100)}%</span>
            </li>
          ))}
        </ul>
      </details>

      {/* Mechanism disclosure — lens, not verdict; taker is the authority */}
      <p className="text-xs leading-relaxed opacity-60">{copy.framing}</p>

      {/* Next step — turn this superpower into a requestable offer */}
      <div className="space-y-2 rounded-lg border border-white/10 p-4">
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">Make it a move.</span> Turn{' '}
          {primaryDef.label.toLowerCase().startsWith('the ') ? primaryDef.label : `the ${primaryDef.label}`} into a
          scoped, consent-forward offer someone can actually request.
        </p>
        <Link
          href="/forge"
          className="inline-flex w-full items-center justify-center rounded-md bg-[var(--bars-liminal)] px-4 py-3 text-sm font-bold text-white shadow-[0_0_26px_-7px_var(--bars-liminal-glow),inset_0_1px_0_rgba(255,255,255,0.18)]"
        >
          Forge a promise move →
        </Link>
      </div>
    </div>
  )
}

/** Visual margin between primary and secondary, labeled for screen readers. */
function MarginBar({ primary, marginPct }: { primary: string; marginPct: number }) {
  const clamped = Math.max(0, Math.min(100, marginPct))
  return (
    <div
      className="h-2 w-full overflow-hidden rounded bg-white/10"
      role="img"
      aria-label={`${primary} leads by ${clamped} percent`}
    >
      <span className="block h-full bg-white/50" style={{ width: `${clamped}%` }} />
    </div>
  )
}
