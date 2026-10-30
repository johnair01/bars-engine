import type { Constellation, Triangle } from './types'

/**
 * The wall's geometry. A triangle is three points; line i runs from point i to point i+1 and carries word i. Extending
 * across a line is a reflection, so triangles tile outward the way a strip of paper triangles does, and a line shared by
 * two triangles is literally the same two points.
 */

export type Pt = { x: number; y: number }
export type Tri = [Pt, Pt, Pt]

/** Side length in wall units. The board fits the view to the drawing, so only ratios matter. */
export const SIDE = 20
const H = (SIDE * Math.sqrt(3)) / 2

/** Base first (left to right), apex up: the order a person draws the three lines. */
export const equilateralAt = (cx: number, cy: number): Tri => [
  { x: cx - SIDE / 2, y: cy + H / 3 },
  { x: cx + SIDE / 2, y: cy + H / 3 },
  { x: cx, y: cy - (2 * H) / 3 },
]

export const centroid = (t: Tri): Pt => ({ x: (t[0].x + t[1].x + t[2].x) / 3, y: (t[0].y + t[1].y + t[2].y) / 3 })

export function reflect(p: Pt, a: Pt, b: Pt): Pt {
  const dx = b.x - a.x, dy = b.y - a.y
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)
  const fx = a.x + t * dx, fy = a.y + t * dy
  return { x: 2 * fx - p.x, y: 2 * fy - p.y }
}

/** The triangle that grows across line `edge` of `parent`. Its first line is the shared one, reversed. */
export function extensionPoints(parent: Triangle, edge: number): Tri {
  const a = parent.points[edge], b = parent.points[(edge + 1) % 3], third = parent.points[(edge + 2) % 3]
  return [b, a, reflect(third, a, b)]
}

/** Another triangle already stands where this one would go. */
export const occupied = (c: Constellation, t: Tri) => {
  const g = centroid(t)
  return c.triangles.some(o => Math.hypot(centroid(o.points).x - g.x, centroid(o.points).y - g.y) < SIDE * 0.3)
}

export const freeEdgeIndexes = (c: Constellation, t: Triangle) => [0, 1, 2].filter(i => !occupied(c, extensionPoints(t, i)))

/** The next open place for a standalone triangle: to the right of everything, level with the first. */
export function freeStandalone(c: Constellation): Tri {
  if (!c.triangles.length) return equilateralAt(0, 0)
  const maxX = Math.max(...c.triangles.flatMap(t => t.points.map(p => p.x)))
  return equilateralAt(maxX + SIDE * 0.9, centroid(c.triangles[0].points).y)
}

export type EdgeView = { key: string; a: Pt; b: Pt; wordId: string; triangleIds: string[] }

const r2 = (n: number) => Math.round(n * 100) / 100
const keyOf = (a: Pt, b: Pt) => {
  const [p, q] = [a, b].sort((u, v) => u.x - v.x || u.y - v.y)
  return `${r2(p.x)},${r2(p.y)}|${r2(q.x)},${r2(q.y)}`
}

/** Every distinct line on the wall; a line two triangles share appears once, with both triangle ids. */
export function edgesOf(c: Constellation): EdgeView[] {
  const byKey = new Map<string, EdgeView>()
  for (const t of c.triangles) {
    for (let i = 0; i < 3; i++) {
      const a = t.points[i], b = t.points[(i + 1) % 3], key = keyOf(a, b)
      const seen = byKey.get(key)
      if (seen) seen.triangleIds.push(t.id)
      else byKey.set(key, { key, a, b, wordId: t.wordIds[i], triangleIds: [t.id] })
    }
  }
  return [...byKey.values()]
}

export function pointInTriangle(p: Pt, t: Tri): boolean {
  const s = (a: Pt, b: Pt, c: Pt) => (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y)
  const d1 = s(p, t[0], t[1]), d2 = s(p, t[1], t[2]), d3 = s(p, t[2], t[0])
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

/** Bounds of every point on the wall plus any ghost, for fitting the view. */
export function boundsOf(points: Pt[]) {
  if (!points.length) return { minX: -SIDE, maxX: SIDE, minY: -SIDE, maxY: SIDE }
  return {
    minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)),
  }
}
