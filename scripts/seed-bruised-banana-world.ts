#!/usr/bin/env tsx
import './require-db-env'
import { PrismaClient } from '@prisma/client'
import { slugify } from '../src/lib/spatial-world/utils'

const db = new PrismaClient()

function generateTilemap(width: number, height: number): Record<string, { floor?: string; impassable?: boolean }> {
  const tilemap: Record<string, { floor?: string; impassable?: boolean }> = {}
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const isEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1
      tilemap[`${x}, ${y}`] = isEdge ? { impassable: true } : { floor: 'default' }
    }
  }
  return tilemap
}

async function main() {
  // Create or find SpatialMap
  let spatialMap = await db.spatialMap.findFirst({ where: { name: 'Bruised Banana House' } })
  if (!spatialMap) {
    spatialMap = await db.spatialMap.create({
      data: {
        name: 'Bruised Banana House',
        mapType: 'world',
        spawnpoint: JSON.stringify({ roomIndex: 0, x: 5, y: 7 }),
      }
    })
    console.log('Created SpatialMap:', spatialMap.id)
  }

  const rooms = [
    { name: 'Living Room', width: 20, height: 15 },
    { name: 'Kitchen', width: 12, height: 10 },
    { name: 'Back Porch', width: 10, height: 8 },
  ]

  const createdRooms: Record<string, string> = {}
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i]!
    const slug = slugify(r.name)
    const tilemap = generateTilemap(r.width, r.height)
    const existing = await db.mapRoom.findFirst({ where: { mapId: spatialMap.id, slug } })
    let room
    if (existing) {
      room = await db.mapRoom.update({
        where: { id: existing.id },
        data: { tilemap: JSON.stringify(tilemap), sortOrder: i },
      })
    } else {
      room = await db.mapRoom.create({
        data: {
          mapId: spatialMap.id,
          name: r.name,
          slug,
          tilemap: JSON.stringify(tilemap),
          sortOrder: i,
        }
      })
    }
    createdRooms[r.name] = room.id
    console.log(`Room: ${r.name} (${room.id})`)
  }

  // Seed anchors for Living Room
  const livingRoomId = createdRooms['Living Room']!
  const kitchenId = createdRooms['Kitchen']!

  const anchors = [
    { anchorType: 'quest_board', tileX: 3, tileY: 3, label: 'Quest Board', linkedType: 'custom_bar' },
    { anchorType: 'bar_table', tileX: 10, tileY: 3, label: 'BAR Exchange' },
    { anchorType: 'anomaly', tileX: 10, tileY: 10, label: 'Anomaly Portal', linkedType: 'alchemy_scene' },
    { anchorType: 'portal', tileX: 3, tileY: 10, label: 'Kitchen →', linkedId: kitchenId, linkedType: 'room' },
  ]

  for (const anchor of anchors) {
    const existing = await db.spatialMapAnchor.findFirst({
      where: { roomId: livingRoomId, anchorType: anchor.anchorType, tileX: anchor.tileX, tileY: anchor.tileY }
    })
    if (!existing) {
      await db.spatialMapAnchor.create({ data: { roomId: livingRoomId, ...anchor } })
      console.log(`Anchor: ${anchor.label}`)
    }
  }

  // Link to bruised-banana instance
  const instance = await db.instance.findFirst({ where: { slug: 'bruised-banana' } })
  if (instance && !instance.spatialMapId) {
    await db.instance.update({ where: { id: instance.id }, data: { spatialMapId: spatialMap.id } })
    console.log('Linked to bruised-banana instance')
  }

  console.log('Done!')
}

main().catch(console.error).finally(() => db.$disconnect())
