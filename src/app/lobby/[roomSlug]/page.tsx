import { redirect, notFound } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getAppConfig } from '@/actions/config'
import { dbBase } from '@/lib/db'
import { slugify } from '@/lib/spatial-world/utils'
import { computeSpatialBindKey } from '@/lib/spatial-world/spatial-room-bind'
import { resolveAvatarConfigForPlayer, getWalkableSpriteUrl, parseAvatarConfig } from '@/lib/avatar-utils'
import { LobbyCanvas } from '../LobbyCanvas'

/**
 * @page /lobby/:roomSlug
 * @entity SYSTEM
 * @description Lobby spatial room - multiplayer canvas with avatar movement and anchors
 * @permissions authenticated
 * @params roomSlug:string (path, required) - Room slug from spatial map
 * @relationships loads spatial map room with tilemap and anchors, renders player avatars
 * @energyCost 0 (lobby presence, no game state change)
 * @dimensions WHO:playerId+avatarConfig, WHAT:SYSTEM, WHERE:lobby, ENERGY:N/A, PERSONAL_THROUGHPUT:gather
 * @example /lobby/main-room
 * @agentDiscoverable false
 */
export default async function LobbyRoomPage({
  params,
}: {
  params: Promise<{ roomSlug: string }>
}) {
  const { roomSlug } = await params
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const config = await getAppConfig()
  const mapId = config.defaultLobbyMapId ?? null

  if (!mapId) redirect('/lobby')

  const spatialMap = await dbBase.spatialMap.findUnique({
    where: { id: mapId },
    include: {
      rooms: {
        include: { anchors: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!spatialMap) redirect('/lobby')

  const room = spatialMap.rooms.find(r => slugify(r.name) === roomSlug)
  if (!room) notFound()

  const spawnpoint = JSON.parse(spatialMap.spawnpoint) as { roomIndex: number; x: number; y: number }
  const tilemap = JSON.parse(room.tilemap) as Record<string, { floor?: string; impassable?: boolean; object?: string }>

  const allRooms = spatialMap.rooms.map(r => ({ id: r.id, name: r.name, slug: slugify(r.name) }))
  const anchors = room.anchors.map(a => ({
    id: a.id,
    anchorType: a.anchorType,
    tileX: a.tileX,
    tileY: a.tileY,
    label: a.label,
    linkedId: a.linkedId,
    linkedType: a.linkedType,
  }))

  const avatarConfig = resolveAvatarConfigForPlayer(player)
  const walkableSpriteUrl = avatarConfig
    ? getWalkableSpriteUrl(parseAvatarConfig(avatarConfig))
    : null

  const spatialBindKey = computeSpatialBindKey(room.id, tilemap, anchors)

  return (
    <LobbyCanvas
      spatialBindKey={spatialBindKey}
      player={{
        id: player.id,
        name: player.name,
        avatarConfig: avatarConfig ?? null,
        walkableSpriteUrl,
      }}
      room={{ id: room.id, name: room.name, tilemap, anchors }}
      allRooms={allRooms}
      spawnX={spawnpoint.x}
      spawnY={spawnpoint.y}
      mapName={spatialMap.name}
    />
  )
}
