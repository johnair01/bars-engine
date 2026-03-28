/**
 * One-off: move Card Club `giacomo_npc` anchor off the impassable corner (14,9) → (12,3).
 * Safe to run multiple times (no-op if already updated).
 *
 *   npx tsx scripts/patch-card-club-giacomo-position.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const map = await prisma.spatialMap.findFirst({
    where: { name: 'bar-lobby-world-v1' },
    include: { rooms: { where: { slug: 'card-club' }, include: { anchors: true } } },
  })
  const room = map?.rooms[0]
  if (!room) {
    console.log('No card-club room on bar-lobby-world-v1 — skip.')
    return
  }

  const g = room.anchors.find((a) => a.anchorType === 'giacomo_npc')
  if (!g) {
    console.log('No giacomo_npc anchor — skip.')
    return
  }

  if (g.tileX === 12 && g.tileY === 3) {
    console.log('Giacomo already at (12,3) — skip.')
    return
  }

  await prisma.spatialMapAnchor.update({
    where: { id: g.id },
    data: { tileX: 12, tileY: 3 },
  })
  console.log(`Updated Giacomo anchor ${g.id} from (${g.tileX},${g.tileY}) to (12,3).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
