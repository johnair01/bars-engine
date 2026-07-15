import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { CHAPTER_ONE_LEAD_SOURCE } from '@/lib/mastering-allyship/chapter-one-lead'

config({ path: '.env' })
config({ path: '.env.local', override: true })

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to verify Chapter 1 lead persistence.')
  }

  const db = new PrismaClient()
  const email = `codex.chapter1.lead.test+${Date.now()}@example.com`

  try {
    const row = await db.funnelSignup.create({
      data: {
        intent: 'chapter',
        email,
        name: 'Codex Test',
        source: CHAPTER_ONE_LEAD_SOURCE,
      },
      select: {
        id: true,
        email: true,
        source: true,
      },
    })

    if (row.email !== email || row.source !== CHAPTER_ONE_LEAD_SOURCE) {
      throw new Error(`Unexpected lead row: ${JSON.stringify(row)}`)
    }

    await db.funnelSignup.delete({ where: { id: row.id } })
    console.log(`✓ Chapter 1 lead persistence verified and cleaned up (${row.id})`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
