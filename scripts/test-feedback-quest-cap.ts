import { PrismaClient } from '@prisma/client'
import { completeQuestForPlayer } from '../src/actions/quest-engine'

const db = new PrismaClient()

async function logFeedbackCapTest(action: string, payload: Record<string, unknown>) {
    try {
        await db.auditLog.create({
            data: {
                actorAdminId: 'system',
                action,
                targetType: 'system',
                targetId: String(payload.testRunId || 'unknown'),
                payloadJson: JSON.stringify(payload)
            }
        })
    } catch (error) {
        console.log(`  - Audit log skipped for ${action}: ${(error as Error).message}`)
    }
}

async function main() {
    console.log('🧪 Testing feedback quest cap (max 5 vibeulons)...')
    const testRunId = `feedback_cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const startedAt = new Date()
    await logFeedbackCapTest('FEEDBACK_CAP_TEST_STARTED', {
        testRunId,
        source: 'script:test-feedback-quest-cap',
        startedAt: startedAt.toISOString()
    })

    const questId = 'system-feedback'
    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (!quest) {
        throw new Error('Feedback quest not found (system-feedback).')
    }

    const timestamp = Date.now()
    let invite = await db.invite.create({
        data: {
            token: `TEST-FEEDBACK-${timestamp}`,
            status: 'active',
            maxUses: 1,
            uses: 0,
        }
    })

    let player = await db.player.create({
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
    let walletCount = 0
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

        walletCount = await db.vibulon.count({ where: { ownerId: player.id } })
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
        await logFeedbackCapTest('FEEDBACK_CAP_TEST_COMPLETED', {
            testRunId,
            source: 'script:test-feedback-quest-cap',
            startedAt: startedAt.toISOString(),
            completedAt: new Date().toISOString(),
            rewards,
            walletCount,
            positiveRewardRuns,
            questId
        })
    } catch (error) {
        await logFeedbackCapTest('FEEDBACK_CAP_TEST_FAILED', {
            testRunId,
            source: 'script:test-feedback-quest-cap',
            startedAt: startedAt.toISOString(),
            failedAt: new Date().toISOString(),
            rewards,
            walletCount,
            questId,
            error: error instanceof Error ? error.message : String(error)
        })
        throw error
    } finally {
        if (player?.id) {
            await db.playerQuest.deleteMany({ where: { playerId: player.id } })
            await db.vibulonEvent.deleteMany({ where: { playerId: player.id } })
            await db.vibulon.deleteMany({ where: { ownerId: player.id } })
            await db.starterPack.deleteMany({ where: { playerId: player.id } })
            await db.player.deleteMany({ where: { id: player.id } })
        }
        if (invite?.id) {
            await db.invite.deleteMany({ where: { id: invite.id } })
        }
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
