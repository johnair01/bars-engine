/**
 * One-time backfill: seed each player's bounded hand from their 6 most-recent
 * active BARs. Everything else stays in the vault (no HandSlot row).
 *
 * Idempotent: players who already have any HandSlot rows are skipped.
 *
 * Run: npx tsx scripts/backfill-hand-slots.ts
 * See .specify/specs/hand-vault-bounded-inventory/spec.md (FR2)
 */

import { PrismaClient } from '@prisma/client'

const HAND_SIZE = 6
const prisma = new PrismaClient()

async function main() {
    const players = await prisma.player.findMany({ select: { id: true, name: true } })
    let seeded = 0
    let skipped = 0

    for (const player of players) {
        const existing = await prisma.handSlot.count({ where: { playerId: player.id } })
        if (existing > 0) {
            skipped++
            continue
        }

        const bars = await prisma.customBar.findMany({
            where: { creatorId: player.id, status: 'active', archivedAt: null },
            orderBy: { createdAt: 'desc' },
            take: HAND_SIZE,
            select: { id: true },
        })

        if (bars.length === 0) {
            skipped++
            continue
        }

        await prisma.handSlot.createMany({
            data: bars.map((bar, i) => ({
                playerId: player.id,
                slotIndex: i,
                barId: bar.id,
                isCarrying: false,
            })),
        })
        seeded++
        console.log(`  seeded ${bars.length} hand slots for ${player.name} (${player.id})`)
    }

    console.log(`\nBackfill complete: ${seeded} players seeded, ${skipped} skipped.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
