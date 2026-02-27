import './require-db-env'
import { db } from '../src/lib/db'

async function seed() {
    console.log('--- Seeding Market Validation Quest ---')

    const creator = await db.player.findFirst()
    if (!creator) throw new Error('No player found for createdById')
    const createdById = creator.id

    const title = 'Validation: Market Identity & Filtering'
    const slug = 'validation-market-identity'

    const passages = [
        {
            name: 'START',
            text: 'Welcome to the Market Oversight Protocol.\n\nWe have deployed the "Market Identity" overhaul. This adventure will guide you through the verification ritual.\n\n[[Enter the Market|STEP_1_FILTERS]]',
            cleanText: 'Welcome to the Market Oversight Protocol.\n\nWe have deployed the "Market Identity" overhaul. This adventure will guide you through the verification ritual.',
            links: [{ label: 'Enter the Market', target: 'STEP_1_FILTERS' }]
        },
        {
            name: 'STEP_1_FILTERS',
            text: '### Step 1: Dynamic Discovery\n\nNavigate to the **Market (Available Bars)** page.\n\n1. Verify the "Advanced Filters" toggle exists.\n2. Click it. Verify Kotter Stages appear.\n3. Verify only Nations/Archetypes with active quests are listed as buttons.\n\n[[Discovery Verified|STEP_2_METADATA]]',
            cleanText: '### Step 1: Dynamic Discovery\n\nNavigate to the Market page. Verify filters and toggles.',
            links: [{ label: 'Discovery Verified', target: 'STEP_2_METADATA' }]
        },
        {
            name: 'STEP_2_METADATA',
            text: '### Step 2: Identity Metadata\n\nLook at the Quest Cards in the market.\n\n1. Verify cards show **Nation** and **Archetype** badges.\n2. Verify the "by [Name]" or "by Anonymous" label matches the quest privacy settings.\n\n[[Identity Verified|BATTLE_REPORT]]',
            cleanText: '### Step 2: Identity Metadata\n\nVerify card badges and anonymity labels.',
            links: [{ label: 'Identity Verified', target: 'BATTLE_REPORT' }]
        },
        {
            name: 'BATTLE_REPORT',
            text: '### Battle Report\n\nPlease log any UI glitches or logic gaps below. Your signal is tracked.\n\n[[Complete Quest|END_SUCCESS]]',
            cleanText: '### Battle Report\n\nPlease log any findings below.',
            links: [{ label: 'Complete Quest', target: 'END_SUCCESS' }]
        },
        {
            name: 'END_SUCCESS',
            text: 'Market Verification complete. The Discovery Layer is stable.',
            cleanText: 'Market Verification complete. The Discovery Layer is stable.',
            links: []
        }
    ]

    const parsedJson = JSON.stringify({
        title,
        startPassage: 'START',
        passages
    })

    const story = await db.twineStory.upsert({
        where: { slug },
        update: {
            title,
            parsedJson,
            isPublished: true
        },
        create: {
            title,
            slug,
            sourceType: 'manual_seed',
            sourceText: 'Market Validation Seed',
            parsedJson,
            isPublished: true,
            createdById
        }
    })

    const quest = await db.customBar.upsert({
        where: { id: 'validation-market-identity' },
        update: {
            title,
            description: 'Verification ritual for the Market Identity overhaul.',
            reward: 1,
            twineStoryId: story.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: 'validation-market-identity',
            title,
            description: 'Verification ritual for the Market Identity overhaul.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: story.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Market Validation Story seeded: ${story.title}`)
    console.log(`✅ Market Validation Quest seeded: ${quest.title}`)
}

seed().catch(console.error)
