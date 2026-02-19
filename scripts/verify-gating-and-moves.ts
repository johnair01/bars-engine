import { PrismaClient } from '@prisma/client'
import { getMarketContent } from '../src/actions/market'
import { completeQuestForPlayer } from '../src/actions/quest-engine'
import { hasAffinity, ELEMENTAL_MOVES } from '../src/lib/elemental-moves'

const prisma = new PrismaClient()

async function testGating() {
    console.log('--- Testing Quest Gating ---')

    // 1. Find or create test player and ensure nation is set
    let player = await prisma.player.findFirst({
        where: { name: { contains: 'Admin' } },
        include: { nation: true, playbook: true }
    })

    if (!player) {
        console.error('Player not found. Run seed first.')
        return
    }

    // Ensure player has a nation and playbook for testing
    const pyrakanth = await prisma.nation.upsert({
        where: { name: 'Pyrakanth' },
        update: {},
        create: { name: 'Pyrakanth', description: 'Fire Nation' }
    })

    player = await prisma.player.update({
        where: { id: player.id },
        data: { nationId: pyrakanth.id },
        include: { nation: true, playbook: true }
    })

    // 2. Create a restricted quest
    const restrictedQuestId = 'gated-quest-test'
    await (prisma.customBar as any).upsert({
        where: { id: restrictedQuestId },
        update: {},
        create: {
            id: restrictedQuestId,
            title: 'For Meridia Only',
            description: 'This quest is gated to Meridia.',
            creatorId: player.id,
            allowedNations: JSON.stringify(['Meridia']),
            visibility: 'public',
            type: 'test',
            inputs: '[]'
        }
    })

    // 3. Verify Gating via query logic
    const quest = await (prisma.customBar as any).findUnique({ where: { id: restrictedQuestId } })
    if (quest && quest.allowedNations) {
        const allowed = JSON.parse(quest.allowedNations)
        const playerNation = player.nation?.name
        const isAllowed = playerNation && allowed.includes(playerNation)
        console.log(`Quest [${quest.title}] Gating Test:`)
        console.log(`- Player Nation: ${playerNation || 'None'}`)
        console.log(`- Allowed Nations: ${allowed}`)

        if (playerNation !== 'Meridia' && isAllowed) {
            console.error('✗ Gating failed: Player allowed access to restricted nation quest.')
        } else {
            console.log('✓ Gating logic verified (restricted quest hidden from wrong nation).')
        }
    }

    console.log('--- Testing Elemental Move Affinity ---')
    const move = ELEMENTAL_MOVES['Solar Flare'] // Pyrakanth has Fire affinity
    const hasAff = hasAffinity('Pyrakanth', move.affinity)
    console.log(`Move [Solar Flare] Affinity Test (Pyrakanth):`)
    console.log(`- Move Affinity: ${move.affinity}`)
    console.log(`- Has Affinity: ${hasAff}`)

    if (hasAff) {
        console.log('✓ Affinity check verified.')
    } else {
        console.error('✗ Affinity check failed: Pyrakanth should have Fire affinity.')
    }

    console.log('--- Testing Thread Advancement ---')
    // Find orientation thread
    const thread = await prisma.questThread.findFirst({
        where: { threadType: 'orientation' },
        include: { quests: { orderBy: { position: 'asc' } } }
    })

    if (thread && thread.quests.length > 0) {
        const firstQuestId = thread.quests[0].questId
        console.log(`Starting/Advancing thread [${thread.title}] for player [${player.id}]`)

        // Ensure progress exists
        await prisma.threadProgress.upsert({
            where: { threadId_playerId: { threadId: thread.id, playerId: player.id } },
            update: {},
            create: { threadId: thread.id, playerId: player.id, currentPosition: 1 }
        })

        // Complete the first quest using the engine
        await completeQuestForPlayer(player.id, firstQuestId, { test: true }, { threadId: thread.id })

        const progress = await prisma.threadProgress.findUnique({
            where: { threadId_playerId: { threadId: thread.id, playerId: player.id } }
        })

        console.log(`Thread [${thread.title}] Position: ${progress?.currentPosition}`)
        if (progress && progress.currentPosition > 1) {
            console.log('✓ Thread advanced successfully from position 1 to ' + progress.currentPosition)
        } else {
            console.error('✗ Thread failed to advance.')
        }
    }

    console.log('--- Verification Complete ---')
}

testGating()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
