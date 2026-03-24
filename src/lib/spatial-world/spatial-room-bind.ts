import type { AnchorData, TileMapData } from '@/lib/spatial-world/pixi-room'

/**
 * Deterministic layout fingerprint for a spatial room (tile walkability + anchor graph).
 * Same inputs → same revision (server or client). Used to decide when Pixi RoomRenderer
 * must be torn down and rebuilt vs. when only presentation (sprite URL) can update.
 */
export function computeSpatialLayoutRevision(
  tilemap: TileMapData,
  anchors: readonly AnchorData[],
): string {
  const sortedKeys = Object.keys(tilemap).sort()
  const normalizedTiles: Record<string, unknown> = {}
  for (const k of sortedKeys) {
    normalizedTiles[k] = tilemap[k]
  }
  const sortedAnchors = [...anchors].sort((a, b) => a.id.localeCompare(b.id))
  const payload = JSON.stringify({
    tiles: normalizedTiles,
    anchors: sortedAnchors.map(a => ({
      id: a.id,
      anchorType: a.anchorType,
      tileX: a.tileX,
      tileY: a.tileY,
      linkedId: a.linkedId ?? null,
      linkedType: a.linkedType ?? null,
      config: a.config ?? null,
    })),
  })
  return fnv1aHex(payload)
}

/**
 * Canonical bind key: room identity + layout revision.
 * Pass from server components so the contract is explicit in the data layer.
 */
export function computeSpatialBindKey(
  roomId: string,
  tilemap: TileMapData,
  anchors: readonly AnchorData[],
): string {
  return `${roomId}:${computeSpatialLayoutRevision(tilemap, anchors)}`
}

function fnv1aHex(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
