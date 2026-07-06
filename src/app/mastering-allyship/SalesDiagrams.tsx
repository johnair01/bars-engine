/**
 * The four animated sales-letter diagrams — ported 1:1 from the Claude Design
 * handoff logic class (`Sales Letter.dc.html` → mkLoop/mkSpiral/mkLineup/mkRoad),
 * including the exact coordinate math. Server components (pure); the dash-flow
 * animation lives in mastering-allyship.css (honors prefers-reduced-motion).
 *
 * This surface intentionally uses literal design hex (not --bars-* element tokens)
 * to match the Claude Design output exactly — see the page header note.
 */
import type { CSSProperties } from 'react'

type PalKey = 'fire' | 'wood' | 'teal' | 'gold' | 'metal'
const PAL: Record<PalKey, { b: string; g: string }> = {
  fire: { b: '#ef6a4d', g: '239,106,77' },
  wood: { b: '#4fe0a0', g: '79,224,160' },
  teal: { b: '#2fd3d0', g: '47,211,208' },
  gold: { b: '#e6b93f', g: '224,177,58' },
  metal: { b: '#b9c1cb', g: '185,193,203' },
}
const glow = (key: PalKey) => `drop-shadow(0 0 5px rgba(${PAL[key].g},.55))`

const SVG_STYLE: CSSProperties = { display: 'block', overflow: 'visible' }
const MONO = 'var(--bars-font-mono)'

function Arrow({ x, y, a, c, gf }: { x: number; y: number; a: number; c: string; gf: string }) {
  const s = 8.5
  const r = (a * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  const p = (dx: number, dy: number) =>
    `${(x + dx * cos - dy * sin).toFixed(1)} ${(y + dx * sin + dy * cos).toFixed(1)}`
  return <polygon points={`${p(s, 0)},${p(-s, s * 0.72)},${p(-s, -s * 0.72)}`} fill={c} style={{ filter: gf }} />
}

function Knot({ cx, cy, c, gf }: { cx: number; cy: number; c: string; gf: string }) {
  const d = `M${cx - 15} ${cy} C${cx - 17} ${cy - 13} ${cx + 1} ${cy - 13} ${cx} ${cy} C${cx - 1} ${cy + 13} ${cx + 17} ${cy + 13} ${cx + 16} ${cy} C${cx + 15} ${cy - 13} ${cx - 1} ${cy - 13} ${cx} ${cy} C${cx + 1} ${cy + 13} ${cx - 17} ${cy + 13} ${cx - 15} ${cy} Z`
  return <path d={d} fill="none" stroke={c} strokeWidth={2.2} opacity={0.5} style={{ filter: gf }} />
}

function Lab({ x, y, t, anchor, c, size = 12 }: { x: number; y: number; t: string; anchor: 'start' | 'middle' | 'end'; c: string; size?: number }) {
  return (
    <text x={x} y={y} fill={c} fontFamily={MONO} fontSize={size} letterSpacing="0.13em" textAnchor={anchor} opacity={0.92}>
      {t}
    </text>
  )
}

/** THE LOOP (fire) — a closed rounded-triangle ring that never resolves. */
export function LoopDiagram() {
  const s = PAL.fire.b
  const gf = glow('fire')
  const ring = 'M210 56 Q364 150 338 288 Q210 366 82 288 Q56 150 210 56 Z'
  return (
    <svg viewBox="-10 -10 440 400" width="100%" style={SVG_STYLE} aria-hidden="true">
      <path d={ring} fill="none" stroke={s} strokeWidth={2.4} opacity={0.3} style={{ filter: gf }} />
      <path
        d={ring}
        fill="none"
        stroke={s}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeDasharray="9 21"
        opacity={0.92}
        className="sl-loop-dash"
        style={{ filter: gf }}
      />
      <Knot cx={210} cy={200} c={s} gf={gf} />
      <Arrow x={356} y={178} a={118} c={s} gf={gf} />
      <Arrow x={210} y={340} a={180} c={s} gf={gf} />
      <Arrow x={64} y={178} a={58} c={s} gf={gf} />
      <circle cx={210} cy={56} r={4.5} fill={s} style={{ filter: gf }} />
      <circle cx={338} cy={288} r={4.5} fill={s} style={{ filter: gf }} />
      <circle cx={82} cy={288} r={4.5} fill={s} style={{ filter: gf }} />
      <Lab x={210} y={36} t="TRY HARDER" anchor="middle" c={s} size={12.5} />
      <Lab x={372} y={320} t="FALL SHORT" anchor="middle" c={s} size={12.5} />
      <Lab x={48} y={320} t="NOT ENOUGH" anchor="middle" c={s} size={12.5} />
    </svg>
  )
}

/** THE SPIRAL (wood) — an Archimedean spiral that threads the knot and opens out. */
export function SpiralDiagram() {
  const s = PAL.wood.b
  const gf = glow('wood')
  const cx = 172
  const cy = 196
  const turns = 2.65
  const steps = 240
  const maxT = turns * 2 * Math.PI
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = (maxT * i) / steps
    const r = 7 + 8.9 * t
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)])
  }
  const last = pts[pts.length - 1]
  const prev = pts[pts.length - 7]
  let dx = last[0] - prev[0]
  let dy = last[1] - prev[1]
  const L = Math.hypot(dx, dy)
  dx /= L
  dy /= L
  const eX = last[0] + dx * 66
  const eY = last[1] + dy * 66
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI
  const d = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + ' L ' + `${eX.toFixed(1)} ${eY.toFixed(1)}`
  return (
    <svg viewBox="-10 -10 440 400" width="100%" style={SVG_STYLE} aria-hidden="true">
      <path d={d} fill="none" stroke={s} strokeWidth={2.3} opacity={0.26} style={{ filter: gf }} />
      <path
        d={d}
        fill="none"
        stroke={s}
        strokeWidth={3.1}
        strokeLinecap="round"
        strokeDasharray="70 520"
        opacity={0.95}
        className="sl-spiral-dash"
        style={{ filter: gf }}
      />
      <Knot cx={cx} cy={cy} c={s} gf={gf} />
      <Arrow x={eX} y={eY} a={ang} c={s} gf={gf} />
    </svg>
  )
}

