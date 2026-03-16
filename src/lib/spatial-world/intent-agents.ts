import type { TileMapData, AgentData } from './pixi-room'

export interface PresenceRecord {
  id: string
  playerId: string
  playerName: string | null
  spriteUrl: string | null
  lastSeenAt: Date
  nation?: string | null
}

function fnv32(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0
  }
  return hash
}

export function computeAgentPositions(
  presences: PresenceRecord[],
  tilemap: TileMapData,
  currentPlayerId: string,
  thresholdMs = 30 * 60 * 1000
): AgentData[] {
  const now = Date.now()
  const offline = presences.filter(
    p => p.playerId !== currentPlayerId && (now - new Date(p.lastSeenAt).getTime()) > thresholdMs
  )

  const walkable = Object.entries(tilemap)
    .filter(([, t]) => !t.impassable && !!t.floor)
    .map(([key]) => {
      const [x, y] = key.split(',').map(s => parseInt(s.trim()))
      return { x: x ?? 0, y: y ?? 0 }
    })

  if (walkable.length === 0) return []

  return offline.map(p => {
    const seed = fnv32(p.id)
    const idx = seed % walkable.length
    const tile = walkable[idx]!
    return {
      playerId: p.playerId,
      playerName: p.playerName ?? 'Unknown',
      spriteUrl: p.spriteUrl,
      tileX: tile.x,
      tileY: tile.y,
      presenceId: p.id,
    }
  })
}
