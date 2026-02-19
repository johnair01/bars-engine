import { db } from '../src/lib/db'

async function seedOrientation() {
    console.log('--- SEEDING ORIENTATION ADVENTURE ---')

    // 0. Find Admin
    const admin = await db.player.findFirst({
        where: { roles: { some: { role: { key: 'admin' } } } }
    })

    if (!admin) {
        console.error('No admin found to create the story!')
        return
    }
    const adminId = admin.id

    // 1. Create the Story
    const storyData = {
        title: 'The First Ritual',
        slug: 'the-first-ritual',
        sourceType: 'stitched',
        sourceText: 'The official orientation journey for BARS ENGINE.',
        isPublished: true,
        createdById: adminId,
        parsedJson: JSON.stringify({
            title: 'The First Ritual',
            startPassage: '1. Awakening',
            passages: [
                {
                    name: '1. Awakening',
                    text: 'You open your eyes. The air is thick with potential. A digital voice echoes: "Welcome, Operative. Name yourself."',
                    links: [{ label: 'I am ready.', target: 'The Awakening' }]
                },
                {
                    name: 'The Awakening',
                    text: 'To navigate the BARS, you must choose a Nation. Where does your loyalty lie?',
                    links: [
                        { label: 'The Sovereign', target: 'Nation: Argyra' },
                        { label: 'The Nomad', target: 'Nation: Vibulon' }
                    ]
                },
                {
                    name: 'Nation: Vibulon',
                    text: 'Virelune accepted. Now, how do you manifest your power?',
                    links: [{ label: 'Continue', target: 'The Archetype' }]
                },
                {
                    name: 'Nation: Argyra',
                    text: 'Argyra accepted. Now, how do you manifest your power?',
                    links: [{ label: 'Continue', target: 'The Archetype' }]
                },
                {
                    name: 'The Archetype',
                    text: 'What is your Archetype?',
                    links: [
                        { label: 'The Catalyst', target: 'Archetype: The Catalyst' },
                        { label: 'The Connector', target: 'Archetype: The Connector' }
                    ]
                },
                {
                    name: 'Archetype: The Catalyst',
                    text: 'Archetype synchronized.',
                    links: [{ label: 'Continue', target: 'Conclusion' }]
                },
                {
                    name: 'Archetype: The Connector',
                    text: 'Archetype synchronized.',
                    links: [{ label: 'Continue', target: 'Conclusion' }]
                },
                {
                    name: 'Conclusion',
                    text: 'The ritual is complete. Welcome to the Conclave.',
                    links: [{ label: 'Enter Dashboard', target: 'DASHBOARD' }]
                }
            ]
        })
    }

    const story = await db.twineStory.upsert({
        where: { slug: 'the-first-ritual' },
        update: storyData,
        create: storyData
    })

    // 2. Clean up old bindings for this story
    await db.twineBinding.deleteMany({ where: { storyId: story.id } })

    // 3. Resolve real world data
    const argyra = await db.nation.findFirst({ where: { name: 'Argyra' } })
    const virelune = await db.nation.findFirst({ where: { name: 'Virelune' } })
    const boldHeart = await db.playbook.findFirst({ where: { name: 'The Bold Heart' } })
    const joyfulConnector = await db.playbook.findFirst({ where: { name: 'The Joyful Connector' } })

    if (!argyra || !virelune || !boldHeart || !joyfulConnector) {
        console.warn('⚠️ Some world data (Nations/Playbooks) not found. Seed might have broken links.')
    }

    // 4. Create Bindings
    console.log('🔗 Creating Bindings...')
    const bindings = [
        // Nation selections
        { scopeId: 'Nation: Vibulon', actionType: 'SET_NATION', payload: { nationId: virelune?.id || 'virelune' } },
        { scopeId: 'Nation: Argyra', actionType: 'SET_NATION', payload: { nationId: argyra?.id || 'argyra' } },
        // Archetype selections
        { scopeId: 'Archetype: The Catalyst', actionType: 'SET_ARCHETYPE', payload: { playbookId: boldHeart?.id || 'bold-heart' } },
        { scopeId: 'Archetype: The Connector', actionType: 'SET_ARCHETYPE', payload: { playbookId: joyfulConnector?.id || 'joyful-connector' } },
        // Quest emission
        { scopeId: 'DASHBOARD', actionType: 'EMIT_QUEST', payload: { title: 'The Second Ritual', description: 'Continue your journey...' } },
    ]

    for (const b of bindings) {
        await db.twineBinding.create({
            data: {
                storyId: story.id,
                scopeType: 'passage',
                scopeId: b.scopeId,
                actionType: b.actionType,
                payload: JSON.stringify(b.payload),
                createdById: adminId
            }
        })
    }

    console.log(`✨ SEEDED: ${story.title} (${story.id})`)
}

seedOrientation().catch(console.error)
