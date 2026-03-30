/**
 * seed-challenger-world.ts
 *
 * Seeds the Level 2 "Arena of Tensions" into the database.
 * This hub is gated by the "Shaman Handshake" and features Combat Encounters.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CHALLENGER_MAP_NAME = 'challenger-arena-v1'

function buildTilemap(width: number, height: number): string {
  const tiles: Record<string, { floor: boolean; impassable?: boolean }> = {}
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1
      tiles[`${x},${y}`] = { floor: true, impassable: isBorder || undefined }
    }
  }
  return JSON.stringify(tiles)
}

const ARENA_ROOM = {
  name: 'Arena of Tensions',
  slug: 'arena-of-tensions',
  roomType: 'gladitorial_hub',
  backgroundUrl: '/lobby-art/arena-red.png', // Mock URL
  anchors: [
    { anchorType: 'spoke_portal',    tileX: 1,  tileY: 5,  label: 'Back to Lobby', config: JSON.stringify({ targetInstance: 'lobby', targetRoom: 'card-club' }) },
    { anchorType: 'encounter_spawn', tileX: 7,  tileY: 3,  label: 'Wild Grass (Level 2)' },
    { anchorType: 'encounter_spawn', tileX: 12, tileY: 7,  label: 'Wild Grass (Level 2)' },
    { anchorType: 'bar_table',       tileX: 7,  tileY: 5,  label: 'Combat Staging' },
  ],
}

async function main() {
  const reset = process.argv.includes('--reset')

  if (reset) {
    const existing = await prisma.spatialMap.findFirst({ where: { name: CHALLENGER_MAP_NAME } })
    if (existing) {
      await prisma.spatialMap.delete({ where: { id: existing.id } })
      console.log('Deleted existing challenger map.')
    }
  }

  const existing = await prisma.spatialMap.findFirst({ where: { name: CHALLENGER_MAP_NAME } })
  if (existing && !reset) {
    console.log(`Challenger map already exists (id: ${existing.id}).`)
    return
  }

  const map = await prisma.spatialMap.create({
    data: {
      name:      CHALLENGER_MAP_NAME,
      mapType:   'campaign_hub',
      spawnpoint: JSON.stringify({ roomIndex: 0, x: 2, y: 5 }),
    },
  })

  await prisma.mapRoom.create({
    data: {
      mapId:         map.id,
      name:          ARENA_ROOM.name,
      slug:          ARENA_ROOM.slug,
      roomType:      ARENA_ROOM.roomType,
      backgroundUrl: ARENA_ROOM.backgroundUrl,
      tilemap:       buildTilemap(15, 10),
      anchors: {
        create: ARENA_ROOM.anchors.map(a => ({
          anchorType: a.anchorType,
          tileX:      a.tileX,
          tileY:      a.tileY,
          label:      a.label,
          config:     a.config || null,
        })),
      },
    },
  })

  // Instance for /world/challenger/arena-of-tensions
  await prisma.instance.upsert({
    where: { slug: 'challenger' },
    update: { spatialMapId: map.id },
    create: {
      slug:       'challenger',
      name:       'The Arena of Tensions',
      domainType: 'campaign',
      spatialMapId: map.id,
    },
  })

  console.log(`Successfully seeded Challenger World (Level 2) Hub.`)
}

main()
  .catch(err => {
    console.error('Seed error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