/** THE LINEUP (metal) — four helpers point inward; the center "A MOVE?" stays empty. */
export function LineupDiagram() {
  const s = PAL.metal.b
  const gf = glow('metal')
  const CX = 235
  const CY = 208
  const R = 34
  const nodes: [number, number, string][] = [
    [58, 82, 'THERAPIST'],
    [180, 50, 'COACH'],
    [300, 50, 'CONSULTANT'],
    [420, 82, 'LUNCH'],
  ]
  return (
    <svg viewBox="0 0 470 285" width="100%" style={SVG_STYLE} aria-hidden="true">
      {nodes.map(([nx, ny, name]) => {
        const dx = CX - nx
        const dy = CY - ny
        const L = Math.hypot(dx, dy)
        const ux = dx / L
        const uy = dy / L
        const x2 = nx + ux * (L - R - 16)
        const y2 = ny + uy * (L - R - 16)
        return (
          <g key={name}>
            <line x1={nx} y1={ny + 6} x2={x2} y2={y2} stroke={s} strokeWidth={1.6} strokeDasharray="3 5" opacity={0.5} style={{ filter: gf }} />
            <circle cx={nx} cy={ny} r={4.5} fill={s} style={{ filter: gf }} />
            <Lab x={nx} y={ny - 12} t={name} anchor="middle" c={s} size={11.5} />
          </g>
        )
      })}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={s} strokeWidth={1.8} strokeDasharray="4 6" opacity={0.55} style={{ filter: gf }} />
      <text x={CX} y={CY + 4} fill={s} fontFamily={MONO} fontSize={11} letterSpacing="0.12em" textAnchor="middle" opacity={0.7}>
        A MOVE?
      </text>
    </svg>
  )
}

/** THE ROAD (gold) — Deck / Book / Coaching converge into one paved road. */
export function RoadDiagram() {
  const s = PAL.gold.b
  const gf = glow('gold')
  const starts: [number, number, string][] = [
    [42, 92, 'DECK'],
    [42, 152, 'BOOK'],
    [42, 214, 'COACHING'],
  ]
  const mX = 214
  const mY = 153
  const topN: [number, number] = [214, 132]
  const topF: [number, number] = [430, 96]
  const botN: [number, number] = [214, 176]
  const botF: [number, number] = [438, 108]
  const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const N = 9
  const rungs: [number, number][][] = []
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    rungs.push([lerp(topN, topF, t), lerp(botN, botF, t)])
  }
  return (
    <svg viewBox="0 0 470 285" width="100%" style={SVG_STYLE} aria-hidden="true">
      {starts.map(([sx, sy, name]) => (
        <g key={name}>
          <path d={`M${sx} ${sy} C${sx + 78} ${sy} 150 ${mY} ${mX} ${mY}`} fill="none" stroke={s} strokeWidth={2.2} opacity={0.8} style={{ filter: gf }} />
          <circle cx={sx} cy={sy} r={4.5} fill={s} style={{ filter: gf }} />
          <Lab x={sx - 10} y={sy + 4} t={name} anchor="end" c={s} size={11} />
        </g>
      ))}
      {rungs.map(([tp, bp], i) => {
        const t = i / (N - 1)
        return <line key={i} x1={tp[0]} y1={tp[1]} x2={bp[0]} y2={bp[1]} stroke={s} strokeWidth={3 - 2 * t} opacity={0.95 - 0.55 * t} style={{ filter: gf }} />
      })}
      <line x1={topN[0]} y1={topN[1]} x2={topF[0]} y2={topF[1]} stroke={s} strokeWidth={1.4} opacity={0.5} style={{ filter: gf }} />
      <line x1={botN[0]} y1={botN[1]} x2={botF[0]} y2={botF[1]} stroke={s} strokeWidth={1.4} opacity={0.5} style={{ filter: gf }} />
      <circle cx={434} cy={102} r={5} fill={s} style={{ filter: `drop-shadow(0 0 10px rgba(${PAL.gold.g},.9))` }} />
    </svg>
  )
}
