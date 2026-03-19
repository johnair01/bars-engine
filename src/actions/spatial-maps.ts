'use server'

import { dbBase } from '@/lib/db'
import { slugify } from '@/lib/spatial-world/utils'

export type RealmData = {
  spawnpoint: { roomIndex: number; x: number; y: number }
  rooms: Array<{
    name: string
    tilemap: Record<string, { floor?: string; above_floor?: string; object?: string; impassable?: boolean; teleporter?: { roomIndex: number; x: number; y: number } }>
    channelId?: string
  }>
}

export async function listSpatialMaps() {
  return dbBase.spatialMap.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { rooms: { orderBy: { sortOrder: 'asc' } } },
  })
}

export async function getSpatialMap(id: string) {
  const map = await dbBase.spatialMap.findUnique({
    where: { id },
    include: { rooms: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!map) return null
  const spawnpoint = JSON.parse(map.spawnpoint) as RealmData['spawnpoint']
  const rooms = map.rooms.map((r) => ({
    name: r.name,
    tilemap: JSON.parse(r.tilemap) as RealmData['rooms'][0]['tilemap'],
    channelId: r.channelId ?? undefined,
  }))
  return { ...map, realmData: { spawnpoint, rooms } as RealmData }
}

export async function createSpatialMap(input: { name: string; mapType: string; instanceId?: string }) {
  const realmData: RealmData = {
    spawnpoint: { roomIndex: 0, x: 0, y: 0 },
    rooms: [{ name: 'Room 1', tilemap: {} }],
  }
  return dbBase.spatialMap.create({
    data: {
      name: input.name,
      mapType: input.mapType,
      instanceId: input.instanceId ?? null,
      spawnpoint: JSON.stringify(realmData.spawnpoint),
      rooms: {
        create: realmData.rooms.map((r, i) => ({
          name: r.name,
          tilemap: JSON.stringify(r.tilemap),
          sortOrder: i,
        })),
      },
    },
    include: { rooms: true },
  })
}

export async function saveSpatialMapRealmData(id: string, realmData: RealmData) {
  const existing = await dbBase.spatialMap.findUnique({ where: { id }, include: { rooms: true } })
  if (!existing) return { success: false, error: 'Map not found' }

  await dbBase.$transaction(async (tx) => {
    await tx.spatialMap.update({
      where: { id },
      data: { spawnpoint: JSON.stringify(realmData.spawnpoint), updatedAt: new Date() },
    })

    // Upsert rooms by (mapId, slug) to preserve anchors on existing rooms
    const incomingSlugs: string[] = []
    for (let i = 0; i < realmData.rooms.length; i++) {
      const r = realmData.rooms[i]!
      const slug = slugify(r.name)
      incomingSlugs.push(slug)
      await tx.mapRoom.upsert({
        where: { mapId_slug: { mapId: id, slug } },
        update: {
          name: r.name,
          tilemap: JSON.stringify(r.tilemap),
          sortOrder: i,
          channelId: r.channelId ?? null,
        },
        create: {
          mapId: id,
          name: r.name,
          slug,
          tilemap: JSON.stringify(r.tilemap),
          sortOrder: i,
          channelId: r.channelId ?? null,
        },
      })
    }

    // Delete rooms no longer in incoming set
    await tx.mapRoom.deleteMany({
      where: { mapId: id, slug: { notIn: incomingSlugs } },
    })
  })
  return { success: true }
}

export async function updateMapRoomGraphNode(roomId: string, graphNodeId: string | null) {
  await dbBase.mapRoom.update({
    where: { id: roomId },
    data: { graphNodeId },
  })
}

export type CreateAnchorInput = {
  roomId: string
  anchorType: string
  tileX: number
  tileY: number
  label?: string | null
  linkedId?: string | null
  linkedType?: string | null
  config?: string | null
}

export async function listAnchorsForRoom(roomId: string) {
  return dbBase.spatialMapAnchor.findMany({
    where: { roomId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createAnchor(input: CreateAnchorInput) {
  return dbBase.spatialMapAnchor.create({ data: input })
}

export async function updateAnchor(anchorId: string, data: Partial<CreateAnchorInput>) {
  return dbBase.spatialMapAnchor.update({ where: { id: anchorId }, data })
}

export async function deleteAnchor(anchorId: string) {
  return dbBase.spatialMapAnchor.delete({ where: { id: anchorId } })
}

/**
 * Deep link for Phase 4 “Enter the space” — first room of the instance’s SpatialMap.
 * Matches `/world/[instanceSlug]/[roomSlug]` (Gather-style tile venue).
 */
export async function getWorldVenueEntryForInstance(
  instanceId: string
): Promise<{ href: string; mapName: string; roomName: string } | null> {
  const instance = await dbBase.instance.findUnique({
    where: { id: instanceId },
    select: {
      slug: true,
      spatialMap: {
        select: {
          name: true,
          rooms: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
            select: { name: true, slug: true },
          },
        },
      },
    },
  })
  const first = instance?.spatialMap?.rooms?.[0]
  if (!instance || !first) return null

  const roomSlug = first.slug?.trim() ? first.slug : slugify(first.name)
  if (!roomSlug) return null

  return {
    href: `/world/${instance.slug}/${roomSlug}`,
    mapName: instance.spatialMap!.name,
    roomName: first.name,
  }
}
