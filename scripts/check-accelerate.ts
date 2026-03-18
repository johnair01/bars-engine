import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const db = new PrismaClient({ datasources: { db: { url: process.env.PRISMA_DATABASE_URL } } }).$extends(withAccelerate())

async function main() {
  const playerCount = await (db as any).player.count()
  const accountCount = await (db as any).account.count()
  console.log(`players: ${playerCount}, accounts: ${accountCount}`)

  // Check admin account
  const admin = await (db as any).account.findFirst({
    where: { email: { contains: 'admin' } },
    select: { email: true }
  })
  console.log('admin account:', admin?.email ?? 'NOT FOUND')

  // Show a few real accounts
  const recent = await (db as any).player.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { name: true, contactValue: true, createdAt: true }
  })
  console.log('Most recent players:', JSON.stringify(recent, null, 2))
}
main().catch(e => console.error(e.message)).finally(() => (db as any).$disconnect())
