'use client'

/**
 * PlantTriad — the isolated 3·2·1 / unpacking EA-triad
 * (desired outcome → where you are now → where you want to be).
 *
 * Extracted from the Tap the Vein "Plant in Garden" gesture so the same flow
 * can run on-demand (NOW page modal) as well as inside the daily ritual. Pure
 * presentational + local state; the caller owns persistence via `onSubmit`.
 *
 * Options come from the single source of truth in unpacking-constants.ts so the
 * standalone flow and the in-ritual flow never diverge.
 */

import { useState } from 'react'
import { EXPERIENCE_OPTIONS, SATISFACTION_OPTIONS, DISSATISFACTION_OPTIONS } from '@/lib/quest-grammar/unpacking-constants'

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'

export type PlantTriadValue = {
  experienceIntent: string
  dissatisfaction: string[]
  satisfaction: string[]
}

export function PlantTriad({
  busy,
  onSubmit,
  submitLabel = 'Plant ❀',
}: {
  busy: boolean
  onSubmit: (value: PlantTriadValue) => void
  submitLabel?: string
}) {
  const [experience, setExperience] = useState<string | null>(null)
  const [dissat, setDissat] = useState<string[]>([])
  const [sat, setSat] = useState<string[]>([])
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const canPlant = !!experience && dissat.length > 0 && sat.length > 0
  const purple = 'var(--bars-liminal)'

  return (
    <div>
      {/* q1 — desired outcome (single) */}
      <ChipGroup label="Desired outcome">
        {EXPERIENCE_OPTIONS.map((o) => (
          <Chip key={o} label={o} selected={experience === o} onClick={() => setExperience(o)} />
        ))}
      </ChipGroup>

      {/* q4 — current dissatisfaction (multi) */}
      <ChipGroup label="Where you are now">
        {DISSATISFACTION_OPTIONS.map((o) => (
          <Chip key={o} label={o} selected={dissat.includes(o)} onClick={() => setDissat((l) => toggle(l, o))} />
        ))}
      </ChipGroup>

      {/* q2 — desired satisfaction (multi) */}
      <ChipGroup label="Where you want to be">
        {SATISFACTION_OPTIONS.map((o) => (
          <Chip key={o} label={o} selected={sat.includes(o)} onClick={() => setSat((l) => toggle(l, o))} />
        ))}
      </ChipGroup>

      <button
        type="button"
        disabled={busy || !canPlant}
        onClick={() => experience && onSubmit({ experienceIntent: experience, dissatisfaction: dissat, satisfaction: sat })}
        className="w-full"
        style={{
          marginTop: 14,
          minHeight: 48,
          borderRadius: 8,
          background: canPlant ? purple : 'var(--bars-surface-card)',
          color: canPlant ? '#fff' : 'var(--bars-text-muted)',
          fontFamily: display,
          fontWeight: 800,
          fontSize: 15,
          boxShadow: 'inset 0 1px 0 var(--bars-inset-top)',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {submitLabel}
      </button>
    </div>
  )
}

export function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: '0 0 7px' }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

export function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const purple = 'var(--bars-liminal)'
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full"
      style={{
        minHeight: 32,
        padding: '6px 12px',
        fontFamily: 'var(--bars-font-body)',
        fontSize: 12.5,
        color: selected ? '#fff' : 'var(--bars-text-secondary)',
        background: selected ? purple : 'var(--bars-surface-card)',
        boxShadow: selected
          ? 'inset 0 1px 0 var(--bars-inset-top)'
          : 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)',
      }}
    >
      {label}
    </button>
  )
}
