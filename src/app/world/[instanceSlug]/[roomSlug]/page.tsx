/**
 * @page /world/:instanceSlug/:roomSlug
 * @entity CAMPAIGN
 * @description Spatial world room canvas for instance-based gameplay with avatar movement
 * @permissions authenticated, game_account_ready
 * @params instanceSlug:string (path, required) - Campaign instance slug
 * @params roomSlug:string (path, required) - Room slug within spatial map
 * @relationships CAMPAIGN (Instance, SpatialMap, SpatialRoom), PLAYER (avatar config, membership)
 * @dimensions WHO:player+avatar, WHAT:spatial room, WHERE:campaign instance, ENERGY:room navigation
 * @example /world/lobby/main-hall
 * @agentDiscoverable false
 */
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { dbBase } from '@/lib/db'
import { slugify } from '@/lib/spatial-world/utils'
import { computeSpatialBindKey } from '@/lib/spatial-world/spatial-room-bind'
import { resolveSpawnForRoom } from '@/lib/spatial-world/spawn-resolver'
import { resolveAvatarConfigForPlayer, getWalkableSpriteUrl, parseAvatarConfig } from '@/lib/avatar-utils'
import { getSpokeStatesForRoom } from '@/actions/campaign-spoke-states'
import {
  canAccessNationRoom,
  formatNationKeyForDisplay,
  getPlayerNationKey,
  isNationRestrictedRoom,
  resolveNationGateBypass,
} from '@/lib/world/nation-room-gate'
import { NationRoomBlocked } from '@/components/world/NationRoomBlocked'
import { RoomCanvas } from './RoomCanvas'

function parseTilemapJson(raw: string): Record<string, { floor?: string; impassable?: boolean; object?: string }> {
  try {
    const o = JSON.parse(raw) as unknown
    if (!o || typeof o !== 'object' || Array.isArray(o)) return {}
    return o as Record<string, { floor?: string; impassable?: boolean; object?: string }>
  } catch {
    return {}
  }
}

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

  const tilemap = parseTilemapJson(room.tilemap)
  const roomsOrdered = rooms.map(r => ({ slug: r.slug ?? slugify(r.name) }))
  const spawnpoint = resolveSpawnForRoom(
    instance.spatialMap.spawnpoint,
    room.slug ?? slugify(room.name),
    roomsOrdered,
    tilemap
  )
  if (Object.keys(tilemap).length === 0) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex items-center justify-center px-6 text-center max-w-lg mx-auto">
        <p>
          Room tile data is missing or invalid. Re-seed the lobby map (e.g.{' '}
          <code className="text-zinc-300">npx tsx scripts/seed-bar-lobby-world.ts</code>) or check MapRoom.tilemap
          in the database.
        </p>
      </div>
    )
  }

  const playerNationKey = getPlayerNationKey(player)
  const isAdmin = player.roles.some((r) => r.role.key === 'admin')
  const bypassNationGate = resolveNationGateBypass(isAdmin)
  const roomNationKey = room.nationKey ?? null
  const roomType = room.roomType ?? null
  if (
    isNationRestrictedRoom(roomType) &&
    roomNationKey &&
    !canAccessNationRoom(roomNationKey, playerNationKey, bypassNationGate)
  ) {
    return (
      <NationRoomBlocked
        instanceSlug={instanceSlug}
        nationDisplayName={formatNationKeyForDisplay(roomNationKey)}
      />
    )
  }

  const allRooms = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug ?? slugify(r.name),
    roomType: r.roomType ?? null,
    nationKey: r.nationKey ?? null,
  }))

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

  const spatialBindKey = computeSpatialBindKey(room.id, tilemap, anchors)

  // Fetch spoke states only for rooms that have spoke_portal anchors
  const hasSpokePortals = anchors.some(a => a.anchorType === 'spoke_portal')
  const spokeSeedStates = hasSpokePortals && instance.campaignRef
    ? await getSpokeStatesForRoom(instance.campaignRef, player.id)
    : undefined

  return (
    <RoomCanvas
      spatialBindKey={spatialBindKey}
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
      spokeSeedStates={spokeSeedStates}
      playerNationKey={playerNationKey}
      bypassNationGate={bypassNationGate}
    />
  )
}
