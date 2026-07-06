/**
 * The matched diagram pair — the visual spine of the MTGOA sales letter.
 *  - LoopDiagram: the game she was handed. A closed loop (coral) that never
 *    resolves: TRY HARDER → FALL SHORT → PROOF YOU'RE NOT ENOUGH → back again.
 *  - SpiralDiagram: the game she designs. The same line moves *through* and opens
 *    outward into a spiral (teal — the solution color, per the visual system).
 *
 * Server components. Color flows through the page-local --mtgoa-* accent tokens
 * (mastering-allyship.css); no literal hex here. Decorative → aria-hidden, with a
 * caption carrying the meaning for screen readers.
 */
import type { CSSProperties } from 'react'

const MONO: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }

const LOOP_NODES = ['try harder', 'fall short', 'proof you’re not enough']

export function LoopDiagram() {
  return (
    <figure className="mx-auto flex max-w-[430px] flex-col items-center gap-3">
      <svg viewBox="0 0 200 200" className="h-40 w-40" aria-hidden="true">
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="var(--mtgoa-coral)"
          strokeWidth="2"
          strokeDasharray="6 5"
          opacity="0.85"
        />
        {/* arrowhead closing the loop */}
        <path d="M168 100 l-8 -6 l2 6 l-2 6 z" fill="var(--mtgoa-coral)" />
        {LOOP_NODES.map((label, i) => {
          const angle = (i / LOOP_NODES.length) * 2 * Math.PI - Math.PI / 2
          const cx = 100 + 70 * Math.cos(angle)
          const cy = 100 + 70 * Math.sin(angle)
          return <circle key={label} cx={cx} cy={cy} r="5" fill="var(--mtgoa-coral)" />
        })}
      </svg>
      <figcaption style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-center text-[9.5px] uppercase tracking-[0.18em]">
        the game you were handed · it was never designed to close
      </figcaption>
    </figure>
  )
}

export function SpiralDiagram() {
  // An opening spiral: starts tight (the knot) and unwinds outward.
  const points: string[] = []
  const turns = 2.6
  const steps = 120
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * 2 * Math.PI
    const r = 6 + (i / steps) * 74
    const x = 100 + r * Math.cos(t)
    const y = 100 + r * Math.sin(t)
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return (
    <figure className="mx-auto flex max-w-[430px] flex-col items-center gap-3">
      <svg viewBox="0 0 200 200" className="h-40 w-40" aria-hidden="true">
        <polyline points={points.join(' ')} fill="none" stroke="var(--mtgoa-teal)" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        <circle cx="100" cy="100" r="3.5" fill="var(--mtgoa-teal)" />
      </svg>
      <figcaption style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-center text-[9.5px] uppercase tracking-[0.18em]">
        the game you design · it’s built to open
      </figcaption>
    </figure>
  )
}
