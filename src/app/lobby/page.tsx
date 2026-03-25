import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getAppConfig } from '@/actions/config'
import { dbBase } from '@/lib/db'
import { slugify } from '@/lib/spatial-world/utils'
import { computeSpatialBindKey } from '@/lib/spatial-world/spatial-room-bind'
import { resolveAvatarConfigForPlayer, getWalkableSpriteUrl, parseAvatarConfig } from '@/lib/avatar-utils'
import Link from 'next/link'
import { zoneBackgroundStyle } from '@/lib/ui/zone-surfaces'
import { LobbyCanvas } from './LobbyCanvas'

export default async function LobbyPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const config = await getAppConfig()
  const mapId = config.defaultLobbyMapId ?? null

  if (!mapId) {
    return (
      <div
        className="min-h-screen text-zinc-400 flex flex-col items-center justify-center gap-6 p-8"
        style={zoneBackgroundStyle('lobby')}
      >
        <h1 className="text-xl font-bold text-white">Lobby</h1>
        <p className="text-center max-w-md">
          The global lobby is not yet configured. An admin can set a default map in config.
        </p>
        <div className="flex gap-4">
          <Link href="/game-map" className="text-purple-400 hover:text-purple-300 text-sm">
            ← Game Map
          </Link>
          <Link href="/campaign" className="text-purple-400 hover:text-purple-300 text-sm">
            Campaigns
          </Link>
        </div>
      </div>
    )
  }

  const spatialMap = await dbBase.spatialMap.findUnique({
    where: { id: mapId },
    include: {
      rooms: {
        include: { anchors: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!spatialMap || spatialMap.rooms.length === 0) {
    return (
      <div
        className="min-h-screen text-zinc-400 flex flex-col items-center justify-center gap-6 p-8"
        style={zoneBackgroundStyle('lobby')}
      >
        <h1 className="text-xl font-bold text-white">Lobby</h1>
        <p className="text-center max-w-md">
          The lobby map has no rooms. An admin can add rooms in the map editor.
        </p>
        <Link href="/game-map" className="text-purple-400 hover:text-purple-300 text-sm">
          ← Game Map
        </Link>
      </div>
    )
  }

  const spawnpoint = JSON.parse(spatialMap.spawnpoint) as { roomIndex: number; x: number; y: number }
  const roomIndex = Math.min(spawnpoint.roomIndex, spatialMap.rooms.length - 1)
  const room = spatialMap.rooms[roomIndex]!
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
