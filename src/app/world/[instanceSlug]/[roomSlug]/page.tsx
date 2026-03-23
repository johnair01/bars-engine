import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { dbBase } from '@/lib/db'
import { slugify } from '@/lib/spatial-world/utils'
import { resolveAvatarConfigForPlayer, getWalkableSpriteUrl, parseAvatarConfig } from '@/lib/avatar-utils'
import { RoomCanvas } from './RoomCanvas'

export default async function WorldRoomPage({
  params,
}: {
  params: Promise<{ instanceSlug: string; roomSlug: string }>
}) {
  const { instanceSlug, roomSlug } = await params
  const player = await getCurrentPlayer()
  if (!player) redirect('/conclave/guided')
  if (!isGameAccountReady(player)) redirect('/conclave/guided')

  const instance = await dbBase.instance.findUnique({
    where: { slug: instanceSlug },
    include: {
      spatialMap: {
        include: {
          rooms: {
            include: { anchors: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  if (!instance?.spatialMap) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex items-center justify-center">
        <p>No world configured for this instance.</p>
      </div>
    )
  }

  const rooms = instance.spatialMap.rooms
  const room = rooms.find(r => (r.slug ?? slugify(r.name)) === roomSlug)
  if (!room) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex items-center justify-center">
        <p>Room not found.</p>
      </div>
    )
  }

  const spawnpoint = JSON.parse(instance.spatialMap.spawnpoint) as { roomIndex: number; x: number; y: number }
  const tilemap = JSON.parse(room.tilemap) as Record<string, { floor?: string; impassable?: boolean; object?: string }>

  const allRooms = rooms.map(r => ({ id: r.id, name: r.name, slug: r.slug ?? slugify(r.name) }))

  const anchors = room.anchors.map(a => ({
    id: a.id,
    anchorType: a.anchorType,
    tileX: a.tileX,
    tileY: a.tileY,
    label: a.label,
    linkedId: a.linkedId,
    linkedType: a.linkedType,
    config: a.config ?? null,
  }))

  const avatarConfig = resolveAvatarConfigForPlayer(player)
  const walkableSpriteUrl = avatarConfig
    ? getWalkableSpriteUrl(parseAvatarConfig(avatarConfig))
    : null

  return (
    <RoomCanvas
      player={{
        id: player.id,
        name: player.name,
        avatarConfig: avatarConfig ?? null,
        walkableSpriteUrl,
      }}
      room={{ id: room.id, name: room.name, tilemap, anchors }}
      allRooms={allRooms}
      instanceSlug={instanceSlug}
      spawnX={spawnpoint.x}
      spawnY={spawnpoint.y}
    />
  )
}
