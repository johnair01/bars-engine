import './require-db-env'
import { db } from '../src/lib/db'

async function seed() {
    console.log('--- Seeding CYOA Certification Quests ---')

    const creator = await db.player.findFirst()
    if (!creator) throw new Error('No player found for createdById')
    const createdById = creator.id

    const title = 'Certification: CYOA Onboarding V1'
    const slug = 'cert-cyoa-onboarding-v1'

    const passages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the CYOA onboarding flow: landing CTA, campaign play-through, sign-up redirect to onboarding, and the first orientation quest.\n\nComplete each step in order, then finish the quest to receive your reward.',
            cleanText: 'This certification quest verifies the CYOA onboarding flow: landing CTA, campaign play-through, sign-up redirect to onboarding, and the first orientation quest.\n\nComplete each step in order, then finish the quest to receive your reward.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Landing CTA\n\n[Open the homepage](/) (logged out). Confirm that the primary CTA is **"Begin the Journey"** and that it links to [the campaign](/campaign).',
            cleanText: '### Step 1: Landing CTA\n\n[Open the homepage](/) (logged out). Confirm that the primary CTA is **"Begin the Journey"** and that it links to [the campaign](/campaign).',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Campaign to sign-up\n\n[Open /campaign](/campaign) in a new tab and play through the story until you reach the **sign-up node** (e.g. "Claim Your Destiny").',
            cleanText: '### Step 2: Campaign to sign-up\n\n[Open /campaign](/campaign) in a new tab and play through the story until you reach the **sign-up node** (e.g. "Claim Your Destiny").',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Redirect after sign-up\n\nAfter signing up, confirm you are redirected to [conclave/onboarding](/conclave/onboarding) (or the first onboarding quest).',
            cleanText: '### Step 3: Redirect after sign-up\n\nAfter signing up, confirm you are redirected to [conclave/onboarding](/conclave/onboarding) (or the first onboarding quest).',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: First quest visible\n\nConfirm the **orientation thread** and **first quest** are visible (e.g. "Enter Ritual" / "Start Journey").',
            cleanText: '### Step 4: First quest visible\n\nConfirm the **orientation thread** and **first quest** are visible (e.g. "Enter Ritual" / "Start Journey").',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '7',
            text: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            cleanText: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '6',
            text: 'Verification complete. You have confirmed the CYOA onboarding flow. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete. You have confirmed the CYOA onboarding flow. Complete this quest to receive your vibeulon reward.',
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
            sourceText: 'CYOA certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson,
            isPublished: true,
            createdById
        }
    })

    const quest = await db.customBar.upsert({
        where: { id: slug },
        update: {
            title,
            description: 'Step-by-step verification of the CYOA onboarding: landing CTA, campaign, sign-up redirect, and first quest.',
            reward: 1,
            twineStoryId: story.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: slug,
            title,
            description: 'Step-by-step verification of the CYOA onboarding: landing CTA, campaign, sign-up redirect, and first quest.',
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

    // --- Certification: In-App CYOA Editing (Prompt K) ---
    const editTitle = 'Certification: In-App CYOA Editing V1'
    const editSlug = 'cert-cyoa-editing-v1'

    const editPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies in-app CYOA editing. Prepare the party narrative for the Bruised Banana Fundraiser by confirming you can edit campaign copy without deploying code.',
            cleanText: 'This certification quest verifies in-app CYOA editing. Prepare the party narrative for the Bruised Banana Fundraiser by confirming you can edit campaign copy without deploying code.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Wake-Up in DB\n\nEnsure the Wake-Up campaign is seeded: run `npm run seed:wake-up` if needed. [Open /campaign](/campaign) in a new tab — it should load from the database.',
            cleanText: '### Step 1: Wake-Up in DB\n\nEnsure the Wake-Up campaign is seeded: run `npm run seed:wake-up` if needed. [Open /campaign](/campaign) in a new tab — it should load from the database.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Edit a passage\n\nLog in as admin. Go to [Admin → Adventures](/admin/adventures) → Wake-Up Campaign. Click **Edit** on any passage (e.g. Center_Witness).',
            cleanText: '### Step 2: Edit a passage\n\nLog in as admin. Go to [Admin → Adventures](/admin/adventures) → Wake-Up Campaign. Click **Edit** on any passage (e.g. Center_Witness).',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Change the text\n\nAdd a small edit to the passage text (e.g. "— verified" at the end). Save the passage.',
            cleanText: '### Step 3: Change the text\n\nAdd a small edit to the passage text (e.g. "— verified" at the end). Save the passage.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Confirm on /campaign\n\n[Open /campaign](/campaign) in an incognito window (or logged out). Confirm your edited text appears. The campaign is now editable in-app for the Bruised Banana Fundraiser.',
            cleanText: '### Step 4: Confirm on /campaign\n\n[Open /campaign](/campaign) in an incognito window (or logged out). Confirm your edited text appears. The campaign is now editable in-app for the Bruised Banana Fundraiser.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '7',
            text: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            cleanText: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '6',
            text: 'Verification complete. You have confirmed in-app CYOA editing. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete. You have confirmed in-app CYOA editing. Complete this quest to receive your vibeulon reward.',
            links: []
        }
    ]

    const editParsedJson = JSON.stringify({
        title: editTitle,
        startPassage: 'START',
        passages: editPassages
    })

    const editStory = await db.twineStory.upsert({
        where: { slug: editSlug },
        update: {
            title: editTitle,
            parsedJson: editParsedJson,
            isPublished: true
        },
        create: {
            title: editTitle,
            slug: editSlug,
            sourceType: 'manual_seed',
            sourceText: 'CYOA editing certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: editParsedJson,
            isPublished: true,
            createdById
        }
    })

    const editQuest = await db.customBar.upsert({
        where: { id: editSlug },
        update: {
            title: editTitle,
            description: 'Step-by-step verification of in-app CYOA editing: edit a passage in Admin, confirm on /campaign. Prepares the party narrative for the Bruised Banana Fundraiser.',
            reward: 1,
            twineStoryId: editStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: editSlug,
            title: editTitle,
            description: 'Step-by-step verification of in-app CYOA editing: edit a passage in Admin, confirm on /campaign. Prepares the party narrative for the Bruised Banana Fundraiser.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: editStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${editStory.title} (${editStory.id})`)
    console.log(`✅ Quest seeded: ${editQuest.title} (${editQuest.id})`)

    // --- Certification: Allyship Domains (Campaign Path) ---
    const domainTitle = 'Certification: Allyship Domains V1'
    const domainSlug = 'cert-allyship-domains-v1'

    const domainPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the campaign path (allyship domain) feature. Choose your domains, confirm the Market filters, and prepare for the Bruised Banana Fundraiser.',
            cleanText: 'This certification quest verifies the campaign path (allyship domain) feature.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open the Market\n\n[Open the Market](/bars/available) in a new tab. Click **"Update campaign path"** to open the domain selector.',
            cleanText: '### Step 1: Open the Market\n\nOpen the Market and click Update campaign path.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Choose domains\n\nSelect one or more allyship domains (e.g. Gathering Resources, Direct Action). Save. The Market should filter to show only quests in your chosen domains.',
            cleanText: '### Step 2: Choose domains\n\nSelect domains and save. Market filters to your choice.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Verify filter\n\nConfirm the quest cards shown match your selected domain(s). Quest cards may show a domain badge. You can change your selection anytime via "Update campaign path".',
            cleanText: '### Step 3: Verify filter\n\nConfirm quests match your domain selection.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '6',
            text: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '5',
            text: 'Verification complete. You have confirmed the campaign path feature. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete. Complete this quest to receive your reward.',
            links: []
        }
    ]

    const domainParsedJson = JSON.stringify({
        title: domainTitle,
        startPassage: 'START',
        passages: domainPassages
    })

    const domainStory = await db.twineStory.upsert({
        where: { slug: domainSlug },
        update: {
            title: domainTitle,
            parsedJson: domainParsedJson,
            isPublished: true
        },
        create: {
            title: domainTitle,
            slug: domainSlug,
            sourceType: 'manual_seed',
            sourceText: 'Allyship domains certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: domainParsedJson,
            isPublished: true,
            createdById
        }
    })

    const domainQuest = await db.customBar.upsert({
        where: { id: domainSlug },
        update: {
            title: domainTitle,
            description: 'Step-by-step verification of campaign path: choose allyship domains, confirm Market filter. Prepares for the Bruised Banana Fundraiser.',
            reward: 1,
            twineStoryId: domainStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: domainSlug,
            title: domainTitle,
            description: 'Step-by-step verification of campaign path: choose allyship domains, confirm Market filter. Prepares for the Bruised Banana Fundraiser.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: domainStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${domainStory.title} (${domainStory.id})`)
    console.log(`✅ Quest seeded: ${domainQuest.title} (${domainQuest.id})`)

    // --- Certification: Domain-Aligned Intentions (Prompt U) ---
    const intentionsTitle = 'Certification: Domain-Aligned Intentions V1'
    const intentionsSlug = 'cert-domain-intentions-v1'

    const intentionsPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies domain-aligned intentions. Clarify your contribution intent for the Bruised Banana Fundraiser by choosing a predefined intention (including "Following my curiosity") and confirming the Update flow.',
            cleanText: 'This certification quest verifies domain-aligned intentions.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open the dashboard\n\n[Open the dashboard](/). Find your intention: it appears in the header if you\'ve completed the first orientation quest. Or go to **Journeys** → Welcome to the Conclave → first quest (Set Your Intention).',
            cleanText: '### Step 1: Open the dashboard\n\nOpen the dashboard and find the intention section or the first orientation quest.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Choose from options\n\nOpen the intention quest (or click **Edit** on your displayed intention). Select the **"Choose from options"** path (third button). You should see predefined intentions including "Following my curiosity."',
            cleanText: '### Step 2: Choose from options\n\nOpen intention quest or Edit. Select "Choose from options" path.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Select an intention\n\nSelect **"Following my curiosity"** (or any domain-aligned option). Complete the quest or click Update. Your intention is now stored.',
            cleanText: '### Step 3: Select an intention\n\nSelect "Following my curiosity" and complete or Update.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Confirm on dashboard\n\n[Open the dashboard](/). Confirm your intention appears in the header. Click **Edit** to verify you can update it anytime. Domain-aligned intentions are ready for the Bruised Banana Fundraiser.',
            cleanText: '### Step 4: Confirm on dashboard\n\nConfirm intention appears; Edit verifies the update flow.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '7',
            text: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            cleanText: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '6',
            text: 'Verification complete. You have confirmed domain-aligned intentions and the Update flow. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete. Complete this quest to receive your reward.',
            links: []
        }
    ]

    const intentionsParsedJson = JSON.stringify({
        title: intentionsTitle,
        startPassage: 'START',
        passages: intentionsPassages
    })

    const intentionsStory = await db.twineStory.upsert({
        where: { slug: intentionsSlug },
        update: {
            title: intentionsTitle,
            parsedJson: intentionsParsedJson,
            isPublished: true
        },
        create: {
            title: intentionsTitle,
            slug: intentionsSlug,
            sourceType: 'manual_seed',
            sourceText: 'Domain-aligned intentions certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: intentionsParsedJson,
            isPublished: true,
            createdById
        }
    })

    const intentionsQuest = await db.customBar.upsert({
        where: { id: intentionsSlug },
        update: {
            title: intentionsTitle,
            description: 'Step-by-step verification of domain-aligned intentions: choose from options (including "Following my curiosity"), confirm on dashboard, verify Edit/Update flow. Prepares for the Bruised Banana Fundraiser.',
            reward: 1,
            twineStoryId: intentionsStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: intentionsSlug,
            title: intentionsTitle,
            description: 'Step-by-step verification of domain-aligned intentions: choose from options (including "Following my curiosity"), confirm on dashboard, verify Edit/Update flow. Prepares for the Bruised Banana Fundraiser.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: intentionsStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${intentionsStory.title} (${intentionsStory.id})`)
    console.log(`✅ Quest seeded: ${intentionsQuest.title} (${intentionsQuest.id})`)
    console.log('✅ CYOA Certification Quests seeded.')
}

seed().catch(console.error)
