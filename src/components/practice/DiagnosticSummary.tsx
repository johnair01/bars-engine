'use client'

// ---------------------------------------------------------------------------
// DiagnosticSummary — "The Read": the threshold (UI_COVENANT §10). The single
// screen allowed to show element color, and the payoff of the pre-card
// restraint. Copy/structure per the Claude Design handoff.
// ---------------------------------------------------------------------------

import type { DiagnosticResult, EmotionChannel, Altitude, Temporal, Fuel, FeltShape, SatisfactionSpirit } from '@/lib/emotional-alchemy'
import { channelGem, channelThresholdStyle } from '@/lib/emotional-alchemy/channel-visuals'

const CHANNEL_LABEL: Record<EmotionChannel, string> = { anger: 'Anger', sadness: 'Sadness', fear: 'Fear', joy: 'Joy', neutrality: 'Neutrality' }
const TARGET_LABEL: Record<SatisfactionSpirit, string> = { peace: 'Peace', triumph: 'Triumph', poignance: 'Poignance', bliss: 'Bliss', wonder: 'Wonder' }
const ALTITUDE_LABEL: Record<Altitude, string> = { dissatisfied: 'Raw', neutral: 'Forming', satisfied: 'Formed' }
const TEMPORAL_LABEL: Record<Temporal, string> = { now: 'Happening now', replay: 'Replaying', upcoming: 'Coming up' }
const FUEL_LABEL: Record<Fuel, string> = { depleted: 'Low fuel', steady: 'Steady fuel', charged: 'Charged' }
const FELT_LABEL: Record<FeltShape, string> = { knot: 'Knot', weight: 'Weight', fog: 'Fog', spark: 'Spark', static: 'Static', edge: 'Edge' }

const eyebrow = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500'

export function DiagnosticSummary({ result }: { result: DiagnosticResult }) {
  const { vector, feltShape, time, temporal, fuel, thread } = result
  const meta = [ALTITUDE_LABEL[vector.altitude], TEMPORAL_LABEL[temporal], FUEL_LABEL[fuel], `${time} min`].join(' · ')

  return (
    <div className="space-y-6">
      <p className={eyebrow}>The read</p>

      {/* The threshold: element enters for the first time — gem-colored intensity,
          a gem bottom-border at NEUTRAL altitude weight (soft glow). Becoming
          legible, not finished. */}
      <div>
        <h2 className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b pb-2 text-3xl font-bold text-zinc-100" style={channelThresholdStyle(vector.channel)}>
          <span>{CHANNEL_LABEL[vector.channel]}</span>
          <span className="tabular-nums" style={{ color: channelGem(vector.channel) }}>{vector.intensity}</span>
          <span className="text-zinc-600">→</span>
          <span>{TARGET_LABEL[vector.target] ?? vector.target}</span>
        </h2>
        <p className={eyebrow + ' mt-3'}>{meta}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          <dt className={eyebrow}>Thread</dt>
          <dd className="mt-1 text-sm text-zinc-300">{thread.label}</dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          <dt className={eyebrow}>Shape</dt>
          <dd className="mt-1 text-sm text-zinc-300">{feltShape ? FELT_LABEL[feltShape] : '—'}</dd>
        </div>
      </dl>

      <div className="space-y-2">
        <p className={eyebrow}>Your words never left this device.</p>
        <p className="text-sm leading-relaxed text-zinc-500">
          This is the threshold. On the other side, the charge becomes a formed practice — with an element, and a move.
        </p>
      </div>
    </div>
  )
}
