import { db } from '../src/lib/db'
import { advanceRun, getOrCreateRun } from '../src/actions/twine'
import { completeQuestForPlayer } from '../src/actions/quest-engine'

async function verifyE2E() {
    console.log('🚀 Starting End-to-End Verification...')

    // 1. Find or create a test player
    let player = await db.player.findFirst({ where: { contactValue: 'test@example.com' } })
    if (!player) {
        let invite = await db.invite.findFirst({ where: { token: 'SYSTEM' } })
        if (!invite) {
            invite = await db.invite.create({
                data: {
                    token: 'SYSTEM',
                    maxUses: 999
                }
            })
        }

        player = await db.player.create({
            data: {
                name: 'Test Voyager',
                contactValue: 'test@example.com',
                contactType: 'email',
                onboardingComplete: false,
                inviteId: invite.id
            }
        })
    }
    const playerId = player.id
    console.log(`✅ Test player: ${player.name} (${playerId})`)

    // Reset player for fresh test
    await db.player.update({
        where: { id: playerId },
        data: {
            nationId: null,
            playbookId: null,
            onboardingComplete: false,
            hasCompletedFirstQuest: false,
            hasCreatedFirstQuest: false
        }
    })

    await db.twineRun.deleteMany({ where: { playerId } })

    // 2. Locate the Orientation Adventure
    const story = await db.twineStory.findUnique({ where: { slug: 'the-first-ritual' } })
    if (!story) throw new Error('Orientation story not found. Run seed-orientation first.')
    console.log(`✅ Found Story: ${story.title}`)

    // 3. Start the run
    const { run } = await getOrCreateRun(story.id, null, playerId) as any
    if (!run) throw new Error('Failed to create run')
    console.log(`✅ Started Run: ${run.id} at ${run.currentPassageId}`)

    // 4. Advance through Nation selection
    // In our seed, 'The Awakening' links to 'Nation: Vibulon' (and others)
    console.log('⏩ Advancing to The Awakening...')
    const res0 = await advanceRun(story.id, 'The Awakening', null, playerId)
    if (res0.error) throw new Error(`Advance failed: ${res0.error}`)

    console.log('⏩ Advancing to Nation selection...')
    const res1 = await advanceRun(story.id, 'Nation: Vibulon', null, playerId)
    if (res1.error) throw new Error(`Advance failed: ${res1.error}`)

    // Verify Nation set
    const virelune = await db.nation.findFirst({ where: { name: 'Virelune' } })
    let updatedPlayer = await db.player.findUnique({ where: { id: playerId } })
    console.log(`📊 Nation set: ${updatedPlayer?.nationId} (expected ${virelune?.id})`)
    if (updatedPlayer?.nationId !== virelune?.id) throw new Error('Nation not set correctly')

    // 5. Advance through Archetype selection
    console.log('⏩ Advancing to Archetype selection...')
    await advanceRun(story.id, 'The Archetype', null, playerId)
    await advanceRun(story.id, 'Archetype: The Catalyst', null, playerId)

    // Verify Archetype set
    const boldHeart = await db.playbook.findFirst({ where: { name: 'The Bold Heart' } })
    updatedPlayer = await db.player.findUnique({ where: { id: playerId } })
    console.log(`📊 Archetype set: ${updatedPlayer?.playbookId} (expected ${boldHeart?.id})`)
    if (updatedPlayer?.playbookId !== boldHeart?.id) throw new Error('Archetype not set correctly')

    // 6. Finish (DASHBOARD)
    console.log('⏩ Advancing to Conclusion and Dashboard...')
    await advanceRun(story.id, 'Conclusion', null, playerId)
    const result = await advanceRun(story.id, 'DASHBOARD', null, playerId) as any
    console.log(`📊 Final Redirect: ${result.redirect}`)

    // Verify Onboarding Complete
    updatedPlayer = await db.player.findUnique({ where: { id: playerId } })
    console.log(`📊 Onboarding Complete: ${updatedPlayer?.onboardingComplete}`)
    if (!updatedPlayer?.onboardingComplete) throw new Error('Onboarding not marked complete')

    // 7. Verify Quest Completion Transaction
    // Create a dummy quest
    const quest = await db.customBar.create({
        data: {
            creatorId: playerId,
            title: 'Verification Quest',
            description: 'Test quest',
            type: 'vibe',
            reward: 5,
            status: 'active',
            inputs: '[]',
            rootId: 'temp'
        }
    })

    console.log('⏩ Verifying Transactional Quest Completion...')
    const completion = await completeQuestForPlayer(playerId, quest.id, { test: true }) as any
    console.log(`📊 Completion Reward: ${completion.reward}`)

    const vibulonCount = await db.vibulon.count({ where: { ownerId: playerId, originId: quest.id } })
    console.log(`📊 Vibulon Tokens Minted: ${vibulonCount}`)
    if (vibulonCount !== 5) throw new Error('Vibulon tokens not minted correctly')

    console.log('✨ E2E Verification Passed!')
}

verifyE2E().catch(err => {
    console.error('❌ Verification Failed:', err)
    process.exit(1)
})
