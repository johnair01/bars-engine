#!/usr/bin/env tsx
/**
 * Seed nursery rooms for a spoke on the Bruised Banana campaign.
 *
 * Creates 5 MapRoom rows per spoke:
 *   1 introduction room (6 face NPCs + 4 nursery portals + hub return)
 *   4 nursery rooms (Wake Up, Clean Up, Grow Up, Show Up)
 *
 * Usage:
 *   npx tsx scripts/seed-nursery-rooms.ts              # seeds spoke 0
 *   npx tsx scripts/seed-nursery-rooms.ts 3             # seeds spoke 3
 *   npx tsx scripts/seed-nursery-rooms.ts 0 1 2 3       # seeds spokes 0-3
 *
 * Idempotent: finds existing rooms by slug, updates tilemap + re-creates anchors.
 * Requires: Instance slug `bruised-banana` with a linked spatial map.
 */
import './require-db-env'
import { PrismaClient } from '@prisma/client'
import {
  buildSpokeNurseryRooms,
  NURSERY_TYPES,
  NURSERY_LABELS,
  spokeIntroSlug,
  nurseryRoomSlug,
} from '../src/lib/spatial-world/nursery-rooms'

const prisma = new PrismaClient()

const BB_MAP_NAME = 'Bruised Banana House'
const CAMPAIGN_REF = 'bruised-banana'

async function upsertRoom(
  mapId: string,
  slug: string,
  name: string,
  tilemap: Record<string, unknown>,
  anchors: Array<{
    anchorType: string
    tileX: number
    tileY: number
    label: string
    config?: string | null
    linkedId?: string | null
    linkedType?: string | null
  }>,
  sortOrder: number
) {
  const existing = await prisma.mapRoom.findFirst({ where: { mapId, slug } })
  const room = existing
    ? await prisma.mapRoom.update({
        where: { id: existing.id },
        data: {
          name,
          tilemap: JSON.stringify(tilemap),
          sortOrder,
        },
      })
    : await prisma.mapRoom.create({
        data: {
          mapId,
          name,
          slug,
          tilemap: JSON.stringify(tilemap),
          sortOrder,
        },
      })

  // Replace all anchors
  await prisma.spatialMapAnchor.deleteMany({ where: { roomId: room.id } })
  for (const a of anchors) {
    await prisma.spatialMapAnchor.create({
      data: {
        roomId: room.id,
        anchorType: a.anchorType,
        tileX: a.tileX,
        tileY: a.tileY,
        label: a.label,
        config: a.config ?? undefined,
        linkedId: a.linkedId ?? undefined,
        linkedType: a.linkedType ?? undefined,
      },
    })
  }

  return { room, anchorCount: anchors.length }
}

async function main() {
  // Parse spoke indices from CLI args (default: [0])
  const args = process.argv.slice(2)
  const spokeIndices = args.length > 0
    ? args.map(Number).filter(n => !isNaN(n) && n >= 0 && n < 8)
    : [0]

  if (spokeIndices.length === 0) {
    console.error('No valid spoke indices. Use 0-7.')
    process.exit(1)
  }

  // Find BB instance + spatial map
  let instance = await prisma.instance.findFirst({
    where: { slug: 'bruised-banana' },
    include: { spatialMap: true },
  })
  if (!instance) {
    instance = await prisma.instance.findFirst({
      where: { campaignRef: CAMPAIGN_REF },
      include: { spatialMap: true },
      orderBy: { createdAt: 'asc' },
    })
  }
  if (!instance) {
    console.error('No Instance with slug bruised-banana — seed the instance first.')
    process.exit(1)
  }

  let mapId = instance.spatialMapId
  if (!mapId || !instance.spatialMap) {
    const houseMap = await prisma.spatialMap.findFirst({ where: { name: BB_MAP_NAME } })
    if (!houseMap) {
      console.error(`No spatial map "${BB_MAP_NAME}" — run seed-bruised-banana-world.ts first.`)
      process.exit(1)
    }
    await prisma.instance.update({
      where: { id: instance.id },
      data: { spatialMapId: houseMap.id },
    })
    mapId = houseMap.id
    console.log(`Linked instance to spatial map ${BB_MAP_NAME} (${mapId})`)
  }

  console.log(`--- Seeding Nursery Rooms for spokes: [${spokeIndices.join(', ')}] ---\n`)

  let totalRooms = 0
  let totalAnchors = 0

  for (const spokeIndex of spokeIndices) {
    console.log(`Spoke ${spokeIndex}:`)
    const rooms = buildSpokeNurseryRooms(CAMPAIGN_REF, spokeIndex)

    // Sort order: intro at base + spokeIndex offset, nurseries follow
    const baseSortOrder = 20 + spokeIndex * 10

    // Seed introduction room
    const introSlug = spokeIntroSlug(spokeIndex)
    const { room: introRoom, anchorCount: introAnchors } = await upsertRoom(
      mapId,
      introSlug,
      `Spoke ${spokeIndex} — Clearing`,
      rooms.intro.tilemap,
      rooms.intro.anchors,
      baseSortOrder
    )
    console.log(`  ✅ ${introSlug} (${introRoom.id}) — ${introAnchors} anchors`)
    totalRooms++
    totalAnchors += introAnchors

    // Seed 4 nursery rooms
    for (let i = 0; i < NURSERY_TYPES.length; i++) {
      const nt = NURSERY_TYPES[i]
      const slug = nurseryRoomSlug(spokeIndex, nt)
      const { room, anchorCount } = await upsertRoom(
        mapId,
        slug,
        `Spoke ${spokeIndex} — ${NURSERY_LABELS[nt]}`,
        rooms.nurseries[nt].tilemap,
        rooms.nurseries[nt].anchors,
        baseSortOrder + i + 1
      )
      console.log(`  ✅ ${slug} (${room.id}) — ${anchorCount} anchors`)
      totalRooms++
      totalAnchors += anchorCount
    }

    console.log()
  }

  console.log(`✅ Seeded ${totalRooms} rooms with ${totalAnchors} total anchors`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
