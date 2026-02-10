import { db } from '../src/lib/db'
import { castAndGenerateQuestForPlayer } from '../src/actions/generate-quest'

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message)
    }
}

async function main() {
    console.log('🧪 Phase 1 I Ching integration test')

    const player = await db.player.findFirst({
        where: { playbook: { isNot: null } },
        orderBy: { createdAt: 'asc' }
    })

    assert(player, 'No player with playbook found.')
    console.log(`👤 Using player: ${player.name} (${player.id})`)

    const result = await castAndGenerateQuestForPlayer(player.id)
    if ('error' in result) {
        throw new Error(`I Ching quest generation failed: ${result.error}`)
    }

    console.log(`🔮 Hexagram: #${result.hexagram.id} ${result.hexagram.name}`)
    console.log(`📌 Quest: ${result.quest.title} (${result.questId})`)

    const assignment = await db.playerQuest.findUnique({
        where: {
            playerId_questId: {
                playerId: player.id,
                questId: result.questId
            }
        }
    })

    assert(assignment, 'Expected PlayerQuest assignment was not created.')
    assert(assignment.status === 'assigned', 'Generated quest should be assigned.')

    const readingHistory = await db.playerBar.findFirst({
        where: {
            playerId: player.id,
            barId: result.hexagram.id,
            source: 'iching'
        },
        orderBy: { acquiredAt: 'desc' }
    })

    assert(readingHistory, 'I Ching reading history was not recorded.')

    console.log('✅ Phase 1 unified path looks healthy.')
}

main()
    .catch((err) => {
        console.error('❌ Test failed:', err)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
