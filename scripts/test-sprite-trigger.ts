/**
 * E2E smoke test: trigger deriveAvatarFromExisting for a test player.
 * Usage: npx tsx scripts/test-sprite-trigger.ts [playerId]
 * Default: PreMe (Argyra / The Danger Walker, no avatarConfig)
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { runCompletionEffectsForQuest } from '@/actions/quest-engine'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const playerId = process.argv[2] || 'cmlt0m7gn000l103m2jaa9uld' // PreMe

async function main() {
    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { name: true, avatarConfig: true, nationId: true, archetypeId: true,
                  nation: { select: { name: true } }, archetype: { select: { name: true } } }
    })
    if (!player) { console.error('Player not found:', playerId); process.exit(1) }

    console.log(`\nPlayer: ${player.name}`)
    console.log(`  Nation: ${player.nation?.name ?? 'none'}`)
    console.log(`  Archetype: ${player.archetype?.name ?? 'none'}`)
    console.log(`  avatarConfig before: ${player.avatarConfig ?? 'null'}`)
    console.log('\nTriggering deriveAvatarFromExisting...\n')

    await runCompletionEffectsForQuest(playerId, 'build-character-quest', {})

    const after = await db.player.findUnique({
        where: { id: playerId },
        select: { avatarConfig: true }
    })
    console.log(`\n  avatarConfig after: ${after?.avatarConfig ?? 'null'}`)
    if (after?.avatarConfig) {
        console.log('\n✓ Avatar config derived. Check backend logs for [SpriteQueue] enqueue.')
    } else {
        console.log('\n✗ avatarConfig still null — check player has nation + archetype.')
    }
    await db.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
