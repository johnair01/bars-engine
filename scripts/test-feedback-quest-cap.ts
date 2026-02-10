import { PrismaClient } from '@prisma/client'
import { completeQuestForPlayer } from '../src/actions/quest-engine'

const db = new PrismaClient()

async function main() {
    console.log('🧪 Testing feedback quest cap (max 5 vibeulons)...')

    const questId = 'system-feedback'
    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (!quest) {
        throw new Error('Feedback quest not found (system-feedback).')
    }

    const timestamp = Date.now()
    const invite = await db.invite.create({
        data: {
            token: `TEST-FEEDBACK-${timestamp}`,
            status: 'active',
            maxUses: 1,
            uses: 0,
        }
    })

    const player = await db.player.create({
        data: {
            name: 'Feedback Cap Tester',
            contactType: 'email',
            contactValue: `feedback-cap-${timestamp}@test.local`,
            inviteId: invite.id,
            onboardingComplete: true
        }
    })

    await db.starterPack.create({
        data: {
            playerId: player.id,
            data: JSON.stringify({ completedBars: [], activeBars: [] }),
            initialVibeulons: 0
        }
    })

    const rewards: number[] = []
    try {
        for (let i = 1; i <= 6; i++) {
            const result = await completeQuestForPlayer(
                player.id,
                questId,
                {
                    sentiment: 'Amber (Static present, curious but occasionally stuck)',
                    clarity: 'Foggy (I understand the vibe, but the grammar is fuzzy)',
                    feedback: `Automated feedback run #${i}`
                },
                undefined,
                { skipRevalidate: true }
            )

            if (!result.success) {
                throw new Error(`Run ${i} failed: ${JSON.stringify(result)}`)
            }

            rewards.push(result.reward ?? 0)

            // Feedback quest should be removed from PlayerQuest so it can be completed again.
            const feedbackAssignment = await db.playerQuest.findUnique({
                where: {
                    playerId_questId: {
                        playerId: player.id,
                        questId
                    }
                }
            })
            if (feedbackAssignment) {
                throw new Error(`Run ${i}: feedback assignment was not recycled.`)
            }
        }

        const walletCount = await db.vibulon.count({ where: { ownerId: player.id } })
        const feedbackEvents = await db.vibulonEvent.findMany({
            where: {
                playerId: player.id,
                questId,
                source: 'quest'
            },
            orderBy: { createdAt: 'asc' }
        })

        const positiveRewardRuns = rewards.filter((reward) => reward > 0).length
        const totalReward = rewards.reduce((sum, reward) => sum + Math.max(0, reward), 0)

        if (feedbackEvents.length !== 6) {
            throw new Error(`Expected 6 feedback quest events, found ${feedbackEvents.length}.`)
        }
        if (positiveRewardRuns !== 5) {
            throw new Error(`Expected exactly 5 rewarded runs, found ${positiveRewardRuns}. Rewards: ${JSON.stringify(rewards)}`)
        }
        if (rewards[5] !== 0) {
            throw new Error(`Expected run #6 reward to be 0 due to cap. Rewards: ${JSON.stringify(rewards)}`)
        }
        if (walletCount !== totalReward) {
            throw new Error(`Wallet token count mismatch. Wallet=${walletCount}, expected=${totalReward}`)
        }

        console.log('✅ Feedback quest cap behavior verified.')
        console.log(`   Rewards by run: ${JSON.stringify(rewards)}`)
        console.log(`   Vibulons minted: ${walletCount}`)
        console.log('   Cap enforced after 5 rewarded completions.')
    } finally {
        await db.playerQuest.deleteMany({ where: { playerId: player.id } })
        await db.vibulonEvent.deleteMany({ where: { playerId: player.id } })
        await db.vibulon.deleteMany({ where: { ownerId: player.id } })
        await db.starterPack.deleteMany({ where: { playerId: player.id } })
        await db.player.deleteMany({ where: { id: player.id } })
        await db.invite.deleteMany({ where: { id: invite.id } })
    }
}

main()
    .catch((error) => {
        console.error('❌ Feedback cap test failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
