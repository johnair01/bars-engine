'use client'

/**
 * Unchosen: the lines he named on past mornings and did not choose (six-faces-council pass unchosen1). Wendell,
 * 2026-10-21: "emotional energy and idea energy that isn't being pulled into our flows of yet".
 *
 * Closed until he opens it, with no count on the closed row, like the seed library (sl-no-pressure). Read-only: a
 * line here is not owed anything (tb-loss-not-avoidance). This is the no-AI way to see the pile.
 *
 * The council's weekly read composts the fragments it finds nothing in; those lines stay here, muted as residue
 * (unchosen-gold FR-013). The returning-word patterns and pitches are retired (FR-015): Wendell, 2026-11-03, "It's
 * foolish to rely on repeated words when we can read the whole context". What the read keeps arrives as the council's
 * scroll on his shelf in the nook.
 */

import { useState } from 'react'
import type { UnchosenLine } from '@/lib/tap-the-vein/unchosen'

const mono = 'var(--bars-font-mono)'
const body = 'var(--bars-font-body)'

const FATE_LABEL: Record<UnchosenLine['fate'], string> = {
  raw: 'left raw',
  composted: 'composted',
  unpicked: 'marked play, not picked',
}

const card = {
  padding: '10px 12px',
  background: 'var(--bars-surface-card)',
  boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)',
}

function byDay(lines: UnchosenLine[]): [string, UnchosenLine[]][] {
  const days = new Map<string, UnchosenLine[]>()
  for (const l of lines) days.set(l.day, [...(days.get(l.day) ?? []), l])
  return [...days.entries()]
}

export function Unchosen({
  lines,
  sample = false,
  defaultOpen = false,
}: {
  lines: UnchosenLine[]
  sample?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)', background: 'none' }}
      >
        {open ? '▾' : '▸'} Not chosen
      </button>

      {open && (
        <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          {sample && (
            <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.08em', color: 'var(--bars-text-muted)', margin: 0 }}>
              SAMPLE MORNINGS, NOT YOURS: drop &amp;sample=1 from the address to see your own.
            </p>
          )}
          {lines.length === 0 && (
            <p style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-muted)', margin: 0 }}>
              Nothing yet. Lines you name in a brainstorm and don&rsquo;t pick show here from the next morning on.
            </p>
          )}

          {byDay(lines).map(([day, dayLines]) => (
            <div key={day} className="rounded-xl" style={card}>
              <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.08em', color: 'var(--bars-text-muted)', margin: 0 }}>{day}</p>
              {dayLines.map((l) => (
                <p
                  key={l.key}
                  style={{
                    fontFamily: body,
                    fontSize: 13.5,
                    color: l.fate === 'composted' || l.residue ? 'var(--bars-text-muted)' : 'var(--bars-text-primary)',
                    opacity: l.residue ? 0.7 : 1,
                    margin: '4px 0 0',
                  }}
                >
                  {l.text}{' '}
                  <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.06em', color: 'var(--bars-text-muted)' }}>
                    {l.residue ? 'composted by the council, feeding something' : FATE_LABEL[l.fate]}
                  </span>
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
