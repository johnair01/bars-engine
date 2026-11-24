import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const players = await db.player.findMany({
    where: { name: { contains: 'dmin', mode: 'insensitive' } },
    select: { id: true, name: true, avatarConfig: true, roles: { select: { role: { select: { key: true } } } } },
    take: 5,
  })
  console.log(JSON.stringify(players, null, 2))
}
main().finally(() => db.$disconnect())
