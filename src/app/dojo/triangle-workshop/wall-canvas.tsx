'use client'

import { useRef, useState } from 'react'
import { SIDE, boundsOf, edgesOf, type Pt, type Tri } from '@/lib/dojo-practice/geometry'
import { triangleCharge, wordById } from '@/lib/dojo-practice/constellation'
import type { Constellation } from '@/lib/dojo-practice/types'

/**
 * The page. Lines are the things you touch: each is a concept, coloured and weighted by its charge, with a wide
 * invisible stroke so a thumb finds it. A ghost triangle shows where the line being drawn will land.
 */

export type GhostEdge = { a: Pt; b: Pt; label: string | null; slot: number | null; active: boolean }
export type Ghost = { points: Tri; edges: GhostEdge[] }
export type Selection = { kind: 'edge'; key: string } | { kind: 'triangle'; id: string } | null

type View = { x: number; y: number; w: number }
/** The canvas is 10 wide by 11 tall, so the view height is always 1.1 × its width. */
const ASPECT = 1.1

/** Charge → colour, with the number printed on the line too so colour is never the only signal. */
export const CHARGE_COLOUR: Record<number, string> = { [-3]: '#e11d48', [-2]: '#f43f5e', [-1]: '#fda4af', 0: '#fcd34d', 1: '#99f6e4', 2: '#2dd4bf', 3: '#14b8a6' }
const colourOf = (n: number) => CHARGE_COLOUR[Math.max(-3, Math.min(3, n))]
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))
/** A line is about 20 units long and the text about 1.3 units a character, so ten characters fit; the dock shows the full word. */
const short = (s: string) => (s.length > 10 ? `${s.slice(0, 9)}…` : s)
/** Dark halo so a name stays legible where it sits on its own line. */
const halo = { paintOrder: 'stroke' } as const

function fitView(points: Pt[]): View {
  const b = boundsOf(points)
  const pad = SIDE * 0.4
  const w = Math.max(b.maxX - b.minX + 2 * pad, (b.maxY - b.minY + 2 * pad) / ASPECT, SIDE * 2.2)
  return { x: (b.minX + b.maxX) / 2 - w / 2, y: (b.minY + b.maxY) / 2 - (w * ASPECT) / 2, w }
}

/** The name sits on its line, running along it, never upside down. */
function lineLabel(a: Pt, b: Pt) {
  let angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
  if (angle > 90 || angle < -90) angle += 180
  return { at: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, angle }
}

type Props = {
  constellation: Constellation
  ghost: Ghost | null
  selection: Selection
  onSelectEdge: (key: string) => void
  onSelectTriangle: (id: string) => void
  onSelectGhostLine: (slot: number) => void
  onClear: () => void
  onNewTriangle?: () => void
}

