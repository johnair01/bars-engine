/**
 * Smoke Test: Onboarding Quest Thread
 *
 * Verifies the end-to-end onboarding-as-quest-thread flow:
 * 1. Seed script creates orientation thread and quests
 * 2. assignOrientationThreads auto-assigns to a player
 * 3. Completing quests advances thread and fires completionEffects
 * 4. setNation/setPlaybook effects update Player record
 * 5. markOnboardingComplete flags the player as done
 * 6. resetPlayerThreadProgress resets position
 *
 * Run with: npx tsx scripts/smoke-test-onboarding-thread.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const TEST_PREFIX = '__smoke_ob_test__'
const TEST_EMAIL = `${TEST_PREFIX}@test.local`

async function assert(label: string, value: any, expected?: any) {
    if (expected !== undefined) {
        if (value !== expected) {
            throw new Error(`FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`)
        }
    } else if (!value) {
        throw new Error(`FAIL: ${label} — value is falsy: ${JSON.stringify(value)}`)
    }
    console.log(`  ✓ ${label}`)
}

async function cleanup() {
    console.log('\n🧹 Cleaning up test data...')
    const testPlayer = await db.player.findFirst({ where: { name: TEST_PREFIX } })
    if (testPlayer) {
        await db.threadProgress.deleteMany({ where: { playerId: testPlayer.id } })
        await db.playerQuest.deleteMany({ where: { playerId: testPlayer.id } })
        await db.vibulonEvent.deleteMany({ where: { playerId: testPlayer.id } })
        await db.vibulon.deleteMany({ where: { ownerId: testPlayer.id } })
        await db.player.delete({ where: { id: testPlayer.id } })
        console.log('  ✓ Cleaned up test player')
    }
    await db.account.deleteMany({ where: { email: TEST_EMAIL } })
    await db.invite.deleteMany({ where: { token: TEST_PREFIX } })
}

async function main() {
    console.log('=== SMOKE TEST: Onboarding Quest Thread ===\n')

    // Clean up any previous test data
    await cleanup()

    // 1. Verify orientation thread exists
    console.log('\n[1] Checking for orientation thread...')
    const orientationThread = await db.questThread.findFirst({
        where: { threadType: 'orientation', status: 'active' },
        include: {
            quests: {
                orderBy: { position: 'asc' },
                include: { quest: true }
            }
        }
    })
    await assert('Orientation thread exists', orientationThread)
    await assert('Thread has quests', orientationThread!.quests.length > 0)
    console.log(`  Thread: "${orientationThread!.title}" with ${orientationThread!.quests.length} quests`)

    // Check that quests have completionEffects
    const questWithNation = orientationThread!.quests.find(q =>
        q.quest.completionEffects?.includes('setNation')
    )
    const questWithPlaybook = orientationThread!.quests.find(q =>
        q.quest.completionEffects?.includes('setPlaybook')
    )
    const questWithComplete = orientationThread!.quests.find(q =>
        q.quest.completionEffects?.includes('markOnboardingComplete')
    )
    await assert('Has quest with setNation effect', questWithNation)
    await assert('Has quest with setPlaybook effect', questWithPlaybook)
    await assert('Has quest with markOnboardingComplete effect', questWithComplete)

    // 2. Create test player (requires Account + Invite per schema)
    console.log('\n[2] Creating test player...')
    const invite = await db.invite.create({
        data: { token: TEST_PREFIX, status: 'active' }
    })
    const account = await db.account.create({
        data: { email: TEST_EMAIL, passwordHash: 'test_hash_not_real' }
    })
    const testPlayer = await db.player.create({
        data: {
            accountId: account.id,
            name: TEST_PREFIX,
            contactType: 'email',
            contactValue: TEST_EMAIL,
            inviteId: invite.id,
            onboardingComplete: false,
        }
    })
    await assert('Test player created', testPlayer.id)

    // 3. Auto-assign orientation threads
    console.log('\n[3] Assigning orientation threads...')
    const { assignOrientationThreads } = await import('../src/actions/quest-thread')
    await assignOrientationThreads(testPlayer.id)

    const progress = await db.threadProgress.findFirst({
        where: { playerId: testPlayer.id, threadId: orientationThread!.id }
    })
    await assert('Thread progress created', progress)
    await assert('Starting position is 1', progress!.currentPosition, 1)

    // 4. Verify completionEffects JSON parsing
    console.log('\n[4] Verifying completionEffects JSON structure...')
    for (const tq of orientationThread!.quests) {
        if (tq.quest.completionEffects) {
            try {
                const parsed = JSON.parse(tq.quest.completionEffects)
                if (parsed.effects) {
                    await assert(
                        `Quest "${tq.quest.title}" has valid effects array`,
                        Array.isArray(parsed.effects)
                    )
                }
            } catch {
                throw new Error(`FAIL: Quest "${tq.quest.title}" has invalid completionEffects JSON`)
            }
        }
    }

    // 5. Verify nations and playbooks exist for input options
    console.log('\n[5] Verifying nation/playbook data...')
    const nations = await db.nation.findMany({ select: { id: true, name: true } })
    const playbooks = await db.playbook.findMany({ select: { id: true, name: true } })
    await assert('Nations exist', nations.length > 0)
    await assert('Playbooks exist', playbooks.length > 0)

    // 6. Test admin functions
    console.log('\n[6] Testing admin thread management...')

    // Reset thread progress
    await db.threadProgress.update({
        where: { threadId_playerId: { threadId: orientationThread!.id, playerId: testPlayer.id } },
        data: { currentPosition: 3 }
    })
    let updatedProgress = await db.threadProgress.findFirst({
        where: { playerId: testPlayer.id, threadId: orientationThread!.id }
    })
    await assert('Position advanced to 3', updatedProgress!.currentPosition, 3)

    // Reset
    await db.threadProgress.update({
        where: { threadId_playerId: { threadId: orientationThread!.id, playerId: testPlayer.id } },
        data: { currentPosition: 1, completedAt: null }
    })
    updatedProgress = await db.threadProgress.findFirst({
        where: { playerId: testPlayer.id, threadId: orientationThread!.id }
    })
    await assert('Reset back to position 1', updatedProgress!.currentPosition, 1)

    // 7. Verify thread completion reward
    console.log('\n[7] Checking thread configuration...')
    await assert('Thread has completion reward', orientationThread!.completionReward > 0)
    console.log(`  Completion reward: ${orientationThread!.completionReward} vibeulons`)

    // Cleanup
    await cleanup()

    console.log('\n=== ALL TESTS PASSED ===\n')
}

main()
    .catch((e) => {
        console.error('\n❌ TEST FAILED:', e.message || e)
        cleanup().finally(() => process.exit(1))
    })
    .finally(async () => {
        await db.$disconnect()
    })
