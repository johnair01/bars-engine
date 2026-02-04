
import { db } from '../src/lib/db'
import { completeQuestLogic } from '../src/actions/starter-quests'

async function runTest() {
    console.log('🧪 Testing Quest Completion Logic (Standardized Flow)...\n')

    // 0. Setup: Ensure Bar Exists
    const barId = 'bar_intention'
    const bar = await db.customBar.findUnique({ where: { id: barId } })
    if (!bar) throw new Error('❌ Test Setup Fail: Bar not found (Migration likely failed)')

    // 1. Create Player
    const invite = await db.invite.create({ data: { token: `TEST-COMPL-${Date.now()}`, maxUses: 9 } })
    const player = await db.player.create({
        data: {
            name: 'Test Completer',
            contactType: 'email',
            contactValue: `completer-${Date.now()}@test.com`,
            inviteId: invite.id
        }
    })

    // Create StarterPack (still needed for legacy or other checks? currently logic doesn't use it, but safe to have)
    await db.starterPack.create({
        data: {
            playerId: player.id,
            data: JSON.stringify({ completedBars: [], activeBars: [] }),
            initialVibeulons: 0
        }
    })

    console.log(`✓ Created player: ${player.name}`)

    // 2. Pick Up Quest (Simulate Assignment)
    await db.playerQuest.create({
        data: {
            playerId: player.id,
            questId: barId,
            status: 'assigned'
        }
    })
    console.log(`✓ Picked up quest ( Assigned in PlayerQuest table )`)

    // 3. Complete Quest
    const inputs = { intention: 'To verify mechanics' }

    // Call the Logic
    // We import dynamically to catch latest changes if running in longish process, but static import is fine here.
    const result = await completeQuestLogic(player.id, barId, inputs)

    if (result.error) {
        throw new Error(`❌ Completion failed: ${result.error}`)
    }
    console.log(`✓ logic executed successfully`)

    // 4. Verify Final State (DB)
    const pq = await db.playerQuest.findUnique({
        where: {
            playerId_questId: { playerId: player.id, questId: barId }
        }
    })

    if (!pq) throw new Error('❌ Verification Fail: PlayerQuest record vanished')
    if (pq.status !== 'completed') throw new Error(`❌ Verification Fail: Status is ${pq.status}, expected 'completed'`)
    if (!pq.inputs || !pq.inputs.includes('verify mechanics')) throw new Error('❌ Verification Fail: Inputs not saved correctly')

    console.log('✓ Verified: PlayerQuest status is completed and inputs saved')

    // Check Vibulons
    const vCount = await db.vibulon.count({ where: { ownerId: player.id } })
    if (vCount < 1) throw new Error('❌ Verification Fail: No Vibulons awarded')
    console.log(`✓ Verified: Vibulon awarded`)

    // Cleanup
    await db.playerQuest.deleteMany({ where: { playerId: player.id } })
    await db.vibulonEvent.deleteMany({ where: { playerId: player.id } })
    await db.vibulon.deleteMany({ where: { ownerId: player.id } })
    await db.starterPack.delete({ where: { playerId: player.id } })
    await db.player.delete({ where: { id: player.id } })
    await db.invite.delete({ where: { id: invite.id } })

    console.log('\n✅ TEST PASSED: Standardized Quest Flow works.')
}

runTest().catch((e) => {
    console.error('❌ TEST FAILED:', e)
    process.exit(1)
})
