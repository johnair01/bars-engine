import type { RealmData, TileData } from '../types'
import type { MapImportAdapter } from './adapter'
import type { MapImportResult } from './adapter'

function normalizeTileKey(key: string): string {
  const m = key.match(/^(-?\d+)\s*,\s*(-?\d+)$/)
  if (!m) return key
  return `${parseInt(m[1]!, 10)}, ${parseInt(m[2]!, 10)}`
}

function parseTilemap(raw: unknown): Record<string, TileData> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, TileData> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue
    const tile = v as Record<string, unknown>
    const key = normalizeTileKey(k)
    out[key] = {
      floor: typeof tile.floor === 'string' ? tile.floor : undefined,
      above_floor: typeof tile.above_floor === 'string' ? tile.above_floor : undefined,
      object: typeof tile.object === 'string' ? tile.object : undefined,
      impassable: tile.impassable === true,
      teleporter:
        tile.teleporter && typeof tile.teleporter === 'object'
          ? {
              roomIndex: Number((tile.teleporter as Record<string, unknown>).roomIndex) || 0,
              x: Number((tile.teleporter as Record<string, unknown>).x) || 0,
              y: Number((tile.teleporter as Record<string, unknown>).y) || 0,
            }
          : undefined,
    }
  }
  return out
}

function parseRoom(raw: unknown): RealmData['rooms'][0] | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const name = typeof r.name === 'string' ? r.name : 'Room'
  const tilemap = parseTilemap(r.tilemap)
  const channelId = typeof r.channelId === 'string' ? r.channelId : undefined
  return { name, tilemap, channelId }
}

function parseSpawnpoint(raw: unknown): RealmData['spawnpoint'] | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  const roomIndex = Number(s.roomIndex)
  const x = Number(s.x)
  const y = Number(s.y)
  if (Number.isNaN(roomIndex) || Number.isNaN(x) || Number.isNaN(y)) return null
  return { roomIndex, x, y }
}

export const JsonRealmAdapter: MapImportAdapter = {
  format: 'json',
  canParse(raw: string): boolean {
    try {
      JSON.parse(raw)
      return true
    } catch {
      return false
    }
  },
  parse(raw: string): MapImportResult | null {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return null
    }
    const warnings: string[] = []
    if (!parsed || typeof parsed !== 'object') return null
    const obj = parsed as Record<string, unknown>
    const roomsRaw = Array.isArray(obj.rooms) ? obj.rooms : []
    const rooms: RealmData['rooms'] = []
    for (let i = 0; i < roomsRaw.length; i++) {
      const room = parseRoom(roomsRaw[i])
      if (room) {
        rooms.push(room)
      } else {
        warnings.push(`Room ${i} skipped: invalid format`)
      }
    }
    if (rooms.length === 0) {
      rooms.push({ name: 'Room 1', tilemap: {} })
      warnings.push('No valid rooms; added default Room 1')
    }
    const spawnpoint = parseSpawnpoint(obj.spawnpoint) ?? {
      roomIndex: 0,
      x: 0,
      y: 0,
    }
    if (spawnpoint.roomIndex >= rooms.length) {
      spawnpoint.roomIndex = 0
      warnings.push('Spawnpoint roomIndex out of range; set to 0')
    }
    return { realmData: { spawnpoint, rooms }, warnings }
  },
}
