#!/usr/bin/env tsx
/**
 * Idempotent: set Card Club Bruised Banana campaign_portal to the walkable octagon hub.
 * Use when the lobby map already exists (seed-bar-lobby-world without --reset).
 *
 *   npx tsx scripts/patch-card-club-bb-portal-href.ts
 */
import './require-db-env'
import { PrismaClient } from '@prisma/client'
import { resolveBbCampaignClearingWorldPath } from '../src/lib/spatial-world/bb-campaign-clearing-path'

const prisma = new PrismaClient()
const LOBBY_MAP_NAME = 'bar-lobby-world-v1'

async function main() {
  const map = await prisma.spatialMap.findFirst({ where: { name: LOBBY_MAP_NAME } })
  if (!map) {
    console.log(`No spatial map named ${LOBBY_MAP_NAME}`)
    return
  }
  const room = await prisma.mapRoom.findFirst({ where: { mapId: map.id, slug: 'card-club' } })
  if (!room) {
    console.log('No card-club room on lobby map')
    return
  }
  const href = await resolveBbCampaignClearingWorldPath(prisma)
  const result = await prisma.spatialMapAnchor.updateMany({
    where: {
      roomId: room.id,
      anchorType: 'campaign_portal',
      tileX: 7,
      tileY: 1,
    },
    data: { config: JSON.stringify({ href }) },
  })
  console.log(`Updated campaign_portal → ${href} (rows: ${result.count})`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
