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
    console.log('✅ CYOA Certification Quests seeded.')
}

seed().catch(console.error)
