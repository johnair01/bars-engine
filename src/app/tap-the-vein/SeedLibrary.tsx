'use client'

/**
 * SeedLibrary: the commitments he set aside, to draw from later (six-faces-council docs/seed-library.md).
 *
 * Closed until he opens it, with no count on the closed row: a resting task carries no pressure and nothing brings
 * it back unasked. Each seed can be drawn into today or let go with no reason.
 */

import { useState } from 'react'
import type { SeedLibraryEntry } from '@/lib/tap-the-vein/seed-library'

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'

export function SeedLibrary({
  seeds,
  pending,
  onDraw,
  onLetGo,
}: {
  seeds: SeedLibraryEntry[]
  pending: boolean
  onDraw: (id: string) => void
  onLetGo: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)', background: 'none' }}
      >
        {open ? '▾' : '▸'} Seed library
      </button>

      {open && (
        <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          {seeds.length === 0 && (
            <p style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-muted)', margin: 0 }}>
              Nothing set aside. Open a card and choose &ldquo;Set aside&rdquo; to keep it here for another day.
            </p>
          )}
          {seeds.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl"
              style={{ padding: '10px 12px', background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)' }}
            >
              <div className="min-w-0">
                <p className="truncate" style={{ fontFamily: body, fontSize: 13.5, color: 'var(--bars-text-primary)', margin: 0 }}>{s.text}</p>
                <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.08em', color: 'var(--bars-text-muted)', margin: '3px 0 0' }}>
                  named {s.fromDay}
                </p>
              </div>
              <div className="flex flex-none gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onDraw(s.id)}
                  style={{ fontFamily: display, fontWeight: 700, fontSize: 12.5, color: purple, background: 'none', opacity: pending ? 0.5 : 1 }}
                >
                  Draw into today
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onLetGo(s.id)}
                  style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', background: 'none', opacity: pending ? 0.5 : 1 }}
                >
                  Let go
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
