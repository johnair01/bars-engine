/**
 * Build a discrete octagonal walkable hub (forest clearing) with portal placement
 * for campaign spoke exits + optional return to Card Club.
 */

export type OctagonTile = { floor: string; impassable?: boolean }

export type OctagonAnchorSeed = {
  anchorType: string
  tileX: number
  tileY: number
  label: string
  config?: string | null
  linkedId?: string | null
  linkedType?: string | null
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`
}

function inOctagon(dx: number, dy: number, R: number): boolean {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  const cap = Math.floor(R * 1.28)
  return ax + ay <= cap && ax <= R && ay <= R
}

/** Odd grid size ≥ 15; center tile is walkable hub interior. */
export function buildOctagonTilemap(size: number): Record<string, OctagonTile> {
  if (size % 2 === 0 || size < 15) {
    throw new Error('buildOctagonTilemap: size must be odd and ≥ 15')
  }
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const R = Math.floor(size / 2) - 2
  const tiles: Record<string, OctagonTile> = {}
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const inside = inOctagon(dx, dy, R)
      tiles[tileKey(x, y)] = inside ? { floor: 'default' } : { floor: 'default', impassable: true }
    }
  }
  return tiles
}

function walkable(tiles: Record<string, OctagonTile>, x: number, y: number, size: number): boolean {
  if (x < 0 || y < 0 || x >= size || y >= size) return false
  const t = tiles[tileKey(x, y)]
  return !!t && !t.impassable
}

/** Walkable tiles with at least one impassable 4-neighbor (perimeter of clearing). */
export function listOctagonEdgeTiles(
  tiles: Record<string, OctagonTile>,
  size: number
): { x: number; y: number }[] {
  const edge: { x: number; y: number }[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!walkable(tiles, x, y, size)) continue
      const neighborImpass =
        !walkable(tiles, x + 1, y, size) ||
        !walkable(tiles, x - 1, y, size) ||
        !walkable(tiles, x, y + 1, size) ||
        !walkable(tiles, x, y - 1, size)
      if (neighborImpass) edge.push({ x, y })
    }
  }
  return edge
}

/**
 * Eight spoke portals (angles 0..7) on the octagon rim + one south "Card Club" portal.
 */
export function buildOctagonCampaignHubAnchors(
  tiles: Record<string, OctagonTile>,
  size: number,
  campaignRef: string
): OctagonAnchorSeed[] {
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const edge = listOctagonEdgeTiles(tiles, size)
  if (edge.length < 10) {
    throw new Error('buildOctagonCampaignHubAnchors: octagon edge too small')
  }

  edge.sort((a, b) => {
    const ta = Math.atan2(a.y - cy, a.x - cx)
    const tb = Math.atan2(b.y - cy, b.x - cx)
    return ta - tb
  })

  // South return: bottom rim, near horizontal center
  const southCandidates = edge
    .filter(p => p.y >= cy)
    .sort((a, b) => b.y - a.y || Math.abs(a.x - cx) - Math.abs(b.x - cx))
  const cardClub = southCandidates[0]!
  const used = new Set<string>([tileKey(cardClub.x, cardClub.y)])

  const anchors: OctagonAnchorSeed[] = [
    {
      anchorType: 'portal',
      tileX: cardClub.x,
      tileY: cardClub.y,
      label: 'Card Club',
      config: JSON.stringify({ externalPath: '/world/lobby/card-club' }),
    },
  ]

  // Eight spokes at roughly equal angles; skip tiles already used
  for (let i = 0; i < 8; i++) {
    const targetAngle = -Math.PI / 2 + (i * (2 * Math.PI)) / 8
    let best: { x: number; y: number } | null = null
    let bestScore = Infinity
    for (const p of edge) {
      const k = tileKey(p.x, p.y)
      if (used.has(k)) continue
      const ang = Math.atan2(p.y - cy, p.x - cx)
      let diff = Math.abs(ang - targetAngle)
      if (diff > Math.PI) diff = 2 * Math.PI - diff
      if (diff < bestScore) {
        bestScore = diff
        best = p
      }
    }
    if (!best) {
      for (const p of edge) {
        const k = tileKey(p.x, p.y)
        if (!used.has(k)) {
          best = p
          break
        }
      }
    }
    if (!best) break
    used.add(tileKey(best.x, best.y))
    anchors.push({
      anchorType: 'spoke_portal',
      tileX: best.x,
      tileY: best.y,
      label: `Spoke ${i + 1}`,
      config: JSON.stringify({ spokeIndex: i, campaignRef }),
    })
  }

  return anchors
}

export function buildOctagonCampaignHubRoom(
  campaignRef: string,
  size = 25
): { tilemap: Record<string, OctagonTile>; anchors: OctagonAnchorSeed[] } {
  const tilemap = buildOctagonTilemap(size)
  const anchors = buildOctagonCampaignHubAnchors(tilemap, size, campaignRef)
  return { tilemap, anchors }
}
