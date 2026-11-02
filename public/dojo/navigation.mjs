// Plan a stable path through the circular practice hall. Coordinates are X/Z
// pairs; the central exclusion includes the bowl and stools. No DOM or THREE.
export const INNER_RADIUS = 1.7
export const OUTER_RADIUS = 5.1
const RING_RADIUS = 2.12
const SEGMENTS = 32
const EPS = 1e-7
const length = p => Math.hypot(p.x, p.z)
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

export function clampDestination(p) {
  const r = length(p)
  if (!Number.isFinite(r) || r < EPS) return null
  const k = Math.min(4.8, Math.max(1.8, r)) / r
  return { x: p.x * k, z: p.z * k }
}

export function segmentIsClear(a, b) {
  if (length(a) < INNER_RADIUS - EPS || length(b) < INNER_RADIUS - EPS || length(a) > OUTER_RADIUS + EPS || length(b) > OUTER_RADIUS + EPS) return false
  const x = b.x - a.x, z = b.z - a.z, denom = x * x + z * z
  const t = denom < EPS ? 0 : Math.max(0, Math.min(1, -(a.x * x + a.z * z) / denom))
  // Keep a margin for small frame steps; allow a traveller already near the
  // boundary to move outward without requiring them to teleport first.
  const clearance = Math.min(INNER_RADIUS + .08, length(a), length(b))
  return Math.hypot(a.x + t * x, a.z + t * z) >= clearance - EPS
}

export function planRoute(start, requested) {
  const dest = clampDestination(requested)
  if (!dest || !Number.isFinite(start.x) || !Number.isFinite(start.z) || length(start) < INNER_RADIUS - EPS || length(start) > OUTER_RADIUS + EPS) return null
  if (distance(start, dest) < .04) return [dest]
  const nodes = [start, dest]
  for (let i = 0; i < SEGMENTS; i++) {
    const angle = i * Math.PI * 2 / SEGMENTS
    nodes.push({ x: RING_RADIUS * Math.cos(angle), z: RING_RADIUS * Math.sin(angle) })
  }
  const best = nodes.map(() => Infinity), prev = nodes.map(() => -1), visited = nodes.map(() => false)
  best[0] = 0
  for (let i = 0; i < nodes.length; i++) {
    let u = -1
    for (let j = 0; j < nodes.length; j++) if (!visited[j] && (u < 0 || best[j] < best[u])) u = j
    if (u < 0 || !Number.isFinite(best[u]) || u === 1) break
    visited[u] = true
    for (let v = 1; v < nodes.length; v++) {
      if (visited[v] || !segmentIsClear(nodes[u], nodes[v])) continue
      const next = best[u] + distance(nodes[u], nodes[v])
      if (next < best[v]) { best[v] = next; prev[v] = u }
    }
  }
  if (!Number.isFinite(best[1])) return null
  const result = []
  for (let v = 1; v !== 0; v = prev[v]) {
    if (v < 0) return null
    result.push({ ...nodes[v] })
  }
  return result.reverse()
}