export function WallCanvas({ constellation: c, ghost, selection, onSelectEdge, onSelectTriangle, onSelectGhostLine, onClear, onNewTriangle }: Props) {
  const [view, setView] = useState<View | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ px: number; py: number; from: View; moved: boolean } | null>(null)

  const points = [...c.triangles.flatMap(t => t.points), ...(ghost?.points ?? [])]
  const v = view ?? fitView(points)
  const edges = edgesOf(c)

  const zoom = (f: number) => setView({ x: v.x + (v.w * (1 - f)) / 2, y: v.y + (v.w * ASPECT * (1 - f)) / 2, w: v.w * f })
  const startPan = (e: React.PointerEvent) => { drag.current = { px: e.clientX, py: e.clientY, from: v, moved: false } }
  const movePan = (e: React.PointerEvent) => {
    const d = drag.current, box = svgRef.current?.getBoundingClientRect()
    if (!d || !box) return
    const dx = e.clientX - d.px, dy = e.clientY - d.py
    if (!d.moved && Math.hypot(dx, dy) < 6) return
    d.moved = true
    const k = d.from.w / box.width
    setView({ ...d.from, x: d.from.x - dx * k, y: d.from.y - dy * k })
  }
  const endPan = () => { const moved = drag.current?.moved; drag.current = null; return moved }

  return (
    <div className="relative">
      <svg
        ref={svgRef} viewBox={`${v.x} ${v.y} ${v.w} ${v.w * ASPECT}`} role="group" aria-label="The page of triangles"
        className="aspect-[10/11] max-h-[70vh] w-full touch-none rounded-2xl border border-amber-100/15 bg-[radial-gradient(ellipse_at_50%_30%,rgba(120,78,24,.22),rgba(8,22,23,.9)_75%)]"
        onPointerMove={movePan} onPointerUp={endPan} onPointerLeave={endPan} onPointerCancel={endPan}
      >
        <rect x={v.x} y={v.y} width={v.w} height={v.w * ASPECT} fill="transparent" onPointerDown={startPan} onClick={() => { if (!drag.current?.moved) onClear() }} />

        {c.triangles.map(t => {
          const ch = triangleCharge(c, t)
          const on = selection?.kind === 'triangle' && selection.id === t.id
          return (
            <path
              key={t.id} d={`M${t.points[0].x} ${t.points[0].y} L${t.points[1].x} ${t.points[1].y} L${t.points[2].x} ${t.points[2].y} Z`}
              fill={ch < 0 ? 'rgba(251,113,133,.10)' : ch > 0 ? 'rgba(45,212,191,.08)' : 'rgba(252,211,77,.04)'}
              stroke={on ? '#5eead4' : 'none'} strokeWidth={2} vectorEffect="non-scaling-stroke" className="cursor-pointer"
              role="button" aria-label={`Triangle of ${t.wordIds.map(id => wordById(c, id)?.label).join(', ')}, charge ${signed(ch)}`} aria-pressed={on}
              tabIndex={0} onClick={() => onSelectTriangle(t.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTriangle(t.id) } }}
            />
          )
        })}

        {edges.map(e => {
          const word = wordById(c, e.wordId)
          if (!word) return null
          const on = selection?.kind === 'edge' && selection.key === e.key
          const { at, angle } = lineLabel(e.a, e.b)
          return (
            <g key={e.key}>
              {on && <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="#e0fffa" strokeOpacity=".35" strokeWidth={14} strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
              <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke={colourOf(word.charge)} strokeWidth={2.5 + Math.abs(word.charge) * 1.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <text x={at.x} y={at.y} transform={`rotate(${angle} ${at.x} ${at.y})`} textAnchor="middle" dominantBaseline="middle" fontSize="2.2" fill="#f4f4f5" stroke="#0b1b1c" strokeWidth={0.9} style={halo} pointerEvents="none">
                {short(word.label)} <tspan fill={colourOf(word.charge)}>{signed(word.charge)}</tspan>
              </text>
              <line
                x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="transparent" strokeWidth={30} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="cursor-pointer"
                role="button" tabIndex={0} aria-label={`Line ${word.label}, charge ${signed(word.charge)}`} aria-pressed={on}
                onClick={() => onSelectEdge(e.key)} onKeyDown={k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); onSelectEdge(e.key) } }}
              />
            </g>
          )
        })}

        {ghost && (
          <g>
            {ghost.edges.map((g, i) => {
              const { at, angle } = lineLabel(g.a, g.b)
              return (
                <g key={i}>
                  <line x1={g.a.x} y1={g.a.y} x2={g.b.x} y2={g.b.y} stroke={g.active ? '#5eead4' : '#a1a1aa'} strokeWidth={g.active ? 4 : 2.5} strokeDasharray={g.label ? undefined : '6 6'} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  {g.label
                    ? <text x={at.x} y={at.y} transform={`rotate(${angle} ${at.x} ${at.y})`} textAnchor="middle" dominantBaseline="middle" fontSize="2.2" fill="#f4f4f5" stroke="#0b1b1c" strokeWidth={0.9} style={halo} pointerEvents="none">{short(g.label)}</text>
                    : <text x={at.x} y={at.y} textAnchor="middle" dominantBaseline="middle" fontSize="4" fill={g.active ? '#5eead4' : '#a1a1aa'} pointerEvents="none">+</text>}
                  {g.slot !== null && (
                    <line
                      x1={g.a.x} y1={g.a.y} x2={g.b.x} y2={g.b.y} stroke="transparent" strokeWidth={30} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="cursor-pointer"
                      role="button" tabIndex={0} aria-label={`Draw line ${g.slot + 1}`} onClick={() => onSelectGhostLine(g.slot!)}
                      onKeyDown={k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); onSelectGhostLine(g.slot!) } }}
                    />
                  )}
                </g>
              )
            })}
          </g>
        )}
      </svg>

      <div className="absolute right-2 top-2 flex flex-col gap-2">
        <button type="button" aria-label="Zoom in" onClick={() => zoom(0.8)} className="min-h-11 min-w-11 rounded-lg border border-zinc-600 bg-zinc-950/80 text-lg text-zinc-100">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => zoom(1.25)} className="min-h-11 min-w-11 rounded-lg border border-zinc-600 bg-zinc-950/80 text-lg text-zinc-100">−</button>
        <button type="button" aria-label="Fit the page" onClick={() => setView(null)} className="min-h-11 min-w-11 rounded-lg border border-zinc-600 bg-zinc-950/80 text-xs text-zinc-100">Fit</button>
      </div>
      {onNewTriangle && (
        <button type="button" onClick={onNewTriangle} className="absolute left-2 top-2 min-h-11 rounded-lg border border-teal-300/50 bg-zinc-950/80 px-3 text-sm font-medium text-teal-100">+ New triangle</button>
      )}
    </div>
  )
}
