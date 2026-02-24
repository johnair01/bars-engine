import { db } from '../src/lib/db'

async function seed() {
    console.log('--- Seeding Economy Validation Quest ---')

    const creator = await db.player.findFirst()
    if (!creator) throw new Error('No player found for createdById')
    const createdById = creator.id

    const title = 'Validation: Economy Translation V1'
    const slug = 'validation-economy-v1'

    const passages = [
        {
            name: 'START',
            text: 'Welcome, Admin. We have just deployed Phase 1 and 2 of the Economy Translation system.\n\nThis quest will walk you through the structural integrity of the new multi-layer Vibeulon reserves.\n\n[[Begin Verification|STEP_1_ATTUNE]]',
            cleanText: 'Welcome, Admin. We have just deployed Phase 1 and 2 of the Economy Translation system.\n\nThis quest will walk you through the structural integrity of the new multi-layer Vibeulon reserves.',
            links: [{ label: 'Begin Verification', target: 'STEP_1_ATTUNE' }]
        },
        {
            name: 'STEP_1_ATTUNE',
            text: '### Step 1: Attunement\n\nNavigate to the **Dashboard** and look for the "Live Instance" banner. You should see an "Attune 1 ♦" button.\n\nClick it to move a Vibeulon from your Global Reserve to the Instance Liquidity.\n\n[[I have attuned|STEP_2_VERIFY]]',
            cleanText: '### Step 1: Attunement\n\nNavigate to the **Dashboard** and look for the "Live Instance" banner. You should see an "Attune 1 ♦" button.\n\nClick it to move a Vibeulon from your Global Reserve to the Instance Liquidity.',
            links: [{ label: 'I have attuned', target: 'STEP_2_VERIFY' }]
        },
        {
            name: 'STEP_2_VERIFY',
            text: '### Step 2: Verification\n\nNow, navigate to your **Wallet**. Do you see a "Local Liquidity" section showing your attuned balance?\n\nIf yes, the data layer correctly synchronized.\n\n[[Verify Transmutation|STEP_3_TRANSMUTE]]',
            cleanText: '### Step 2: Verification\n\nNow, navigate to your **Wallet**. Do you see a "Local Liquidity" section showing your attuned balance?\n\nIf yes, the data layer correctly synchronized.',
            links: [{ label: 'Verify Transmutation', target: 'STEP_3_TRANSMUTE' }]
        },
        {
            name: 'STEP_3_TRANSMUTE',
            text: '### Step 3: Transmutation (Coming Soon)\n\nTransmutation currently works via the `LedgerService` and is verified by test scripts. UI controls for transmutation are slated for Phase 3.5.\n\n[[Proceed to Battle Report|BATTLE_REPORT]]',
            cleanText: '### Step 3: Transmutation (Coming Soon)\n\nTransmutation currently works via the `LedgerService` and is verified by test scripts. UI controls for transmutation are slated for Phase 3.5.',
            links: [{ label: 'Proceed to Battle Report', target: 'BATTLE_REPORT' }]
        },
        {
            name: 'BATTLE_REPORT',
            text: '### Battle Report\n\nPlease log any findings below. Your feedback is written directly to the repo for the next deployment phase.\n\n[[Complete Quest|END_SUCCESS]]',
            cleanText: '### Battle Report\n\nPlease log any findings below. Your feedback is written directly to the repo for the next deployment phase.',
            links: [{ label: 'Complete Quest', target: 'END_SUCCESS' }]
        },
        {
            name: 'END_SUCCESS',
            text: 'Mission accomplished. Your report has been noted and your reward is being minted.',
            cleanText: 'Mission accomplished. Your report has been noted and your reward is being minted.',
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
            sourceText: 'Implicitly defined in seed script',
            parsedJson,
            isPublished: true,
            createdById
        }
    })

    // Create/Update the Quest (CustomBar)
    const quest = await db.customBar.upsert({
        where: { id: 'validation-economy-v1' }, // Deterministic ID for system quest
        update: {
            title,
            description: 'Step-by-step verification of the multi-layer Vibeulon economy.',
            reward: 1,
            twineStoryId: story.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: 'validation-economy-v1',
            title,
            description: 'Step-by-step verification of the multi-layer Vibeulon economy.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: story.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${story.title} (${story.id})`)
    console.log(`✅ Quest seeded: ${quest.title} (${quest.id})`)

    // 4. Admin Certification Quest
    const certStory = await db.twineStory.findFirst({
        where: { title: { contains: 'Blessed Object' } } // Use existing story or fallback
    })

    await db.customBar.upsert({
        where: { id: 'admin-cert-v0-1-0' },
        update: {
            twineStoryId: certStory?.id,
            isSystem: true,
            reward: 1
        },
        create: {
            id: 'admin-cert-v0-1-0',
            creatorId: createdById, // Assuming 'admin' refers to the 'creator' found earlier
            title: 'v0.1.0 Certification Ritual',
            description: 'Verify the stable release of the Vibeulon Ledger, Market Identity, and Graveyard lifecycle.',
            isSystem: true,
            reward: 1,
            visibility: 'public',
            status: 'active',
            twineStoryId: certStory?.id
        }
    })

    console.log('✅ Validation quests seeded.')
}

seed().catch(console.error)
