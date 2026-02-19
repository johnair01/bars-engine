/**
 * Seed Onboarding Quest Thread
 *
 * Creates the default orientation thread that new players are auto-assigned to.
 * Each quest uses completionEffects to set player state (nation, archetype, etc.)
 *
 * Run with: npx tsx scripts/seed-onboarding-thread.ts
 *
 * Idempotent — safe to re-run. Updates existing quests/thread if found.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const THREAD_TITLE = 'Welcome to the Conclave'

async function upsertQuestByTitle(title: string, data: any) {
    const existing = await db.customBar.findFirst({ where: { title } })
    if (existing) {
        console.log(`  ↻ Quest "${title}" exists — updating`)
        return db.customBar.update({ where: { id: existing.id }, data })
    }
    console.log(`  ✦ Creating quest "${title}"`)
    return db.customBar.create({ data: { ...data, title } })
}

async function main() {
    console.log('=== SEEDING ONBOARDING QUEST THREAD ===\n')

    // 0. Find admin creator
    const admin = await db.player.findFirst({
        where: { roles: { some: { role: { key: 'admin' } } } }
    })
    const creator = admin || await db.player.findFirst()
    if (!creator) {
        console.error('❌ No players found. Create at least one player first.')
        process.exit(1)
    }
    console.log(`Using creator: ${creator.name} (${creator.id})\n`)

    // 1. Fetch nations and playbooks for reference
    const nations = await db.nation.findMany({ select: { id: true, name: true, description: true }, orderBy: { name: 'asc' } })
    const playbooks = await db.playbook.findMany({ select: { id: true, name: true, description: true }, orderBy: { name: 'asc' } })

    if (nations.length === 0 || playbooks.length === 0) {
        console.error('❌ No nations or playbooks found. Run seed-world-content.ts first.')
        process.exit(1)
    }
    console.log(`Found ${nations.length} nations, ${playbooks.length} playbooks\n`)

    // 2. Create the 4 onboarding quests
    console.log('Creating onboarding quests...')

    // Quest 1: Welcome
    const q1 = await upsertQuestByTitle('Welcome to the Conclave', {
        description: `Welcome, traveler. You've been invited to the Conclave — a space where shared intention becomes tangible through quests, vibeulons, and collective action.\n\n**Your first task:** Tell us what brought you here. What are you hoping to find or build?\n\nThis begins your journey. Every step earns vibeulons ♦ — the currency of contribution.`,
        type: 'onboarding',
        reward: 2,
        creatorId: creator.id,
        visibility: 'private',
        isSystem: true,
        inputs: JSON.stringify([
            {
                key: 'introduction',
                label: 'What brought you here?',
                type: 'textarea',
                placeholder: 'Share your intention...'
            }
        ]),
        completionEffects: JSON.stringify({
            questSource: 'onboarding',
            effects: []
        })
    })

    // Quest 2: Choose Nation
    // Build nation options into the quest description
    const nationChoices = nations.map(n => `- **${n.name}**: ${n.description}`).join('\n')
    const nationInputOptions = nations.map(n => ({ value: n.id, label: n.name }))

    const q2 = await upsertQuestByTitle('Declare Your Nation', {
        description: `Every player belongs to a Nation — a community that reflects how you show up in the world.\n\nEach nation has its own strengths, moves, and way of being. Choose the one that resonates with you:\n\n${nationChoices}\n\n*Don't overthink it — you can change your nation later through admin support.*`,
        type: 'onboarding',
        reward: 3,
        creatorId: creator.id,
        visibility: 'private',
        isSystem: true,
        inputs: JSON.stringify([
            {
                key: 'nationId',
                label: 'Choose your Nation',
                type: 'select',
                options: nationInputOptions,
                required: true
            }
        ]),
        completionEffects: JSON.stringify({
            questSource: 'onboarding',
            effects: [
                { type: 'setNation', fromInput: 'nationId' }
            ]
        })
    })

    // Quest 3: Choose Archetype
    const archetypeChoices = playbooks.map(p => `- **${p.name}**: ${p.description}`).join('\n')
    const archetypeInputOptions = playbooks.map(p => ({ value: p.id, label: p.name }))

    const q3 = await upsertQuestByTitle('Discover Your Archetype', {
        description: `Your Archetype defines your style of play — the lens through which you engage with quests and community.\n\n${archetypeChoices}\n\n*Your archetype shapes the quests you receive and how you earn vibeulons. Choose what feels right.*`,
        type: 'onboarding',
        reward: 3,
        creatorId: creator.id,
        visibility: 'private',
        isSystem: true,
        inputs: JSON.stringify([
            {
                key: 'playbookId',
                label: 'Choose your Archetype',
                type: 'select',
                options: archetypeInputOptions,
                required: true
            }
        ]),
        completionEffects: JSON.stringify({
            questSource: 'onboarding',
            effects: [
                { type: 'setPlaybook', fromInput: 'playbookId' }
            ]
        })
    })

    // Quest 4: First community action + mark onboarding complete
    const q4 = await upsertQuestByTitle('Send Your First Signal', {
        description: `You're almost ready. For your final onboarding quest, send a signal to the Conclave.\n\nThis can be a message, an intention, a vibe — anything you want to put into the collective field.\n\nWhen you complete this quest, you'll unlock the full dashboard and start receiving community quests.`,
        type: 'onboarding',
        reward: 5,
        creatorId: creator.id,
        visibility: 'private',
        isSystem: true,
        inputs: JSON.stringify([
            {
                key: 'signal',
                label: 'Your signal to the Conclave',
                type: 'textarea',
                placeholder: 'What do you want to put into the field?'
            }
        ]),
        completionEffects: JSON.stringify({
            questSource: 'onboarding',
            effects: [
                { type: 'markOnboardingComplete' }
            ]
        })
    })

    const questIds = [q1.id, q2.id, q3.id, q4.id]
    console.log(`\nCreated ${questIds.length} quests\n`)

    // 3. Create/update the orientation thread
    console.log('Creating orientation thread...')

    let thread = await db.questThread.findFirst({
        where: { title: THREAD_TITLE }
    })

    const threadData = {
        title: THREAD_TITLE,
        description: 'Your guided introduction to the Conclave. Choose your nation-+, discover your archetype, and send your first signal.',
        threadType: 'orientation',
        creatorType: 'system' as const,
        creatorId: creator.id,
        completionReward: 5,
    }

    if (thread) {
        thread = await db.questThread.update({ where: { id: thread.id }, data: threadData })
        console.log(`  ↻ Thread updated: ${thread.id}`)
    } else {
        thread = await db.questThread.create({ data: threadData })
        console.log(`  ✦ Thread created: ${thread.id}`)
    }

    // 4. Link quests to thread (clear and re-add for order)
    await db.threadQuest.deleteMany({ where: { threadId: thread.id } })
    await db.threadQuest.createMany({
        data: questIds.map((questId, index) => ({
            threadId: thread.id,
            questId,
            position: index + 1,
        }))
    })
    console.log(`  Linked ${questIds.length} quests at positions 1-${questIds.length}`)

    // 5. Summary
    console.log('\n=== ONBOARDING THREAD READY ===')
    console.log(`Thread: "${thread.title}" (${thread.id})`)
    console.log(`Type: ${thread.threadType}`)
    console.log(`Quests:`)
    console.log(`  1. ${q1.title} (${q1.id})`)
    console.log(`  2. ${q2.title} (${q2.id})`)
    console.log(`  3. ${q3.title} (${q3.id})`)
    console.log(`  4. ${q4.title} (${q4.id})`)
    console.log(`Completion Reward: ${thread.completionReward} vibeulons`)
    console.log(`\nNew players will be auto-assigned via assignOrientationThreads()`)
}

main()
    .catch((e) => {
        console.error('Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
