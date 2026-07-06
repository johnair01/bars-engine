'use client'

// ---------------------------------------------------------------------------
// DiagnosticSummary — the structured "read" (pre-card / raw, per UI_COVENANT §10).
// This is NOT a CultivationCard: the player has not yet formed an element-coded
// artifact. It shows the composer-ready DiagnosticResult in plain terms.
// ---------------------------------------------------------------------------

import type { DiagnosticResult, EmotionChannel, DiagnosticFlag } from '@/lib/emotional-alchemy'

const CHANNEL_LABEL: Record<EmotionChannel, string> = {
  anger: 'Anger',
  sadness: 'Sadness',
  fear: 'Fear',
  joy: 'Joy',
  neutrality: 'Neutrality',
}

// Accent per channel — reuses the ChargeCaptureForm chip vocabulary (Tailwind
// utility classes, not element hex; this is the raw pre-card surface).
const CHANNEL_ACCENT: Record<EmotionChannel, string> = {
  anger: 'text-red-300 border-red-800/50',
  sadness: 'text-blue-300 border-blue-800/50',
  fear: 'text-violet-300 border-violet-800/50',
  joy: 'text-yellow-300 border-yellow-800/50',
  neutrality: 'text-zinc-200 border-zinc-700',
}

const FLAG_NOTE: Partial<Record<DiagnosticFlag, string>> = {
  hot_charge: 'Hot charge — a grounding reset comes first.',
  safety_power_over: 'Power-over present — internal moves lead; nothing aimed at the person with power over you by default.',
  verified_rest: 'Read as genuine rest, not a freeze. That counts.',
  frozen_suspected: 'Flatness reads as a wall — the felt thread comes first to find what froze.',
  numbness_verified: 'Numbness fork completed.',
  layer_descended: 'You looked underneath the first feeling.',
  capture_only: 'Capture only — getting it down is a complete session.',
  crisis: 'You asked for more than a practice — that is the right call.',
}

const TARGET_TITLE: Record<string, string> = {
  peace: 'Peace',
  triumph: 'Triumph',
  poignance: 'Poignance',
  bliss: 'Bliss',
  wonder: 'Wonder',
}

const TEMPORAL_LABEL = { now: 'happening now', replay: 'replaying the past', upcoming: 'coming up' } as const
const FUEL_LABEL = { depleted: 'depleted', steady: 'steady', charged: 'charged' } as const

export function DiagnosticSummary({ result }: { result: DiagnosticResult }) {
  const { vector, shape, shapeConfidence, time, temporal, fuel, thread, harmRelation, flags } = result
  const channelLabel = CHANNEL_LABEL[vector.channel]
  const accent = CHANNEL_ACCENT[vector.channel]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Your read</p>
        <h2 className={`mt-1 inline-flex items-baseline gap-2 border-b pb-1 text-2xl font-bold ${accent}`}>
          <span className="tabular-nums">{channelLabel} {vector.intensity}</span>
          <span className="text-zinc-500">→</span>
          <span className="text-zinc-100">{TARGET_TITLE[vector.target] ?? vector.target}</span>
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          {vector.altitude} · {TEMPORAL_LABEL[temporal]} · fuel {FUEL_LABEL[fuel]} · {time} min
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
          <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Thread</dt>
          <dd className="mt-1 text-zinc-300">{thread.label}</dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
          <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Shape</dt>
          <dd className="mt-1 text-zinc-300">
            {shape ? shape.replace(/_/g, ' ') : 'undetermined'}
            {shape && shapeConfidence === 'low' && <span className="text-zinc-600"> (unsure)</span>}
          </dd>
        </div>
        {harmRelation && (
          <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
            <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Harm relation</dt>
            <dd className="mt-1 text-zinc-300">
              {harmRelation === 'received'
                ? 'You received this. No move will be aimed at the person who caused harm by default.'
                : harmRelation === 'witnessed'
                ? 'You witnessed this.'
                : 'This is about your own conduct.'}
            </dd>
          </div>
        )}
      </dl>

      {flags.length > 0 && (
        <ul className="space-y-1.5">
          {flags.map(
            (flag) =>
              FLAG_NOTE[flag] && (
                <li key={flag} className="flex gap-2 text-sm text-zinc-400">
                  <span aria-hidden className="text-zinc-600">›</span>
                  <span>{FLAG_NOTE[flag]}</span>
                </li>
              )
          )}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-zinc-600">
        Next: your practice. The recommendation composer (which reads this vector and picks a tool) is the
        next build target — for now this read is the deliverable. Your words never left this device.
      </p>
    </div>
  )
}
