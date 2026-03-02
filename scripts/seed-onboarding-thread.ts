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

import './require-db-env'
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
        status: 'deprecated',
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

    // 5. Build Your Character orientation thread (existing players with nation/archetype but no avatar)
    console.log('\nCreating Build Your Character thread...')

    const buildCharPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'Your nation and archetype define your avatar. Confirm your character to see your sprite in the Conclave.',
            cleanText: 'Your nation and archetype define your avatar. Confirm your character.',
            links: [
                { label: 'Confirm', target: 'END_SUCCESS' },
                { label: 'Report Issue', target: 'FEEDBACK' }
            ]
        },
        {
            name: 'FEEDBACK',
            pid: '3',
            text: '### Report an Issue\n\nSomething isn\'t working? Describe what you encountered so we can fix it.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '2',
            text: 'Character confirmed. Your avatar is now derived from your nation and archetype.',
            cleanText: 'Character confirmed.',
            links: []
        }
    ]
    const buildCharParsedJson = JSON.stringify({
        title: 'Build Your Character',
        startPassage: 'START',
        passages: buildCharPassages
    })

    const buildCharStory = await db.twineStory.upsert({
        where: { slug: 'build-character' },
        update: {
            title: 'Build Your Character',
            parsedJson: buildCharParsedJson,
            isPublished: true
        },
        create: {
            title: 'Build Your Character',
            slug: 'build-character',
            sourceType: 'manual_seed',
            sourceText: 'Build Your Character orientation quest (seed-onboarding-thread.ts)',
            parsedJson: buildCharParsedJson,
            isPublished: true,
            createdById: creator.id
        }
    })

    const buildCharQuest = await db.customBar.upsert({
        where: { id: 'build-character-quest' },
        update: {
            title: 'Build Your Character',
            description: 'Your nation and archetype define your avatar. Confirm your character to see your sprite in the Conclave.',
            type: 'onboarding',
            reward: 1,
            twineStoryId: buildCharStory.id,
            completionEffects: JSON.stringify({ effects: [{ type: 'deriveAvatarFromExisting' }] })
        },
        create: {
            id: 'build-character-quest',
            title: 'Build Your Character',
            description: 'Your nation and archetype define your avatar. Confirm your character to see your sprite in the Conclave.',
            type: 'onboarding',
            creatorId: creator.id,
            reward: 1,
            twineStoryId: buildCharStory.id,
            visibility: 'private',
            isSystem: true,
            completionEffects: JSON.stringify({ effects: [{ type: 'deriveAvatarFromExisting' }] })
        }
    })

    let buildCharThread = await db.questThread.findUnique({
        where: { id: 'build-character-thread' }
    })
    const buildCharThreadData = {
        title: 'Build Your Character',
        description: 'Derive your avatar from your nation and archetype. For existing players who have chosen but not yet generated their character.',
        threadType: 'orientation',
        creatorType: 'system' as const,
        creatorId: creator.id,
        completionReward: 1,
        status: 'active'
    }
    if (buildCharThread) {
        buildCharThread = await db.questThread.update({ where: { id: buildCharThread.id }, data: buildCharThreadData })
        console.log(`  ↻ Build Your Character thread updated: ${buildCharThread.id}`)
    } else {
        buildCharThread = await db.questThread.create({
            data: { id: 'build-character-thread', ...buildCharThreadData }
        })
        console.log(`  ✦ Build Your Character thread created: ${buildCharThread.id}`)
    }

    await db.threadQuest.upsert({
        where: {
            threadId_questId: { threadId: buildCharThread.id, questId: buildCharQuest.id }
        },
        update: { position: 1 },
        create: { threadId: buildCharThread.id, questId: buildCharQuest.id, position: 1 }
    })
    console.log(`  Linked Build Your Character quest to thread`)

    // 6. Request from Library orientation thread (basic quest after onboarding)
    console.log('\nCreating Request from Library thread...')

    const kSpacePassages = [
        {
            name: 'START',
            pid: '1',
            text: 'Librarians in the Conclave are interested in making sure the information people need is readily available. Use Request from Library to ask for help. If we have an answer, you\'ll get a link. Otherwise, a DocQuest is created for the community.',
            cleanText: 'Librarians want info readily available. Use Request from Library.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Request from Library\n\nOpen the [dashboard](/). Click **Request from Library** in the header.',
            cleanText: 'Open the dashboard. Click Request from Library in the header.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Submit a request\n\nSubmit a request (e.g. "How do I earn vibeulons?").',
            cleanText: 'Submit a request (e.g. How do I earn vibeulons?).',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Confirm result\n\nIf resolved: confirm you got a link to a doc. If spawned: a DocQuest was created and added to your Active Quests.',
            cleanText: 'If resolved: confirm you got a doc link. If spawned: DocQuest added to Active Quests.',
            links: [{ label: 'Complete', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '6',
            text: '### Report an Issue\n\nSomething isn\'t working? Describe what you encountered.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '5',
            text: 'Verification complete. You\'ve helped the knowledge base.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]
    const kSpaceParsedJson = JSON.stringify({
        title: 'Help the Knowledge Base',
        startPassage: 'START',
        passages: kSpacePassages
    })

    const kSpaceStory = await db.twineStory.upsert({
        where: { slug: 'k-space-librarian-basic' },
        update: {
            title: 'Request from Library',
            parsedJson: kSpaceParsedJson,
            isPublished: true
        },
        create: {
            title: 'Request from Library',
            slug: 'k-space-librarian-basic',
            sourceType: 'manual_seed',
            sourceText: 'K-Space Librarian post-onboarding quest (seed-onboarding-thread.ts)',
            parsedJson: kSpaceParsedJson,
            isPublished: true,
            createdById: creator.id
        }
    })

    const kSpaceQuest = await db.customBar.upsert({
        where: { id: 'k-space-librarian-quest' },
        update: {
            title: 'Request from Library',
            description: 'Librarians in the Conclave make sure the information people need is readily available. Submit a request—get a doc link or spawn a DocQuest for the community.',
            type: 'onboarding',
            reward: 1,
            twineStoryId: kSpaceStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: 'k-space-librarian-quest',
            title: 'Help the Knowledge Base',
            description: 'Submit a Library Request to improve the app and knowledge base. Get a doc link or spawn a DocQuest.',
            type: 'onboarding',
            creatorId: creator.id,
            reward: 1,
            twineStoryId: kSpaceStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    let kSpaceThread = await db.questThread.findUnique({
        where: { id: 'k-space-librarian-thread' }
    })
    const kSpaceThreadData = {
        title: 'Request from Library',
        description: 'Librarians make info readily available. Submit a request to get answers or spawn DocQuests for the community.',
        threadType: 'orientation',
        creatorType: 'system' as const,
        creatorId: creator.id,
        completionReward: 1,
        status: 'active'
    }
    if (kSpaceThread) {
        kSpaceThread = await db.questThread.update({ where: { id: kSpaceThread.id }, data: kSpaceThreadData })
        console.log(`  ↻ Help the Knowledge Base thread updated: ${kSpaceThread.id}`)
    } else {
        kSpaceThread = await db.questThread.create({
            data: { id: 'k-space-librarian-thread', ...kSpaceThreadData }
        })
        console.log(`  ✦ Help the Knowledge Base thread created: ${kSpaceThread.id}`)
    }

    await db.threadQuest.upsert({
        where: {
            threadId_questId: { threadId: kSpaceThread.id, questId: kSpaceQuest.id }
        },
        update: { position: 1 },
        create: { threadId: kSpaceThread.id, questId: kSpaceQuest.id, position: 1 }
    })
    console.log(`  Linked Request from Library quest to thread`)

    // 7. BARs Wallet Guide orientation thread (dashboard-ui-vibe-cleanup Phase 4)
    console.log('\nCreating BARs Wallet Guide thread...')
    const barsWalletQuest = await db.customBar.upsert({
        where: { id: 'bars-wallet-guide-quest' },
        update: {
            title: 'BARs Wallet Guide',
            description: 'Your BARs wallet is where you create, manage, and share BARs. [Visit the BARs page](/bars) to create your first BAR or browse what you\'ve made.',
            type: 'onboarding',
            reward: 1,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            inputs: JSON.stringify([{ key: 'visited', label: 'I\'ve visited the BARs page', type: 'text', placeholder: 'Optional note', required: false }])
        },
        create: {
            id: 'bars-wallet-guide-quest',
            title: 'BARs Wallet Guide',
            description: 'Your BARs wallet is where you create, manage, and share BARs. [Visit the BARs page](/bars) to create your first BAR or browse what you\'ve made.',
            type: 'onboarding',
            creatorId: creator.id,
            reward: 1,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            inputs: JSON.stringify([{ key: 'visited', label: 'I\'ve visited the BARs page', type: 'text', placeholder: 'Optional note', required: false }])
        }
    })
    let barsWalletThread = await db.questThread.findUnique({ where: { id: 'bars-wallet-guide-thread' } })
    const barsWalletThreadData = {
        title: 'BARs Wallet Guide',
        description: 'Learn where to create and manage your BARs.',
        threadType: 'orientation',
        creatorType: 'system' as const,
        creatorId: creator.id,
        completionReward: 1,
        status: 'active'
    }
    if (barsWalletThread) {
        barsWalletThread = await db.questThread.update({ where: { id: barsWalletThread.id }, data: barsWalletThreadData })
    } else {
        barsWalletThread = await db.questThread.create({ data: { id: 'bars-wallet-guide-thread', ...barsWalletThreadData } })
    }
    await db.threadQuest.upsert({
        where: { threadId_questId: { threadId: barsWalletThread.id, questId: barsWalletQuest.id } },
        update: { position: 1 },
        create: { threadId: barsWalletThread.id, questId: barsWalletQuest.id, position: 1 }
    })
    console.log(`  Linked BARs Wallet Guide quest to thread`)

    // 8. Emotional First Aid orientation thread (dashboard-ui-vibe-cleanup Phase 4)
    console.log('\nCreating Emotional First Aid thread...')
    const efaQuest = await db.customBar.upsert({
        where: { id: 'emotional-first-aid-guide-quest' },
        update: {
            title: 'Emotional First Aid Kit',
            description: 'When you\'re blocked emotionally, the Medbay has protocols to help. Learn how to use the Emotional First Aid Kit to unblock and return to flow.',
            type: 'onboarding',
            reward: 1,
            moveType: 'cleanUp',
            status: 'active',
            visibility: 'public',
            isSystem: true,
            inputs: JSON.stringify([{ key: 'acknowledged', label: 'I\'ve tried the Emotional First Aid Kit', type: 'text', placeholder: 'Optional', required: false }])
        },
        create: {
            id: 'emotional-first-aid-guide-quest',
            title: 'Emotional First Aid Kit',
            description: 'When you\'re blocked emotionally, the Medbay has protocols to help. Learn how to use the Emotional First Aid Kit to unblock and return to flow.',
            type: 'onboarding',
            creatorId: creator.id,
            reward: 1,
            moveType: 'cleanUp',
            status: 'active',
            visibility: 'public',
            isSystem: true,
            inputs: JSON.stringify([{ key: 'acknowledged', label: 'I\'ve tried the Emotional First Aid Kit', type: 'text', placeholder: 'Optional', required: false }])
        }
    })
    let efaThread = await db.questThread.findUnique({ where: { id: 'emotional-first-aid-guide-thread' } })
    const efaThreadData = {
        title: 'Emotional First Aid',
        description: 'Learn to use the Medbay when blocked emotionally.',
        threadType: 'orientation',
        creatorType: 'system' as const,
        creatorId: creator.id,
        completionReward: 1,
        status: 'active'
    }
    if (efaThread) {
        efaThread = await db.questThread.update({ where: { id: efaThread.id }, data: efaThreadData })
    } else {
        efaThread = await db.questThread.create({ data: { id: 'emotional-first-aid-guide-thread', ...efaThreadData } })
    }
    await db.threadQuest.upsert({
        where: { threadId_questId: { threadId: efaThread.id, questId: efaQuest.id } },
        update: { position: 1 },
        create: { threadId: efaThread.id, questId: efaQuest.id, position: 1 }
    })
    console.log(`  Linked Emotional First Aid quest to thread`)

    // 9. Four Moves orientation thread (dashboard-ui-vibe-cleanup Phase 4)
    console.log('\nCreating Four Moves orientation thread...')
    const fourMovesQuests: { id: string; title: string; moveType: string; description: string }[] = [
        { id: 'four-moves-wake-up-quest', title: 'Wake Up', moveType: 'wakeUp', description: 'Wake Up is about awareness and insight. See what\'s available: who can help, what resources exist, where the work happens. Quests tagged Wake Up help you see more clearly before acting.' },
        { id: 'four-moves-clean-up-quest', title: 'Clean Up', moveType: 'cleanUp', description: 'Clean Up is about unblocking emotional energy. When something is blocking you, Clean Up quests help you clear the way so you can move forward.' },
        { id: 'four-moves-grow-up-quest', title: 'Grow Up', moveType: 'growUp', description: 'Grow Up is about building skill and capacity. These quests help you develop new abilities and expand what you can do.' },
        { id: 'four-moves-show-up-quest', title: 'Show Up', moveType: 'showUp', description: 'Show Up is about doing the work. When you\'re ready to act, Show Up quests help you contribute directly to the collective.' }
    ]
    const fourMovesCreated: { id: string; quest: any }[] = []
    for (const q of fourMovesQuests) {
        const quest = await db.customBar.upsert({
            where: { id: q.id },
            update: { title: q.title, description: q.description, moveType: q.moveType, type: 'onboarding', reward: 1 },
            create: {
                id: q.id,
                title: q.title,
                description: q.description,
                moveType: q.moveType,
                type: 'onboarding',
                creatorId: creator.id,
                reward: 1,
                status: 'active',
                visibility: 'public',
                isSystem: true,
                inputs: JSON.stringify([])
            }
        })
        fourMovesCreated.push({ id: q.id, quest })
    }
    let fourMovesThread = await db.questThread.findUnique({ where: { id: 'four-moves-orientation-thread' } })
    const fourMovesThreadData = {
        title: 'The Four Moves',
        description: 'Wake Up, Clean Up, Grow Up, Show Up—how quests interface with your journey.',
        threadType: 'orientation',
        creatorType: 'system' as const,
        creatorId: creator.id,
        completionReward: 2,
        status: 'active'
    }
    if (fourMovesThread) {
        fourMovesThread = await db.questThread.update({ where: { id: fourMovesThread.id }, data: fourMovesThreadData })
    } else {
        fourMovesThread = await db.questThread.create({ data: { id: 'four-moves-orientation-thread', ...fourMovesThreadData } })
    }
    await db.threadQuest.deleteMany({ where: { threadId: fourMovesThread.id } })
    await db.threadQuest.createMany({
        data: fourMovesQuests.map((q, i) => ({
            threadId: fourMovesThread.id,
            questId: q.id,
            position: i + 1
        }))
    })
    console.log(`  Linked ${fourMovesQuests.length} Four Moves quests to thread`)

    // 10. Summary
    console.log('\n=== ONBOARDING THREAD READY ===')
    console.log(`Thread: "${thread.title}" (${thread.id})`)
    console.log(`Type: ${thread.threadType}`)
    console.log(`Quests:`)
    console.log(`  1. ${q1.title} (${q1.id})`)
    console.log(`  2. ${q2.title} (${q2.id})`)
    console.log(`  3. ${q3.title} (${q3.id})`)
    console.log(`  4. ${q4.title} (${q4.id})`)
    console.log(`Completion Reward: ${thread.completionReward} vibeulons`)
    console.log(`\nBuild Your Character thread: "${buildCharThread.title}" (${buildCharThread.id})`)
    console.log(`  Quest: ${buildCharQuest.title} (${buildCharQuest.id})`)
    console.log(`\nRequest from Library thread: "${kSpaceThread.title}" (${kSpaceThread.id})`)
    console.log(`  Quest: ${kSpaceQuest.title} (${kSpaceQuest.id})`)
    console.log(`\nBARs Wallet Guide thread: "${barsWalletThread.title}" (${barsWalletThread.id})`)
    console.log(`Emotional First Aid thread: "${efaThread.title}" (${efaThread.id})`)
    console.log(`Four Moves thread: "${fourMovesThread.title}" (${fourMovesThread.id})`)
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
