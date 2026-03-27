/**
 * @page /world
 * @entity CAMPAIGN
 * @description World/spatial map entry page - redirects to player's active campaign instance room
 * @permissions authenticated
 * @relationships CAMPAIGN (Instance), PLAYER (membership)
 * @dimensions WHO:player, WHAT:spatial navigation, WHERE:world map, ENERGY:instance access
 * @example /world
 * @agentDiscoverable false
 */
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { dbBase } from '@/lib/db'
import { slugify } from '@/lib/spatial-world/utils'
import { parseAvatarConfig } from '@/lib/avatar-utils'

const LOBBY_MAP_NAME = 'bar-lobby-world-v1'
const LOBBY_INSTANCE_SLUG = 'lobby'

export default async function WorldPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/')

  // 1. Try player's active instance membership first (existing world system)
  const membership = await dbBase.instanceMembership.findFirst({
    where: { playerId: player.id },
    include: {
      instance: {
        include: {
          spatialMap: {
            include: {
              rooms: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const membershipMap = membership?.instance?.spatialMap
  const membershipFirstRoom = membershipMap?.rooms?.[0]

  if (membershipMap && membershipFirstRoom && membership) {
    // Skip the lobby instance itself — fall through to nation routing below
    if (membership.instance.slug !== LOBBY_INSTANCE_SLUG) {
      const instanceSlug = membership.instance.slug
      const roomSlug = membershipFirstRoom.slug || slugify(membershipFirstRoom.name)
      redirect(`/world/${instanceSlug}/${roomSlug}`)
    }
  }

  // 2. Fallback: route to BAR Lobby World, nation room for the player's nation
  const lobbyMap = await dbBase.spatialMap.findFirst({
    where: { name: LOBBY_MAP_NAME },
    include: { rooms: { orderBy: { sortOrder: 'asc' } } },
  })

  if (lobbyMap && lobbyMap.rooms.length > 0) {
    const avatarConfig = player.avatarConfig ? parseAvatarConfig(player.avatarConfig) : null
    const nationKey = avatarConfig?.nationKey ?? null

    // Route Meridia (earth) to a deterministic random nation room based on playerId
    const NATION_KEYS = ['pyrakanth', 'lamenth', 'virelune', 'argyra']
    const nationRooms = lobbyMap.rooms.filter(r => r.roomType === 'nation_room')

    let targetRoom: typeof lobbyMap.rooms[number] | undefined

    if (nationKey === 'meridia') {
      // Deterministic: hash playerId to pick a nation room
      const hash = player.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      targetRoom = nationRooms[hash % nationRooms.length]
    } else if (nationKey && NATION_KEYS.includes(nationKey)) {
      targetRoom = nationRooms.find(r => r.nationKey === nationKey)
    }

    // Default to Card Club if no nation room found
    targetRoom ??= lobbyMap.rooms.find(r => r.roomType === 'trading_floor') ?? lobbyMap.rooms[0]
    const roomSlug = targetRoom.slug || slugify(targetRoom.name)
    redirect(`/world/${LOBBY_INSTANCE_SLUG}/${roomSlug}`)
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-zinc-500">No world configured yet.</p>
        <a href="/game-map" className="text-purple-400 hover:text-purple-300 text-sm">← Back to Game Map</a>
      </div>
    </div>
  )
}
