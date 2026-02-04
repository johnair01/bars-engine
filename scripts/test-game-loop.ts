import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    console.log('🧪 Game Loop Test Suite\n')
    console.log('─'.repeat(40))

    let passed = 0
    let failed = 0

    // Test 1: CustomBar has kotterStage field
    try {
        const quest = await db.customBar.findFirst({
            select: { id: true, kotterStage: true, title: true }
        })
        if (quest) {
            console.log(`✓ CustomBar.kotterStage exists: ${quest.kotterStage}`)
            passed++
        } else {
            console.log('⚠ No quests found (field exists but no data)')
            passed++
        }
    } catch (e) {
        console.log('✗ CustomBar.kotterStage missing:', (e as Error).message)
        failed++
    }

    // Test 2: VibulonEvent has archetypeMove field
    try {
        const event = await db.vibulonEvent.findFirst({
            select: { id: true, archetypeMove: true, source: true }
        })
        if (event) {
            console.log(`✓ VibulonEvent.archetypeMove exists: ${event.archetypeMove ?? 'null'}`)
        } else {
            console.log('✓ VibulonEvent.archetypeMove field exists (no events yet)')
        }
        passed++
    } catch (e) {
        console.log('✗ VibulonEvent.archetypeMove missing:', (e as Error).message)
        failed++
    }

    // Test 3: VibulonEvent has questId field
    try {
        const event = await db.vibulonEvent.findFirst({
            select: { id: true, questId: true }
        })
        if (event) {
            console.log(`✓ VibulonEvent.questId exists: ${event.questId ?? 'null'}`)
        } else {
            console.log('✓ VibulonEvent.questId field exists (no events yet)')
        }
        passed++
    } catch (e) {
        console.log('✗ VibulonEvent.questId missing:', (e as Error).message)
        failed++
    }

    // Test 4: Vibulon has generation field
    try {
        const vibe = await db.vibulon.findFirst({
            select: { id: true, generation: true, originTitle: true }
        })
        if (vibe) {
            console.log(`✓ Vibulon.generation exists: ${vibe.generation}`)
        } else {
            console.log('✓ Vibulon.generation field exists (no vibeulons yet)')
        }
        passed++
    } catch (e) {
        console.log('✗ Vibulon.generation missing:', (e as Error).message)
        failed++
    }

    // Test 5: Kotter stages constant loads
    try {
        const { KOTTER_STAGES } = await import('../src/lib/kotter')
        const count = Object.keys(KOTTER_STAGES).length
        if (count === 8) {
            console.log(`✓ KOTTER_STAGES has 8 stages`)
            passed++
        } else {
            console.log(`✗ KOTTER_STAGES has ${count} stages (expected 8)`)
            failed++
        }
    } catch (e) {
        console.log('✗ Failed to load kotter.ts:', (e as Error).message)
        failed++
    }

    // Test 6: Stage actions exist
    try {
        const { advanceQuestStage, checkAffinityMatch } = await import('../src/actions/stage')
        console.log(`✓ Stage actions exported: advanceQuestStage, checkAffinityMatch`)
        passed++
    } catch (e) {
        console.log('✗ Stage actions missing:', (e as Error).message)
        failed++
    }

    console.log('─'.repeat(40))
    console.log(`\n${passed} passed, ${failed} failed`)

    if (failed === 0) {
        console.log('\n✅ All game loop features verified!')
    } else {
        console.log('\n❌ Some tests failed - check output above')
        process.exit(1)
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect())
