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
        // @ts-ignore
        process.exit(1)
        return // for TS
    }
    console.log(`Using creator: ${creator.name} (${creator.id})\n`)

    // 1. Fetch nations and playbooks for reference
    const nations = await db.nation.findMany({ select: { id: true, name: true, description: true }, orderBy: { name: 'asc' } })
    const playbooks = await db.playbook.findMany({ select: { id: true, name: true, description: true }, orderBy: { name: 'asc' } })

    const pyrakanth = nations.find(n => n.name === 'Pyrakanth') || nations[0]
    const dangerWalker = playbooks.find(p => p.name === 'The Danger Walker') || playbooks[0]

    if (nations.length === 0 || playbooks.length === 0) {
        console.error('❌ No nations or playbooks found. Run seed-world-content.ts first.')
        process.exit(1)
    }
    console.log(`Found ${nations.length} nations, ${playbooks.length} playbooks\n`)

    // 2. Create the 4 onboarding quests
    console.log('Creating onboarding quests...')

    // Helper to ensure dummy Twine stories exist for onboarding
    async function ensureSkeletonStory(title: string, startPassage: string) {
        const existing = await db.twineStory.findFirst({ where: { title } })
        if (existing) return existing

        const skeletonJson = JSON.stringify({
            startPassage,
            passages: [
                {
                    name: startPassage,
                    text: `Welcome to the ${title} journey. This is a skeleton story. Admin: edit this in the Twine section.`,
                    cleanText: `Welcome to the ${title} journey. This is a skeleton story. Admin: edit this in the Twine section.`,
                    links: []
                }
            ]
        })

        return db.twineStory.create({
            data: {
                title,
                sourceText: `:: ${startPassage}\nWelcome to the ${title} journey. This is a skeleton story.`,
                parsedJson: skeletonJson,
                isPublished: true,
                createdById: creator.id
            }
        })
    }

    // Get the real stories imported from the HTML
    const getStory = async (title: string) => {
        const s = await db.twineStory.findFirst({ where: { title } })
        if (!s) {
            console.warn(`Warning: Could not find story: ${title}. Using skeleton...`)
            return ensureSkeletonStory(title, 'Start')
        }
        return s
    }

    const storyWelcome = await getStory('Welcome to the Conclave')
    const storyNation = await getStory('Declare Your Nation')
    const storyArchetype = await getStory('Discover Your Archetype')
    const storySignal = await getStory('Send Your First Signal')

    // Quest 1: Welcome
    const q1 = await upsertQuestByTitle('Welcome to the Conclave', {
        description: `Welcome, traveler. You've been invited to the Conclave — a space where shared intention becomes tangible through quests, vibeulons, and collective action.\n\n**Your first task:** Tell us what brought you here. What are you hoping to find or build?\n\nThis begins your journey. Every step earns vibeulons ♦ — the currency of contribution.`,
        type: 'onboarding',
        reward: 2,
        creatorId: creator.id,
        visibility: 'private',
        isSystem: true,
        twineStoryId: storyWelcome.id,
        inputs: JSON.stringify([
            {
                key: 'playerName',
                label: 'What is your name (CODEX ID)?',
                type: 'text',
                placeholder: 'Enter your preferred name...',
                required: true
            },
            {
                key: 'introduction',
                label: 'What brought you here?',
                type: 'textarea',
                placeholder: 'Share your intention...'
            }
        ]),
        completionEffects: JSON.stringify({
            questSource: 'onboarding',
            effects: [
                { type: 'setPlayerName', fromInput: 'playerName' }
            ]
        })
    })

    // Quest 2: Nation
    const q2 = await upsertQuestByTitle('Declare Your Nation', {
        description: `Your resonance is starting to show. Every player belongs to a Nation — a cultural and philosophical alignment that defines their origin and initial toolkit.\n\n**Your task:** Complete the narrative challenge to discover your Nation.`,
        type: 'onboarding',
        reward: 3,
        creatorId: creator.id,
        visibility: 'private',
        isSystem: true,
        twineStoryId: storyNation.id,
        inputs: JSON.stringify([
            {
                key: 'nationId',
                label: 'Selected Nation',
                type: 'hidden'
            }
        ]),
        completionEffects: JSON.stringify({
            questSource: 'onboarding',
            effects: [
                { type: 'setNation', fromInput: 'nationId', value: pyrakanth.id }
            ]
        })
    })

    // Quest 3: Archetype
    const q3 = await upsertQuestByTitle('Discover Your Archetype', {
        description: `With your origin settled, we must find your function. Your Archetype (Playbook) defines your unique moves and how you contribute to collective action.\n\n**Your task:** Complete the narrative challenge to discover your Archetype.`,
        type: 'onboarding',
        reward: 3,
        creatorId: creator.id,
        visibility: 'private',
        isSystem: true,
        twineStoryId: storyArchetype.id,
        inputs: JSON.stringify([
            {
                key: 'playbookId',
                label: 'Selected Archetype',
                type: 'hidden'
            }
        ]),
        completionEffects: JSON.stringify({
            questSource: 'onboarding',
            effects: [
                { type: 'setPlaybook', fromInput: 'playbookId', value: dangerWalker.id }
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
        twineStoryId: storySignal.id,
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
        // @ts-ignore
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
