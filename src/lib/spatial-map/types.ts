/**
 * Spatial map types — aligned with gather-clone RealmData format.
 */

export type TilePoint = `${number}, ${number}`

export interface TileData {
  floor?: string
  above_floor?: string
  object?: string
  impassable?: boolean
  teleporter?: { roomIndex: number; x: number; y: number }
}

export interface RoomData {
  name: string
  tilemap: Record<TilePoint, TileData>
  channelId?: string
}

export interface RealmData {
  spawnpoint: { roomIndex: number; x: number; y: number }
  rooms: RoomData[]
}

export type Layer = 'floor' | 'above_floor' | 'object'
