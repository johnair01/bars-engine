
import { db } from '@/lib/db'
import { createTutorialQuest, getOnboardingStatus, completeOnboardingStep } from '@/actions/onboarding'
import { completeQuestLogic } from '@/actions/starter-quests'


async function runTest() {
    console.log('🧪 Starting Onboarding Flow Test...')

    // 1. Create a Test Player (Simulating Guided/Expert Signup)
    const testEmail = `test.user.${Date.now()}@example.com`
    console.log(`Creating test player: ${testEmail}`)

    const account = await db.account.create({
        data: {
            email: testEmail,
            passwordHash: 'dummy'
        }
    })

    // Create mock invite
    const invite = await db.invite.create({
        data: {
            token: `test_invite_${Date.now()}`,
            maxUses: 999
        }
    })

    const player = await db.player.create({
        data: {
            accountId: account.id,
            name: 'Test Traveler',
            contactType: 'email',
            contactValue: testEmail,
            inviteId: invite.id, // Use real invite ID
            onboardingMode: 'guided',
            // No nation/playbook
        }
    })
    console.log(`✅ Player created: ${player.id}`)

    // 2. Assign Tutorial Quest (Simulating what createGuidedPlayer or auth flow does)
    console.log('Assigning Tutorial Quest...')
    const questResult = await createTutorialQuest(player.id)
    if (questResult.error) throw new Error(questResult.error)
    const questId = questResult.questId

    console.log(`✅ Tutorial Quest Assigned: ${questId}`)

    // 3. Verify it is "Assigned"
    const pq = await db.playerQuest.findUnique({
        where: { playerId_questId: { playerId: player.id, questId: questId! } }
    })
    if (!pq || pq.status !== 'assigned') throw new Error('Quest not assigned correctly')
    console.log('✅ Quest status verified: ASSIGNED')

    // 4. Update Onboarding Status for "Seen Welcome"
    console.log('completing "welcome" step...')
    try {
        await completeOnboardingStep('welcome', player.id)
    } catch (e: any) {
        if (e.message.includes('invariant') || e.message.includes('static generation')) {
            console.log('⚠️ Ignoring revalidatePath error (expected in script)')
        } else {
            throw e
        }
    }

    // 5. Complete the Quest (Simulating User Input)
    console.log('Completing Tutorial Quest...')
    const inputs = { introduction: "I am testing the system." }
    const completeResult = await completeQuestLogic(player.id, questId!, inputs)

    if (completeResult.error) throw new Error(completeResult.error)
    console.log('✅ Quest Completed via Logic')

    // 6. Verify Quest Completion in DB
    const pqCompleted = await db.playerQuest.findUnique({
        where: { playerId_questId: { playerId: player.id, questId: questId! } }
    })
    if (pqCompleted?.status !== 'completed') throw new Error('Quest status NOT completed in DB')

    // Check Inputs
    const savedInputs = JSON.parse(pqCompleted.inputs || '{}')
    if (savedInputs.introduction !== inputs.introduction) throw new Error('Inputs not saved correctly')
    console.log('✅ Quest Inputs Verified')

    // 7. Complete "First Quest" step in Onboarding
    try {
        await completeOnboardingStep('firstQuest', player.id)
    } catch (e: any) {
        if (e.message.includes('invariant') || e.message.includes('static generation')) {
            console.log('⚠️ Ignoring revalidatePath error (expected in script)')
        } else {
            throw e
        }
    }

    // 8. Check Final Status
    const finalStatus = await getOnboardingStatus(player.id)
    if ('error' in finalStatus) throw new Error('Failed to get status')

    console.log('Current Status:', {
        hasSeenWelcome: finalStatus.hasSeenWelcome,
        hasCompletedFirstQuest: finalStatus.hasCompletedFirstQuest,
        hasCreatedFirstQuest: finalStatus.hasCreatedFirstQuest
    })

    if (!finalStatus.hasCompletedFirstQuest) throw new Error('Onboarding step not marked complete')

    console.log('🎉 TEST PASSED: Onboarding Flow Verified')
    process.exit(0)
}

runTest().catch(e => {
    console.error('❌ TEST FAILED:', e)
    process.exit(1)
})
