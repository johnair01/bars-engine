'use client'

/**
 * BrainstormLauncher — NOW-page entry into the candidate-action brainstorm.
 *
 * Sits beneath the TapTheVeinPanel as a sibling of the daily ritual: a compact
 * purple-accented card that opens the self-contained BrainstormFlow sheet. Pure
 * local state — see BrainstormFlow.
 */

import { useState } from 'react'
import { BrainstormFlow } from './BrainstormFlow'

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'
const purpleGlow = 'var(--bars-liminal-glow)'

export function BrainstormLauncher() {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <div className="flex items-center justify-between" style={{ marginBottom: 11 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: purple }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: purple, boxShadow: `0 0 6px 1px ${purpleGlow}`, display: 'inline-block' }} />
          Brainstorm
        </span>
        <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>before you commit</span>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full"
        style={{
          textAlign: 'left',
          borderRadius: 10,
          background: 'var(--bars-surface-card)',
          boxShadow: `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px color-mix(in srgb, ${purple} 55%, transparent), 0 6px 24px -10px ${purpleGlow}`,
          padding: '16px 16px 15px',
        }}
      >
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: display, fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--bars-text-primary)', margin: 0 }}>
            Everything you could do
          </h3>
          <span style={{ fontSize: 16, color: purpleGlow, textShadow: `0 0 12px ${purpleGlow}`, lineHeight: 1 }}>◇</span>
        </div>
        <p style={{ fontFamily: body, fontSize: 12, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '4px 0 0' }}>
          Dump the candidates first — then distill down to the few you&rsquo;ll actually commit.
        </p>
        <span
          className="flex items-center justify-center gap-2"
          style={{ marginTop: 14, minHeight: 48, borderRadius: 8, background: purple, color: '#fff', fontFamily: display, fontWeight: 700, fontSize: 14, boxShadow: `inset 0 1px 0 var(--bars-inset-top), 0 6px 18px -8px ${purpleGlow}` }}
        >
          Start the brainstorm →
        </span>
      </button>

      {open && <BrainstormFlow onClose={() => setOpen(false)} />}
    </section>
  )
}
