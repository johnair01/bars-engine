'use client'

/**
 * Clean321Launcher — opens the canonical 3·2·1 (Clean Up) flow on-demand from the
 * NOW page tools rail. Renders a tile identical to the rail's other tools, but
 * instead of navigating it opens the self-contained Clean321Flow bottom sheet.
 *
 * Drop-in replacement for the older Plant321Launcher: same tile props, so it
 * slots into NowHome's tools rail unchanged. The flow is pure local state — a
 * 3·2·1 can be run anytime with nothing persisted (see Clean321Flow).
 */

import { useState } from 'react'
import { Clean321Flow } from './Clean321Flow'

export function Clean321Launcher({
  icon,
  iconColor,
  iconGlow,
  label,
  sub,
  mono,
}: {
  icon: string
  iconColor: string
  iconGlow: string
  label: string
  sub: string
  mono: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          flex: 1,
          textAlign: 'left',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          padding: '13px 12px',
          borderRadius: 8,
          background: '#1a1a18',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <span style={{
          fontFamily: mono ? 'Space Mono, monospace' : 'Jost, sans-serif',
          fontWeight: 800,
          fontSize: mono ? 15 : 17,
          lineHeight: 1,
          color: iconColor,
          textShadow: `0 0 12px ${iconGlow}`,
        }}>
          {icon}
        </span>
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 12, color: '#e8e6e0' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 7.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b6965' }}>
          {sub}
        </span>
      </button>

      {open && <Clean321Flow onClose={() => setOpen(false)} />}
    </>
  )
}
