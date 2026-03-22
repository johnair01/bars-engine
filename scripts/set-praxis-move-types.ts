/**
 * Set moveType on CustomBar quests derived from praxis pillar books.
 * Run: npx tsx scripts/set-praxis-move-types.ts
 *
 * Pillar → moveType mapping (developmental alignment):
 *   felt_sense      → wakeUp   (embodied awareness precedes all else)
 *   antifragile     → growUp   (building capacity through stress)
 *   commons_networks→ showUp   (collective action and contribution)
 *
 * Only updates quests that currently have no moveType set.
 * Pass --force to overwrite existing moveTypes.
 */
import { PrismaClient } from '@prisma/client'
import { parsePraxisMetadata } from '../src/lib/books/praxisMetadata'

const db = new PrismaClient()
const force = process.argv.includes('--force')

const PILLAR_TO_MOVE: Record<string, string> = {
  felt_sense: 'wakeUp',
  antifragile: 'growUp',
  commons_networks: 'showUp',
}

async function run() {
  const threads = await db.questThread.findMany({
    where: { bookId: { not: null } },
    include: {
      book: { select: { title: true, metadataJson: true } },
      quests: { include: { quest: { select: { id: true, title: true, moveType: true } } } },
    },
  })

  let updated = 0
  let skipped = 0

  for (const thread of threads) {
    if (!thread.book) continue
    const { praxisPillar } = parsePraxisMetadata(thread.book.metadataJson)
    if (!praxisPillar) continue

    const targetMove = PILLAR_TO_MOVE[praxisPillar]
    if (!targetMove) continue

    for (const tq of thread.quests) {
      const quest = tq.quest
      if (!force && quest.moveType) {
        skipped++
        continue
      }
      await db.customBar.update({ where: { id: quest.id }, data: { moveType: targetMove } })
      console.log(
        `  ✓  "${quest.title.slice(0, 50)}" → ${targetMove} (book: ${thread.book.title})`
      )
      updated++
    }
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped (already had moveType).`)
  await db.$disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
