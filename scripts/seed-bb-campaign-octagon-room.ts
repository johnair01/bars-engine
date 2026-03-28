#!/usr/bin/env tsx
/**
 * Adds walkable octagonal campaign hub room to Bruised Banana spatial map:
 * eight spoke_portal anchors + Card Club return (portal + externalPath).
 *
 * Usage: npx tsx scripts/seed-bb-campaign-octagon-room.ts
 *
 * Requires Instance slug `bruised-banana`. If `spatialMapId` is unset, links to SpatialMap named
 * **Bruised Banana House** when present (same map as `seed-bruised-banana-world.ts`).
 */
import './require-db-env'
import { PrismaClient } from '@prisma/client'
import { buildOctagonCampaignHubRoom } from '../src/lib/spatial-world/octagon-campaign-hub'

const prisma = new PrismaClient()

const BB_MAP_NAME = 'Bruised Banana House'
const ROOM_SLUG = 'bb-campaign-clearing'
const ROOM_NAME = 'Bruised Banana Clearing'
const CAMPAIGN_REF = 'bruised-banana'
const SORT_ORDER = 10

async function main() {
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
    console.error(
      'No Instance with slug bruised-banana or campaignRef bruised-banana — run scripts/seed_bruised_banana_quest_map.ts (or create the instance in admin), then seed-bruised-banana-world.'
    )
    process.exit(1)
  }
  if (instance.slug !== 'bruised-banana') {
    console.log(`Using instance slug "${instance.slug}" (campaignRef ${CAMPAIGN_REF}) — world URLs use /world/${instance.slug}/…`)
  }

  let mapId = instance.spatialMapId
  if (!mapId || !instance.spatialMap) {
    const houseMap = await prisma.spatialMap.findFirst({ where: { name: BB_MAP_NAME } })
    if (!houseMap) {
      console.error(
        `bruised-banana has no spatial map and no "${BB_MAP_NAME}" map exists — run:\n  npx tsx scripts/seed-bruised-banana-world.ts`
      )
      process.exit(1)
    }
    await prisma.instance.update({
      where: { id: instance.id },
      data: { spatialMapId: houseMap.id },
    })
    mapId = houseMap.id
    console.log(`Linked bruised-banana instance to spatial map ${BB_MAP_NAME} (${mapId})`)
  }
  const { tilemap, anchors } = buildOctagonCampaignHubRoom(CAMPAIGN_REF, 25)

  const existing = await prisma.mapRoom.findFirst({ where: { mapId, slug: ROOM_SLUG } })
  const room = existing
    ? await prisma.mapRoom.update({
        where: { id: existing.id },
        data: {
          name: ROOM_NAME,
          tilemap: JSON.stringify(tilemap),
          sortOrder: SORT_ORDER,
        },
      })
    : await prisma.mapRoom.create({
        data: {
          mapId,
          name: ROOM_NAME,
          slug: ROOM_SLUG,
          tilemap: JSON.stringify(tilemap),
          sortOrder: SORT_ORDER,
        },
      })

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

  console.log(`Upserted MapRoom ${ROOM_SLUG} (${room.id}) with ${anchors.length} anchors on map ${mapId}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
