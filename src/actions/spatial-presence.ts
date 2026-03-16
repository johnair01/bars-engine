'use server'

import { dbBase } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'

export type MapPresence = {
  playerId: string
  name: string
  roomIndex: number
  x: number
  y: number
  direction: string
  avatarConfig: string | null
}

/**
 * Enter a spatial map. Sets player position to spawnpoint.
 * Creates or updates PlayerMapPresence.
 */
export async function enterSpatialMap(
  mapId: string
): Promise<{ success: boolean; position?: { roomIndex: number; x: number; y: number }; error?: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { success: false, error: 'Authentication required' }

    const map = await dbBase.spatialMap.findUnique({
      where: { id: mapId },
      include: { rooms: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!map) return { success: false, error: 'Map not found' }
    if (!map.rooms.length) return { success: false, error: 'Map has no rooms' }

    const spawnpoint = JSON.parse(map.spawnpoint) as { roomIndex: number; x: number; y: number }
    const roomIndex = Math.min(spawnpoint.roomIndex, map.rooms.length - 1)
    const room = map.rooms[roomIndex]
    if (!room) return { success: false, error: 'Invalid spawn room' }

    const x = spawnpoint.x ?? 0
    const y = spawnpoint.y ?? 0

    await dbBase.playerMapPresence.upsert({
      where: {
        playerId_mapId: { playerId: player.id, mapId },
      },
      create: {
        playerId: player.id,
        mapId,
        roomIndex,
        x,
        y,
        direction: 'south',
      },
      update: {
        roomIndex,
        x,
        y,
        direction: 'south',
      },
    })

    return { success: true, position: { roomIndex, x, y } }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to enter map'
    console.error('[SPATIAL] enterSpatialMap error:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Update player position on a spatial map.
 */
export async function updateMapPosition(
  mapId: string,
  roomIndex: number,
  x: number,
  y: number,
  direction: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { success: false, error: 'Authentication required' }

    const validDirections = ['north', 'south', 'east', 'west']
    const dir = validDirections.includes(direction) ? direction : 'south'

    await dbBase.playerMapPresence.upsert({
      where: {
        playerId_mapId: { playerId: player.id, mapId },
      },
      create: {
        playerId: player.id,
        mapId,
        roomIndex,
        x,
        y,
        direction: dir,
      },
      update: {
        roomIndex,
        x,
        y,
        direction: dir,
      },
    })

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update position'
    console.error('[SPATIAL] updateMapPosition error:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Get all players currently on a spatial map.
 */
export async function getMapPresences(mapId: string): Promise<{
  presences: MapPresence[]
  error?: string
}> {
  try {
    const presences = await dbBase.playerMapPresence.findMany({
      where: { mapId },
      include: {
        player: {
          select: { id: true, name: true, avatarConfig: true },
        },
      },
    })

    return {
      presences: presences.map((p) => ({
        playerId: p.player.id,
        name: p.player.name,
        roomIndex: p.roomIndex,
        x: p.x,
        y: p.y,
        direction: p.direction,
        avatarConfig: p.player.avatarConfig,
      })),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to get presences'
    console.error('[SPATIAL] getMapPresences error:', msg)
    return { presences: [], error: msg }
  }
}
