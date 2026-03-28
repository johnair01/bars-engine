/**
 * Multi-room SpatialMap uses a single JSON `spawnpoint` on the map.
 * Resolve (x,y) for the current room: match `roomSlug` or `roomIndex`, else centroid of walkable tiles.
 */

export function findDefaultSpawnInTilemap(
  tilemap: Record<string, { floor?: string; impassable?: boolean }>
): { x: number; y: number } {
  const coords: { x: number; y: number }[] = []
  for (const [key, t] of Object.entries(tilemap)) {
    if (!t || t.impassable) continue
    const parts = key.split(',').map(s => s.trim())
    const xs = Number(parts[0])
    const ys = Number(parts[1])
    if (!Number.isFinite(xs) || !Number.isFinite(ys)) continue
    coords.push({ x: xs, y: ys })
  }
  if (coords.length === 0) return { x: 5, y: 5 }
  const mx = coords.reduce((a, c) => a + c.x, 0) / coords.length
  const my = coords.reduce((a, c) => a + c.y, 0) / coords.length
  let best = coords[0]!
  let bestD = Infinity
  for (const c of coords) {
    const d = (c.x - mx) ** 2 + (c.y - my) ** 2
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return { x: Math.floor(best.x), y: Math.floor(best.y) }
}

export function resolveSpawnForRoom(
  spawnpointRaw: string,
  currentRoomSlug: string,
  /** Same order as DB `orderBy: { sortOrder: 'asc' }` */
  roomsOrdered: { slug: string }[],
  tilemap: Record<string, { floor?: string; impassable?: boolean }>
): { x: number; y: number } {
  const roomIndex = roomsOrdered.findIndex(r => r.slug === currentRoomSlug)
  if (typeof spawnpointRaw !== 'string' || !spawnpointRaw.trim()) {
    return findDefaultSpawnInTilemap(tilemap)
  }
  try {
    const o = JSON.parse(spawnpointRaw) as {
      roomSlug?: string
      roomIndex?: number
      x?: number
      y?: number
    }
    if (typeof o.roomSlug === 'string' && o.roomSlug === currentRoomSlug) {
      if (typeof o.x === 'number' && typeof o.y === 'number') {
        return { x: Math.floor(o.x), y: Math.floor(o.y) }
      }
    }
    if (
      typeof o.roomIndex === 'number' &&
      o.roomIndex === roomIndex &&
      typeof o.x === 'number' &&
      typeof o.y === 'number'
    ) {
      return { x: Math.floor(o.x), y: Math.floor(o.y) }
    }
  } catch {
    /* fall through */
  }
  return findDefaultSpawnInTilemap(tilemap)
}
