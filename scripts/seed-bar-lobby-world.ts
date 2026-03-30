/**
 * seed-bar-lobby-world.ts
 *
 * Seeds all 5 BAR Lobby World rooms into the database:
 *   - 4 nation rooms (Pyrakanth, Lamenth, Virelune, Argyra)
 *   - 1 trading floor (Card Club)
 *
 * Each room gets:
 *   - A SpatialMap (one shared lobby map)
 *   - A MapRoom with roomType, nationKey, backgroundUrl
 *   - SpatialMapAnchors for all anchor types defined in the seed
 *
 * Usage:
 *   npx tsx scripts/seed-bar-lobby-world.ts
 *   npx tsx scripts/seed-bar-lobby-world.ts --reset   (drops and re-seeds lobby map)
 *
 * Idempotent: checks for existing lobby map by name before creating.
 */

import { PrismaClient } from '@prisma/client'
import { resolveBbCampaignClearingWorldPath } from '../src/lib/spatial-world/bb-campaign-clearing-path'

const prisma = new PrismaClient()

const LOBBY_MAP_NAME = 'bar-lobby-world-v1'

// 10×10 tile grid for nation rooms, 15×10 for trading floor
// Minimal walkable tilemap — all tiles passable except border
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

const NATION_ROOMS = [
  {
    name: 'Pyrakanth Forge',
    slug: 'pyrakanth-forge',
    roomType: 'nation_room',
    nationKey: 'pyrakanth',
    backgroundUrl: '/lobby-art/pyrakanth-forge.png',
    sortOrder: 0,
    anchors: [
      { anchorType: 'crafting_forge',  tileX: 5, tileY: 2, label: 'Forge' },
      { anchorType: 'portal',          tileX: 9, tileY: 5, label: 'To Card Club', config: JSON.stringify({ targetSlug: 'card-club' }) },
    ],
  },
  {
    name: 'Lamenth Tide Hall',
    slug: 'lamenth-tide-hall',
    roomType: 'nation_room',
    nationKey: 'lamenth',
    backgroundUrl: '/lobby-art/lamenth-tide-hall.png',
    sortOrder: 1,
    anchors: [
      { anchorType: 'bar_table',  tileX: 5, tileY: 7, label: 'BAR Pool' },
      { anchorType: 'portal',     tileX: 9, tileY: 5, label: 'To Card Club' },
    ],
  },
  {
    name: 'Virelune Grove',
    slug: 'virelune-grove',
    roomType: 'nation_room',
    nationKey: 'virelune',
    backgroundUrl: '/lobby-art/virelune-grove.png',
    sortOrder: 2,
    anchors: [
      { anchorType: 'bar_table',  tileX: 5, tileY: 7, label: 'BAR Pool' },
      { anchorType: 'portal',     tileX: 9, tileY: 5, label: 'To Card Club' },
    ],
  },
  {
    name: 'Argyra Crystal Chamber',
    slug: 'argyra-crystal-chamber',
    roomType: 'nation_room',
    nationKey: 'argyra',
    backgroundUrl: '/lobby-art/argyra-crystal-chamber.png',
    sortOrder: 3,
    anchors: [
      { anchorType: 'bar_table',  tileX: 5, tileY: 7, label: 'BAR Pool' },
      { anchorType: 'portal',     tileX: 9, tileY: 5, label: 'To Card Club' },
    ],
  },
]

function cardClubAnchors(campaignClearingHref: string) {
  return [
    {
      anchorType: 'campaign_portal',
      tileX: 7,
      tileY: 1,
      label: 'Bruised Banana Campaign',
      config: JSON.stringify({ href: campaignClearingHref }),
    },
    {
      anchorType: 'librarian_v2_npc',
      tileX: 7,
      tileY: 2,
      label: 'Game Master Regent Face',
      config: JSON.stringify({ externalPath: '/hand/library' })
    },
    // Interior tile — (14,9) is map corner (impassable); no walkable neighbor within range 1 for Interact.
    { anchorType: 'giacomo_npc',      tileX: 12, tileY: 3,  label: 'Giacomo' },
    { anchorType: 'bar_table',        tileX: 7,  tileY: 7,  label: 'Cross-Nation BAR Pool' },
    { anchorType: 'nation_embassy',   tileX: 1,  tileY: 5,  label: 'Pyrakanth Embassy',  config: JSON.stringify({ nationKey: 'pyrakanth' }) },
    { anchorType: 'nation_embassy',   tileX: 3,  tileY: 5,  label: 'Lamenth Embassy',    config: JSON.stringify({ nationKey: 'lamenth' }) },
    { anchorType: 'nation_embassy',   tileX: 11, tileY: 5,  label: 'Virelune Embassy',   config: JSON.stringify({ nationKey: 'virelune' }) },
    { anchorType: 'nation_embassy',   tileX: 13, tileY: 5,  label: 'Argyra Embassy',     config: JSON.stringify({ nationKey: 'argyra' }) },
    { anchorType: 'portal',           tileX: 1,  tileY: 9,  label: 'To Pyrakanth',       config: JSON.stringify({ targetSlug: 'pyrakanth-forge' }) },
    { anchorType: 'portal',           tileX: 4,  tileY: 9,  label: 'To Lamenth',         config: JSON.stringify({ targetSlug: 'lamenth-tide-hall' }) },
    { anchorType: 'portal',           tileX: 10, tileY: 9,  label: 'To Virelune',        config: JSON.stringify({ targetSlug: 'virelune-grove' }) },
    { anchorType: 'portal',           tileX: 13, tileY: 9,  label: 'To Argyra',          config: JSON.stringify({ targetSlug: 'argyra-crystal-chamber' }) },
  ]
}

