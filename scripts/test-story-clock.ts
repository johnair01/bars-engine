/**
 * Story Clock Test Suite
 * Tests all Story Clock features without requiring browser
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    tests: [] as { name: string; status: 'PASS' | 'FAIL'; message?: string }[]
}

function assert(condition: boolean, testName: string, message?: string) {
    if (condition) {
        results.passed++
        results.tests.push({ name: testName, status: 'PASS' })
        console.log(`✅ ${testName}`)
    } else {
        results.failed++
        results.tests.push({ name: testName, status: 'FAIL', message })
        console.log(`❌ ${testName}${message ? `: ${message}` : ''}`)
    }
}

async function testStoryClockSystem() {
    console.log('\n🧪 STORY CLOCK TEST SUITE\n')
    console.log('='.repeat(60))

    try {
        // TEST 1: Initial State
        console.log('\n📋 Test 1: Initial Global State')
        let globalState = await db.globalState.findUnique({ where: { id: 'singleton' } })

        if (!globalState) {
            // Create if missing
            globalState = await db.globalState.create({
                data: {
                    id: 'singleton',
                    storyClock: 0,
                    currentAct: 1,
                    currentPeriod: 1,
                    isPaused: false,
                    hexagramSequence: '[]'
                }
            })
        }

        assert(globalState !== null, 'Global state exists')
        assert(globalState.currentPeriod === 1, 'Initial period is 1', `Got: ${globalState.currentPeriod}`)
        assert(globalState.isPaused === false, 'Clock is not paused initially')

        // TEST 2: Start Clock (simulate)
        console.log('\n📋 Test 2: Start Clock Simulation')

        // Generate shuffled sequence
        const sequence = Array.from({ length: 64 }, (_, i) => i + 1)
            .sort(() => Math.random() - 0.5)

        await db.globalState.update({
            where: { id: 'singleton' },
            data: {
                storyClock: 1,
                currentPeriod: 1,
                hexagramSequence: JSON.stringify(sequence)
            }
        })

        globalState = await db.globalState.findUnique({ where: { id: 'singleton' } })!
        const parsedSequence = JSON.parse(globalState!.hexagramSequence)

        assert(parsedSequence.length === 64, 'Hexagram sequence has 64 entries')
        assert(globalState!.storyClock === 1, 'Clock starts at 1')
        assert(new Set(parsedSequence).size === 64, 'All hexagrams are unique')

        // TEST 3: Quest Generation with Period Tracking
        console.log('\n📋 Test 3: Quest Generation with Metadata')

        const testQuest = await db.customBar.create({
            data: {
                creatorId: (await db.player.findFirst())?.id || 'test',
                title: 'Test Period 1 Quest',
                description: 'Test quest for Period 1',
                type: 'story',
                reward: 5,
                hexagramId: sequence[0],
                periodGenerated: 1,
                allowedTrigrams: '["Heaven","Earth"]',
                inputs: '[]'
            }
        })

        assert(testQuest.hexagramId !== null, 'Quest has hexagram ID')
        assert(testQuest.periodGenerated === 1, 'Quest has period metadata')

        // TEST 4: Period Advancement
        console.log('\n📋 Test 4: Period Advancement Logic')

        // Simulate advancing through period 1 (8 steps)
        for (let i = 2; i <= 8; i++) {
            await db.globalState.update({
                where: { id: 'singleton' },
                data: {
                    storyClock: i,
                    currentPeriod: Math.ceil(i / 8)
                }
            })
        }

        globalState = await db.globalState.findUnique({ where: { id: 'singleton' } })!
        assert(globalState!.storyClock === 8, 'Clock at position 8')
        assert(globalState!.currentPeriod === 1, 'Still in Period 1 at position 8')

        // Advance to Period 2
        await db.globalState.update({
            where: { id: 'singleton' },
            data: {
                storyClock: 9,
                currentPeriod: Math.ceil(9 / 8)
            }
        })

        globalState = await db.globalState.findUnique({ where: { id: 'singleton' } })!
        assert(globalState!.currentPeriod === 2, 'Transitioned to Period 2 at position 9')

        // TEST 5: Bonus Vibeulons Calculation
        console.log('\n📋 Test 5: Period Bonus Calculation')

        const currentPeriod = globalState!.currentPeriod
        const oldQuest = await db.customBar.findFirst({
            where: { periodGenerated: 1 }
        })

        if (oldQuest) {
            const bonusMultiplier = oldQuest.periodGenerated! < currentPeriod ? 1.5 : 1
            const baseReward = oldQuest.reward
            const finalReward = Math.floor(baseReward * bonusMultiplier)

            assert(bonusMultiplier === 1.5, 'Bonus multiplier is 1.5 for old period')
            assert(finalReward === 7, 'Final reward is 7 (5 × 1.5 rounded down)', `Got: ${finalReward}`)
        }

        // TEST 6: First Completer Tracking
        console.log('\n📋 Test 6: First Completer Tracking')

        const player = await db.player.findFirst()
        if (player && testQuest) {
            await db.customBar.update({
                where: { id: testQuest.id },
                data: { firstCompleterId: player.id }
            })

            const updatedQuest = await db.customBar.findUnique({ where: { id: testQuest.id } })
            assert(updatedQuest!.firstCompleterId === player.id, 'First completer recorded correctly')
        }

        // TEST 7: Pause/Resume State
        console.log('\n📋 Test 7: Pause/Resume Functionality')

        await db.globalState.update({
            where: { id: 'singleton' },
            data: { isPaused: true }
        })

        globalState = await db.globalState.findUnique({ where: { id: 'singleton' } })!
        assert(globalState!.isPaused === true, 'Clock can be paused')

        await db.globalState.update({
            where: { id: 'singleton' },
            data: { isPaused: false }
        })

        globalState = await db.globalState.findUnique({ where: { id: 'singleton' } })!
        assert(globalState!.isPaused === false, 'Clock can be resumed')

        // TEST 8: Quest Filtering by Period
        console.log('\n📋 Test 8: Query Quests by Period')

        // Create quests for different periods
        await db.customBar.create({
            data: {
                creatorId: player?.id || 'test',
                title: 'Period 2 Quest',
                description: 'Test',
                type: 'story',
                reward: 5,
                hexagramId: 10,
                periodGenerated: 2,
                inputs: '[]'
            }
        })

        const period1Quests = await db.customBar.findMany({
            where: { periodGenerated: 1, status: 'active' }
        })

        const period2Quests = await db.customBar.findMany({
            where: { periodGenerated: 2, status: 'active' }
        })

        assert(period1Quests.length > 0, 'Can query Period 1 quests')
        assert(period2Quests.length > 0, 'Can query Period 2 quests')

        // TEST 9: Archive on Reset (simulation)
        console.log('\n📋 Test 9: Archive Story Quests on Reset')

        const beforeArchive = await db.customBar.count({
            where: { hexagramId: { not: null }, status: 'active' }
        })

        await db.customBar.updateMany({
            where: { hexagramId: { not: null }, status: 'active' },
            data: { status: 'archived' }
        })

        const afterArchive = await db.customBar.count({
            where: { hexagramId: { not: null }, status: 'active' }
        })

        assert(beforeArchive > 0, 'Had active story quests before archive', `Count: ${beforeArchive}`)
        assert(afterArchive === 0, 'All story quests archived')

        // TEST 10: Story Tick Logging
        console.log('\n📋 Test 10: Story Tick Event Logging')

        const tick = await db.storyTick.create({
            data: {
                tickNumber: 9,
                actNumber: 2,
                trigger: 'test',
                description: 'Test tick for Period 2 transition'
            }
        })

        assert(tick !== null, 'Story tick created successfully')
        assert(tick.tickNumber === 9, 'Tick records correct clock position')

        const allTicks = await db.storyTick.findMany({ orderBy: { createdAt: 'asc' } })
        assert(allTicks.length >= 1, 'Story ticks are persisted')

    } catch (error) {
        console.error('\n💥 Test suite encountered error:', error)
        results.failed++
    } finally {
        await db.$disconnect()
    }

    // Print Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 TEST SUMMARY\n')
    console.log(`Total Tests: ${results.passed + results.failed}`)
    console.log(`✅ Passed: ${results.passed}`)
    console.log(`❌ Failed: ${results.failed}`)
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`)

    if (results.failed > 0) {
        console.log('\n❌ Failed Tests:')
        results.tests.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`  - ${t.name}${t.message ? `: ${t.message}` : ''}`)
        })
    }

    console.log('\n' + '='.repeat(60))

    process.exit(results.failed > 0 ? 1 : 0)
}

testStoryClockSystem()