const TRADING_FLOOR = {
  name: 'Card Club',
  slug: 'card-club',
  roomType: 'trading_floor',
  nationKey: null,
  backgroundUrl: '/lobby-art/card-club.png',
  sortOrder: 4,
}

async function main() {
  const reset = process.argv.includes('--reset')

  if (reset) {
    const existing = await prisma.spatialMap.findFirst({ where: { name: LOBBY_MAP_NAME } })
    if (existing) {
      await prisma.spatialMap.delete({ where: { id: existing.id } })
      console.log('Deleted existing lobby map.')
    }
  }

  const existing = await prisma.spatialMap.findFirst({ where: { name: LOBBY_MAP_NAME } })
  if (existing && !reset) {
    console.log(`Lobby map already exists (id: ${existing.id}). Run with --reset to re-seed.`)
    return
  }

  const map = await prisma.spatialMap.create({
    data: {
      name:      LOBBY_MAP_NAME,
      mapType:   'lobby',
      spawnpoint: JSON.stringify({ roomIndex: 0, x: 5, y: 5 }),
    },
  })
  console.log(`Created SpatialMap: ${map.id}`)

  for (const room of NATION_ROOMS) {
    const created = await prisma.mapRoom.create({
      data: {
        mapId:         map.id,
        name:          room.name,
        slug:          room.slug,
        roomType:      room.roomType,
        nationKey:     room.nationKey,
        backgroundUrl: room.backgroundUrl,
        sortOrder:     room.sortOrder,
        tilemap:       buildTilemap(10, 10),
        anchors: {
          create: room.anchors.map(a => ({
            anchorType: a.anchorType,
            tileX:      a.tileX,
            tileY:      a.tileY,
            label:      a.label,
            config:     (a as { config?: string }).config ?? null,
          })),
        },
      },
    })
    console.log(`  Created room: ${created.slug} (${created.id})`)
  }

  const bbClearingHref = await resolveBbCampaignClearingWorldPath(prisma)
  const floor = await prisma.mapRoom.create({
    data: {
      mapId:         map.id,
      name:          TRADING_FLOOR.name,
      slug:          TRADING_FLOOR.slug,
      roomType:      TRADING_FLOOR.roomType,
      nationKey:     TRADING_FLOOR.nationKey,
      backgroundUrl: TRADING_FLOOR.backgroundUrl,
      sortOrder:     TRADING_FLOOR.sortOrder,
      tilemap:       buildTilemap(15, 10),
      anchors: {
        create: cardClubAnchors(bbClearingHref).map(a => ({
          anchorType: a.anchorType,
          tileX:      a.tileX,
          tileY:      a.tileY,
          label:      a.label,
          config:     (a as { config?: string }).config ?? null,
        })),
      },
    },
  })
  console.log(`  Created room: ${floor.slug} (${floor.id}) — campaign_portal → ${bbClearingHref}`)

  // Upsert a lobby Instance so /world routing can find it
  const instance = await prisma.instance.upsert({
    where: { slug: 'lobby' },
    update: { spatialMapId: map.id },
    create: {
      slug:       'lobby',
      name:       'BAR Lobby World',
      domainType: 'lobby',
      spatialMapId: map.id,
    },
  })
  console.log(`  Instance: ${instance.slug} (${instance.id})`)

  console.log()
  console.log('BAR Lobby World seeded successfully.')
  console.log(`  Map:  ${LOBBY_MAP_NAME} (${map.id})`)
  console.log(`  Rooms: ${NATION_ROOMS.length} nation rooms + 1 trading floor`)
  console.log()
}

main()
  .catch(err => {
    console.error('Seed error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
