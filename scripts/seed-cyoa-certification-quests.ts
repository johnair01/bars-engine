import './require-db-env'
import { db } from '../src/lib/db'

const CERT_QUEST_IDS = [
    'cert-cyoa-onboarding-v1',
    'cert-cyoa-editing-v1',
    'cert-allyship-domains-v1',
    'cert-domain-intentions-v1',
    'cert-event-campaign-editor-v1',
    'cert-lore-cyoa-onboarding-v1',
    'cert-avatar-from-cyoa-v1',
    'cert-two-minute-ride-v1',
    'cert-k-space-librarian-v1',
    'cert-composable-sprite-v1',
    'cert-existing-players-character-v1',
    'cert-book-to-quest-library-v1',
    'cert-book-quest-twine-export-v1',
    'cert-admin-manual-avatar-v1',
    'cert-admin-mobile-readiness-v1',
    'cert-go-live-v1',
    'cert-market-redesign-v1'
]

async function seed() {
    console.log('--- Seeding CYOA Certification Quests ---')

    // Reset completion for certification quests so admins can complete them again after reseed
    const deletedQuests = await db.playerQuest.deleteMany({ where: { questId: { in: CERT_QUEST_IDS } } })
    const deletedRuns = await db.twineRun.deleteMany({ where: { questId: { in: CERT_QUEST_IDS } } })
    if (deletedQuests.count > 0 || deletedRuns.count > 0) {
        console.log(`🔄 Reset ${deletedQuests.count} PlayerQuest(s) and ${deletedRuns.count} TwineRun(s) for certification quests`)
    }

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

    // --- Certification: Event Page Campaign Editor (AA) ---
    const editorTitle = 'Certification: Event Page Campaign Editor V1'
    const editorSlug = 'cert-event-campaign-editor-v1'

    const editorPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the event page campaign editor. Prepare the Bruised Banana Fundraiser invitation by confirming you can edit Wake Up and Show Up copy directly from the event page.',
            cleanText: 'This certification quest verifies the event page campaign editor. Prepare the Bruised Banana Fundraiser invitation by confirming you can edit Wake Up and Show Up copy directly from the event page.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open the event page\n\nLog in as admin. [Open /event](/event) in a new tab. Confirm you see the Bruised Banana (or active instance) event page.',
            cleanText: '### Step 1: Open the event page\n\nLog in as admin. [Open /event](/event) in a new tab. Confirm you see the Bruised Banana (or active instance) event page.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Click Edit campaign\n\nFind the **Edit campaign** button (top right). Click it to open the edit modal.',
            cleanText: '### Step 2: Click Edit campaign\n\nFind the **Edit campaign** button (top right). Click it to open the edit modal.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Update Wake Up content\n\nIn the modal, add a small edit to the Wake Up content (e.g. append " — verified" or paste from ChatGPT). Click **Save**.',
            cleanText: '### Step 3: Update Wake Up content\n\nIn the modal, add a small edit to the Wake Up content (e.g. append " — verified" or paste from ChatGPT). Click **Save**.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Confirm the change\n\nRefresh the page or close the modal. Confirm the Wake Up section shows your updated text.',
            cleanText: '### Step 4: Confirm the change\n\nRefresh the page or close the modal. Confirm the Wake Up section shows your updated text.',
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
            text: 'Verification complete. You have confirmed the event page campaign editor. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete. You have confirmed the event page campaign editor. Complete this quest to receive your vibeulon reward.',
            links: []
        }
    ]

    const editorParsedJson = JSON.stringify({
        title: editorTitle,
        startPassage: 'START',
        passages: editorPassages
    })

    const editorStory = await db.twineStory.upsert({
        where: { slug: editorSlug },
        update: {
            title: editorTitle,
            parsedJson: editorParsedJson,
            isPublished: true
        },
        create: {
            title: editorTitle,
            slug: editorSlug,
            sourceType: 'manual_seed',
            sourceText: 'Event page campaign editor certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: editorParsedJson,
            isPublished: true,
            createdById
        }
    })

    const editorQuest = await db.customBar.upsert({
        where: { id: editorSlug },
        update: {
            title: editorTitle,
            description: 'Step-by-step verification of the event page campaign editor: Edit button, modal, update Wake Up, confirm change. Prepares the Bruised Banana Fundraiser invitation.',
            reward: 1,
            twineStoryId: editorStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: editorSlug,
            title: editorTitle,
            description: 'Step-by-step verification of the event page campaign editor: Edit button, modal, update Wake Up, confirm change. Prepares the Bruised Banana Fundraiser invitation.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: editorStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${editorStory.title} (${editorStory.id})`)
    console.log(`✅ Quest seeded: ${editorQuest.title} (${editorQuest.id})`)

    // --- Certification: Lore Index + Event-Driven CYOA Onboarding (AG) ---
    const loreTitle = 'Certification: Lore CYOA Onboarding V1'
    const loreSlug = 'cert-lore-cyoa-onboarding-v1'

    const lorePassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the full Lore Index + CYOA onboarding flow: wiki, event page, Bruised Banana CYOA, and character creation.',
            cleanText: 'This certification quest verifies the full Lore Index + CYOA onboarding flow.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Visit the wiki\n\n[Open /wiki](/wiki) in a new tab. Confirm the index shows links to Bruised Banana campaign, moves, domains, and glossary.',
            cleanText: '### Step 1: Visit the wiki\n\nOpen /wiki and confirm the index.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Event page\n\n[Open /event](/event) in a new tab. Confirm the Wake Up section has a **Learn more** link to the wiki.',
            cleanText: '### Step 2: Event page\n\nOpen /event and confirm the Learn more link.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Play through BB CYOA\n\n[Open /campaign?ref=bruised-banana](/campaign?ref=bruised-banana) in a new tab. Play through the Bruised Banana flow: intro, show up, developmental lens (Understanding/Connecting/Acting), choose nation (read about each), playbook (read about each), domain, four moves. Confirm you reach the sign-up node.',
            cleanText: '### Step 3: Play through BB CYOA\n\nOpen /campaign?ref=bruised-banana and play through to sign-up.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Character creation\n\nAfter signing up (or if already signed up), confirm your nation, playbook, and campaign path were applied from the CYOA choices.',
            cleanText: '### Step 4: Character creation\n\nConfirm nation, playbook, and campaign path from CYOA.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '7',
            text: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '6',
            text: 'Verification complete. You have confirmed the Lore Index + CYOA onboarding flow. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete. Complete this quest to receive your reward.',
            links: []
        }
    ]

    const loreParsedJson = JSON.stringify({
        title: loreTitle,
        startPassage: 'START',
        passages: lorePassages
    })

    const loreStory = await db.twineStory.upsert({
        where: { slug: loreSlug },
        update: {
            title: loreTitle,
            parsedJson: loreParsedJson,
            isPublished: true
        },
        create: {
            title: loreTitle,
            slug: loreSlug,
            sourceType: 'manual_seed',
            sourceText: 'Lore CYOA onboarding certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: loreParsedJson,
            isPublished: true,
            createdById
        }
    })

    const loreQuest = await db.customBar.upsert({
        where: { id: loreSlug },
        update: {
            title: loreTitle,
            description: 'Step-by-step verification of Lore Index + CYOA onboarding: wiki, event page Learn more link, Bruised Banana flow, character creation.',
            reward: 1,
            twineStoryId: loreStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: loreSlug,
            title: loreTitle,
            description: 'Step-by-step verification of Lore Index + CYOA onboarding: wiki, event page Learn more link, Bruised Banana flow, character creation.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: loreStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${loreStory.title} (${loreStory.id})`)
    console.log(`✅ Quest seeded: ${loreQuest.title} (${loreQuest.id})`)

    // --- Certification: 2D Sprite Avatar from CYOA Choices (AD) ---
    const avatarTitle = 'Certification: Avatar from CYOA V1'
    const avatarSlug = 'cert-avatar-from-cyoa-v1'

    const avatarPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies that your CYOA choices (nation, playbook, domain) generate a visual avatar on the dashboard. Prepares the Bruised Banana Fundraiser party.',
            cleanText: 'Verify avatar derivation from CYOA choices.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Play BB CYOA\n\n[Open /campaign?ref=bruised-banana](/campaign?ref=bruised-banana) in a new tab. Choose nation, playbook, and domain. Reach the sign-up node.',
            cleanText: '### Step 1: Play BB CYOA\n\nChoose nation, playbook, domain.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Sign up\n\nCreate your account from the CYOA sign-up node (or use an existing account that completed the CYOA flow).',
            cleanText: '### Step 2: Sign up\n\nCreate account from CYOA.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Confirm avatar\n\n[Open dashboard](/). Confirm your avatar (colored circle with initials) appears next to your name in the header. The avatar is derived from your nation and playbook choices.',
            cleanText: '### Step 3: Confirm avatar\n\nAvatar appears next to name in dashboard header.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
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
            text: 'Verification complete. Your avatar is derived from CYOA choices and displayed on the dashboard. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const avatarParsedJson = JSON.stringify({
        title: avatarTitle,
        startPassage: 'START',
        passages: avatarPassages
    })

    const avatarStory = await db.twineStory.upsert({
        where: { slug: avatarSlug },
        update: {
            title: avatarTitle,
            parsedJson: avatarParsedJson,
            isPublished: true
        },
        create: {
            title: avatarTitle,
            slug: avatarSlug,
            sourceType: 'manual_seed',
            sourceText: 'Avatar from CYOA certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: avatarParsedJson,
            isPublished: true,
            createdById
        }
    })

    const avatarQuest = await db.customBar.upsert({
        where: { id: avatarSlug },
        update: {
            title: avatarTitle,
            description: 'Verify avatar derivation from CYOA choices: play BB flow, sign up, confirm avatar in dashboard.',
            reward: 1,
            twineStoryId: avatarStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: avatarSlug,
            title: avatarTitle,
            description: 'Verify avatar derivation from CYOA choices: play BB flow, sign up, confirm avatar in dashboard.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: avatarStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${avatarStory.title} (${avatarStory.id})`)
    console.log(`✅ Quest seeded: ${avatarQuest.title} (${avatarQuest.id})`)

    // --- Certification: 2-Minute Ride Story Bridge + UX (AH) ---
    const rideTitle = 'Certification: 2-Minute Ride V1'
    const rideSlug = 'cert-two-minute-ride-v1'

    const ridePassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the full 2-minute ride: story bridge copy, Dashboard → BB flow, progress indicator, vibeulon preview, donation link, and error recovery.',
            cleanText: 'Verify 2-minute ride flow.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Story bridge copy + Continue flow\n\n[Open /event](/event) in a new tab. If you\'re an admin, click Edit campaign and add story bridge copy (game↔real world). [Open /campaign?ref=bruised-banana](/campaign?ref=bruised-banana). Confirm BB_Intro or BB_ShowUp shows the connection (Conclave = residency, heist = fundraiser). When content is long, confirm one **Continue** button advances through the content and then the story (no separate Prev/Next slide controls).',
            cleanText: '### Step 1: Story bridge + Continue flow\n\nConfirm story bridge and one Continue advances story.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Dashboard → BB flow\n\n[Open dashboard](/) (logged in). Click "Begin the Journey". Confirm you land on the Bruised Banana flow (BB_Intro), not Center_Witness.',
            cleanText: '### Step 2: Dashboard → BB flow\n\nBegin the Journey shows BB flow.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Progress indicator\n\n[Open /campaign](/campaign) in a new tab. Play through a few steps. Confirm "Step X of 11" appears in the top-right.',
            cleanText: '### Step 3: Progress indicator\n\nStep X of 11 visible.',
            links: [{ label: 'Next', target: 'STEP_3a' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3a',
            pid: '4a',
            text: '### Step 3a: Developmental lens + Nation/archetype info\n\n[Open /campaign?ref=bruised-banana](/campaign?ref=bruised-banana). After ShowUp, confirm the **developmental lens** (Understanding / Connecting / Acting) appears before nation selection. At nation and archetype selection, confirm you can **read about** each nation and archetype before choosing (Read about [Name] → info view → Choose or Back).',
            cleanText: '### Step 3a: Developmental lens + Nation/archetype info\n\nConfirm developmental lens before nation; read about nations/archetypes before choosing.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Vibeulon preview\n\nReach the BB_Moves_ShowUp node (last step before sign-up). Confirm copy mentions earning starter vibeulons.',
            cleanText: '### Step 4: Vibeulon preview\n\nVibeulon payoff visible before sign-up.',
            links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_5',
            pid: '6',
            text: '### Step 5: Donation link\n\nWhen instance has donate URLs configured, BB_ShowUp should include a link to /event/donate. (If no donate URLs, skip this step.)',
            cleanText: '### Step 5: Donation link\n\nDonate link when configured.',
            links: [{ label: 'Next', target: 'STEP_6' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_6',
            pid: '7',
            text: '### Step 6: Error recovery\n\nIf the CYOA fetch ever fails, confirm Retry and "Continue later" buttons appear. (You may need to simulate by blocking network.)',
            cleanText: '### Step 6: Error recovery\n\nRetry + Continue later on fetch failure.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '9',
            text: '### Report an Issue\n\nSomething isn\'t working? Describe what you encountered.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '8',
            text: 'Verification complete. You have confirmed the 2-minute ride flow. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const rideParsedJson = JSON.stringify({
        title: rideTitle,
        startPassage: 'START',
        passages: ridePassages
    })

    const rideStory = await db.twineStory.upsert({
        where: { slug: rideSlug },
        update: {
            title: rideTitle,
            parsedJson: rideParsedJson,
            isPublished: true
        },
        create: {
            title: rideTitle,
            slug: rideSlug,
            sourceType: 'manual_seed',
            sourceText: '2-Minute Ride certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: rideParsedJson,
            isPublished: true,
            createdById
        }
    })

    const rideQuest = await db.customBar.upsert({
        where: { id: rideSlug },
        update: {
            title: rideTitle,
            description: 'Verify story bridge, Dashboard→BB flow, progress indicator, vibeulon preview, donation link, error recovery.',
            reward: 1,
            twineStoryId: rideStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: rideSlug,
            title: rideTitle,
            description: 'Verify story bridge, Dashboard→BB flow, progress indicator, vibeulon preview, donation link, error recovery.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: rideStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${rideStory.title} (${rideStory.id})`)
    console.log(`✅ Quest seeded: ${rideQuest.title} (${rideQuest.id})`)

    // --- Certification: K-Space Librarian (AI) ---
    const librarianTitle = 'Certification: K-Space Librarian V1'
    const librarianSlug = 'cert-k-space-librarian-v1'

    const librarianPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the K-Space Librarian flow: Request from Library, admin Library and Docs pages.',
            cleanText: 'Verify K-Space Librarian flow.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Request from Library\n\n[Open dashboard](/). Click **Request from Library**. Submit a test request (e.g. "How do I earn vibeulons?"). Confirm you receive either a link to a doc or a spawned DocQuest.',
            cleanText: '### Step 1: Request from Library\n\nSubmit a test request via Request from Library.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Admin Library\n\n[Open /admin/library](/admin/library) (admin only). Confirm Library Requests are listed with status (new, resolved, spawned).',
            cleanText: '### Step 2: Admin Library\n\nConfirm /admin/library lists requests.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Admin Docs\n\n[Open /admin/docs](/admin/docs) (admin only). Confirm Doc Nodes are listed. Validated nodes show Promote button.',
            cleanText: '### Step 3: Admin Docs\n\nConfirm /admin/docs lists doc nodes.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
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
            text: 'Verification complete. You have confirmed the K-Space Librarian flow. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const librarianParsedJson = JSON.stringify({
        title: librarianTitle,
        startPassage: 'START',
        passages: librarianPassages
    })

    const librarianStory = await db.twineStory.upsert({
        where: { slug: librarianSlug },
        update: {
            title: librarianTitle,
            parsedJson: librarianParsedJson,
            isPublished: true
        },
        create: {
            title: librarianTitle,
            slug: librarianSlug,
            sourceType: 'manual_seed',
            sourceText: 'K-Space Librarian certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: librarianParsedJson,
            isPublished: true,
            createdById
        }
    })

    const librarianQuest = await db.customBar.upsert({
        where: { id: librarianSlug },
        update: {
            title: librarianTitle,
            description: 'Verify Request from Library, admin Library, admin Docs.',
            reward: 1,
            twineStoryId: librarianStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: librarianSlug,
            title: librarianTitle,
            description: 'Verify Request from Library, admin Library, admin Docs.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: librarianStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${librarianStory.title} (${librarianStory.id})`)
    console.log(`✅ Quest seeded: ${librarianQuest.title} (${librarianQuest.id})`)

    // --- Certification: Composable Sprite Avatar (AT) ---
    const composableSlug = 'cert-composable-sprite-v1'
    const composableTitle = 'Certification: Composable Sprite Avatar V1'

    const composablePassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the JRPG composable sprite avatar: build-a-bear during Bruised Banana flow, layered rendering on dashboard.',
            cleanText: 'Verify composable sprite avatar flow.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Play BB CYOA\n\n[Open /campaign?ref=bruised-banana](/campaign?ref=bruised-banana) in a new tab. Confirm the **"Your character"** avatar preview appears and updates as you choose nation, playbook, and domain.',
            cleanText: '### Step 1: Play BB CYOA\n\nConfirm avatar preview builds step-by-step during BB flow.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Sign up\n\nComplete the BB flow to sign-up (or use an existing account).',
            cleanText: '### Step 2: Sign up\n\nComplete sign-up from BB flow.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Dashboard avatar\n\n[Open dashboard](/). Confirm your avatar appears in the header (colored circle with initials, or layered sprites when assets exist). Avatar is derived from nation and playbook choices.',
            cleanText: '### Step 3: Dashboard avatar\n\nConfirm avatar in dashboard header.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
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
            text: 'Verification complete. You have confirmed the composable sprite avatar flow. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const composableParsedJson = JSON.stringify({
        title: composableTitle,
        startPassage: 'START',
        passages: composablePassages
    })

    const composableStory = await db.twineStory.upsert({
        where: { slug: composableSlug },
        update: {
            title: composableTitle,
            parsedJson: composableParsedJson,
            isPublished: true
        },
        create: {
            title: composableTitle,
            slug: composableSlug,
            sourceType: 'manual_seed',
            sourceText: 'Composable sprite avatar certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: composableParsedJson,
            isPublished: true,
            createdById
        }
    })

    const composableQuest = await db.customBar.upsert({
        where: { id: composableSlug },
        update: {
            title: composableTitle,
            description: 'Verify avatar preview during BB flow, sign-up, and dashboard avatar.',
            reward: 1,
            twineStoryId: composableStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: composableSlug,
            title: composableTitle,
            description: 'Verify avatar preview during BB flow, sign-up, and dashboard avatar.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: composableStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${composableStory.title} (${composableStory.id})`)
    console.log(`✅ Quest seeded: ${composableQuest.title} (${composableQuest.id})`)

    // --- Certification: Existing Players Character Generation (AV) ---
    const existingCharTitle = 'Certification: Existing Players Character V1'
    const existingCharSlug = 'cert-existing-players-character-v1'

    const existingCharPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies that existing players with nation and archetype can generate their avatar via the "Build Your Character" orientation quest.',
            cleanText: 'Verify existing players can generate avatar from nation/archetype.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Prepare test player\n\nUse an existing player with nationId and playbookId set but avatarConfig = null. (Admin: clear avatarConfig if needed, or use a player who completed onboarding before avatarConfig was added.)',
            cleanText: '### Step 1: Prepare test player\n\nPlayer has nationId, playbookId, no avatarConfig.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Visit dashboard\n\n[Open dashboard](/). Confirm the "Build Your Character" orientation thread appears (if you have no other active orientation thread).',
            cleanText: '### Step 2: Visit dashboard\n\nBuild Your Character thread visible.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Complete Build Your Character\n\nStart the thread and complete the quest (Confirm your character).',
            cleanText: '### Step 3: Complete Build Your Character\n\nComplete the quest.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Confirm avatar\n\n[Open dashboard](/). Confirm your avatar appears next to your name in the header. The avatar is derived from your nation and playbook.',
            cleanText: '### Step 4: Confirm avatar\n\nAvatar appears in dashboard header.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '7',
            text: '### Report an Issue\n\nSomething isn\'t working? Describe what you encountered.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '6',
            text: 'Verification complete. Existing players can generate their avatar via the Build Your Character orientation quest. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const existingCharParsedJson = JSON.stringify({
        title: existingCharTitle,
        startPassage: 'START',
        passages: existingCharPassages
    })

    const existingCharStory = await db.twineStory.upsert({
        where: { slug: existingCharSlug },
        update: {
            title: existingCharTitle,
            parsedJson: existingCharParsedJson,
            isPublished: true
        },
        create: {
            title: existingCharTitle,
            slug: existingCharSlug,
            sourceType: 'manual_seed',
            sourceText: 'Existing players character generation certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: existingCharParsedJson,
            isPublished: true,
            createdById
        }
    })

    const existingCharQuest = await db.customBar.upsert({
        where: { id: existingCharSlug },
        update: {
            title: existingCharTitle,
            description: 'Verify existing players with nation/archetype can generate avatar via Build Your Character orientation quest.',
            reward: 1,
            twineStoryId: existingCharStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: existingCharSlug,
            title: existingCharTitle,
            description: 'Verify existing players with nation/archetype can generate avatar via Build Your Character orientation quest.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: existingCharStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${existingCharStory.title} (${existingCharStory.id})`)
    console.log(`✅ Quest seeded: ${existingCharQuest.title} (${existingCharQuest.id})`)

    // --- Certification: Book-to-Quest Library Phase 2 (AZ) ---
    const bookLibTitle = 'Certification: Book-to-Quest Library V1'
    const bookLibSlug = 'cert-book-to-quest-library-v1'

    const bookLibPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the Book-to-Quest Library Phase 2 flow: upload PDF, extract text, trigger AI analysis, and confirm quests are created.',
            cleanText: 'Verify Book-to-Quest Library: upload, extract, analyze.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open Books admin\n\n[Open /admin/books](/admin/books) (admin only). Confirm the Books page shows the upload form and book list.',
            cleanText: '### Step 1: Open Books admin\n\nConfirm /admin/books loads.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Upload PDF\n\nUpload a text-based PDF (e.g. a short personal development article or chapter). Use any PDF you have—the content will be extracted for analysis. Confirm the book appears in the list with status **draft**.',
            cleanText: '### Step 2: Upload PDF\n\nUpload a PDF; confirm book appears with status draft.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Extract text\n\nClick **Extract Text** on the book. Wait for extraction to complete. Confirm the book status changes to **extracted** and page/word count appears.',
            cleanText: '### Step 3: Extract text\n\nClick Extract Text; confirm status = extracted.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Trigger analysis\n\nClick **Trigger Analysis** on the book. Wait for AI analysis to complete (may take 30–60 seconds for longer books). Confirm the book status changes to **analyzed** and quest count appears (e.g. "12 quests").',
            cleanText: '### Step 4: Trigger analysis\n\nClick Trigger Analysis; confirm status = analyzed, quest count shown.',
            links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_5',
            pid: '6',
            text: '### Step 5: Verify quests created\n\n[Open /admin/quests](/admin/quests) or the Market. Confirm quests from the book appear—they should have moveType (Wake Up, Clean Up, Grow Up, Show Up) and optionally allyship domain. At least one quest should be visible.',
            cleanText: '### Step 5: Verify quests created\n\nConfirm book-derived quests appear in admin or Market.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '8',
            text: '### Report an Issue\n\nSomething isn\'t working? Describe what you encountered.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '7',
            text: 'Verification complete. You have confirmed the Book-to-Quest Library Phase 2 flow. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const bookLibParsedJson = JSON.stringify({
        title: bookLibTitle,
        startPassage: 'START',
        passages: bookLibPassages
    })

    const bookLibStory = await db.twineStory.upsert({
        where: { slug: bookLibSlug },
        update: {
            title: bookLibTitle,
            parsedJson: bookLibParsedJson,
            isPublished: true
        },
        create: {
            title: bookLibTitle,
            slug: bookLibSlug,
            sourceType: 'manual_seed',
            sourceText: 'Book-to-Quest Library certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: bookLibParsedJson,
            isPublished: true,
            createdById
        }
    })

    const bookLibQuest = await db.customBar.upsert({
        where: { id: bookLibSlug },
        update: {
            title: bookLibTitle,
            description: 'Verify Book-to-Quest Library: upload PDF, extract text, trigger analysis, confirm quests created.',
            reward: 1,
            twineStoryId: bookLibStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: bookLibSlug,
            title: bookLibTitle,
            description: 'Verify Book-to-Quest Library: upload PDF, extract text, trigger analysis, confirm quests created.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: bookLibStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${bookLibStory.title} (${bookLibStory.id})`)
    console.log(`✅ Quest seeded: ${bookLibQuest.title} (${bookLibQuest.id})`)

    // --- Certification: Book Quest Twine Export (BP) ---
    const twineExportTitle = 'Certification: Book Quest Twine Export V1'
    const twineExportSlug = 'cert-book-quest-twine-export-v1'

    const twineExportPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the Book Quest Twine Export flow. Prepare the Quest Library for Twine adventures by confirming you can export book quests as JSON for adventure building.',
            cleanText: 'Verify Book Quest Twine Export: export quests as JSON for Twine adventures.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open Books admin\n\n[Open /admin/books](/admin/books) (admin only). Confirm the Books page loads. You need a book with status **analyzed** or **published** (from cert-book-to-quest-library-v1 or a previous run).',
            cleanText: '### Step 1: Open Books admin\n\nConfirm /admin/books loads; have a book with analyzed/published status.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Review quests\n\nClick **Review quests** on a book that has quests. Open the quest review page at `/admin/books/[id]/quests`. If the book has no approved quests, approve at least one draft first.',
            cleanText: '### Step 2: Review quests\n\nClick Review quests; approve at least one quest if needed.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Export for Twine\n\nConfirm the **Export for Twine** button is visible (it appears when the book has at least one approved quest). Click it. A JSON file should download (e.g. `{book-slug}-quests.json`).',
            cleanText: '### Step 3: Export for Twine\n\nClick Export for Twine; confirm JSON file downloads.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Verify export structure\n\nOpen the downloaded JSON file. Confirm it has a `book` object (id, title, author) and a `quests` array. Each quest should have id, title, description, moveType, allyshipDomain, gameMasterFace, reward, and position. This metadata enables Twine adventure stringing for the Bruised Banana party.',
            cleanText: '### Step 4: Verify export structure\n\nConfirm JSON has book + quests with full metadata.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '7',
            text: '### Report an Issue\n\nSomething isn\'t working? Describe what you encountered.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '6',
            text: 'Verification complete. You have confirmed the Book Quest Twine Export flow. Content authors can now export quest metadata to build Twine adventures from the Quest Library. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const twineExportParsedJson = JSON.stringify({
        title: twineExportTitle,
        startPassage: 'START',
        passages: twineExportPassages
    })

    const twineExportStory = await db.twineStory.upsert({
        where: { slug: twineExportSlug },
        update: {
            title: twineExportTitle,
            parsedJson: twineExportParsedJson,
            isPublished: true
        },
        create: {
            title: twineExportTitle,
            slug: twineExportSlug,
            sourceType: 'manual_seed',
            sourceText: 'Book Quest Twine Export certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: twineExportParsedJson,
            isPublished: true,
            createdById
        }
    })

    const twineExportQuest = await db.customBar.upsert({
        where: { id: twineExportSlug },
        update: {
            title: twineExportTitle,
            description: 'Verify Book Quest Twine Export: review quests, click Export for Twine, confirm JSON downloads with book + quests metadata.',
            reward: 1,
            twineStoryId: twineExportStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: twineExportSlug,
            title: twineExportTitle,
            description: 'Verify Book Quest Twine Export: review quests, click Export for Twine, confirm JSON downloads with book + quests metadata.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: twineExportStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${twineExportStory.title} (${twineExportStory.id})`)
    console.log(`✅ Quest seeded: ${twineExportQuest.title} (${twineExportQuest.id})`)

    // --- Certification: Admin Manual Avatar Assignment ---
    const adminAvatarTitle = 'Certification: Admin Manual Avatar Assignment V1'
    const adminAvatarSlug = 'cert-admin-manual-avatar-v1'

    const adminAvatarPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the admin manual avatar assignment flow. Admins can assign avatars to players for testing sprite stacking without going through the character-generation quest.',
            cleanText: 'Verify admin manual avatar assignment for sprite testing.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open Avatar Gallery\n\n[Open /admin/avatars](/admin/avatars) (admin only). Confirm the Avatar Gallery page loads with the "Assign Avatar" form and player grid.',
            cleanText: '### Step 1: Open Avatar Gallery\n\nConfirm /admin/avatars loads with Assign Avatar form.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Assign avatar to a player\n\nUse the Assign Avatar form: select a player, a nation, and an archetype (playbook). Optionally select a base variant (default, male, female, neutral). Click **Assign Avatar**. Confirm you see a success message.',
            cleanText: '### Step 2: Assign avatar\n\nUse form: player, nation, archetype; click Assign Avatar.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Verify avatar in grid\n\nConfirm the assigned player\'s avatar appears in the grid below the form. The composed sprite (base + nation + playbook layers) should be visible. This verifies sprite stacking works for the party.',
            cleanText: '### Step 3: Verify avatar in grid\n\nConfirm avatar appears in grid.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
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
            text: 'Verification complete. You have confirmed the admin manual avatar assignment flow. Admins can now test sprite stacking for the Bruised Banana party. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const adminAvatarParsedJson = JSON.stringify({
        title: adminAvatarTitle,
        startPassage: 'START',
        passages: adminAvatarPassages
    })

    const adminAvatarStory = await db.twineStory.upsert({
        where: { slug: adminAvatarSlug },
        update: {
            title: adminAvatarTitle,
            parsedJson: adminAvatarParsedJson,
            isPublished: true
        },
        create: {
            title: adminAvatarTitle,
            slug: adminAvatarSlug,
            sourceType: 'manual_seed',
            sourceText: 'Admin manual avatar assignment certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: adminAvatarParsedJson,
            isPublished: true,
            createdById
        }
    })

    const adminAvatarQuest = await db.customBar.upsert({
        where: { id: adminAvatarSlug },
        update: {
            title: adminAvatarTitle,
            description: 'Verify admin manual avatar assignment: assign avatar to player, confirm sprite appears in Avatar Gallery.',
            reward: 1,
            twineStoryId: adminAvatarStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: adminAvatarSlug,
            title: adminAvatarTitle,
            description: 'Verify admin manual avatar assignment: assign avatar to player, confirm sprite appears in Avatar Gallery.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: adminAvatarStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${adminAvatarStory.title} (${adminAvatarStory.id})`)
    console.log(`✅ Quest seeded: ${adminAvatarQuest.title} (${adminAvatarQuest.id})`)

    // --- Certification: Admin Mobile Readiness (BR) ---
    const mobileTitle = 'Certification: Admin Mobile Readiness V1'
    const mobileSlug = 'cert-admin-mobile-readiness-v1'

    const mobilePassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the admin console works on mobile. The residency team will manage the Bruised Banana Fundraiser from anywhere—confirm you can edit instances, update progress, and mint vibeulons without terminal access.',
            cleanText: 'This certification quest verifies the admin console works on mobile.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Edit instance with prefill\n\nLog in as admin. [Open Admin → Instances](/admin/instances). Click **Edit** on an instance. Confirm the form opens with all fields pre-filled. Save (or cancel).',
            cleanText: '### Step 1: Edit instance with prefill\n\nLog in as admin. Open Admin → Instances. Click Edit on an instance. Confirm the form opens with all fields pre-filled.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Update donation progress\n\n[Open /event](/event). Find the **Update progress** button near the fundraiser progress bar. Click it, change the current amount, and save. Confirm the progress bar updates.',
            cleanText: '### Step 2: Update donation progress\n\nOpen /event. Find Update progress near the progress bar. Change current amount and save.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Mint via inline input\n\n[Open Admin → Players](/admin/players). Click a player to open the editor. In the Vibeulon Economy section, use the **amount input** and **Mint** button (no prompt dialog). Mint 1 vibeulon and confirm the balance updates.',
            cleanText: '### Step 3: Mint via inline input\n\nOpen Admin → Players. Open a player. Use the amount input and Mint button (no prompt). Mint 1 vibeulon.',
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
            text: 'Verification complete. You have confirmed the admin console works on mobile. The residency team can manage the Bruised Banana Fundraiser from anywhere. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const mobileParsedJson = JSON.stringify({
        title: mobileTitle,
        startPassage: 'START',
        passages: mobilePassages
    })

    const mobileStory = await db.twineStory.upsert({
        where: { slug: mobileSlug },
        update: {
            title: mobileTitle,
            parsedJson: mobileParsedJson,
            isPublished: true
        },
        create: {
            title: mobileTitle,
            slug: mobileSlug,
            sourceType: 'manual_seed',
            sourceText: 'Admin mobile readiness certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: mobileParsedJson,
            isPublished: true,
            createdById
        }
    })

    const mobileQuest = await db.customBar.upsert({
        where: { id: mobileSlug },
        update: {
            title: mobileTitle,
            description: 'Verify admin mobile readiness: edit instance (prefill), update progress, mint via inline input.',
            reward: 1,
            twineStoryId: mobileStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: mobileSlug,
            title: mobileTitle,
            description: 'Verify admin mobile readiness: edit instance (prefill), update progress, mint via inline input.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: mobileStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${mobileStory.title} (${mobileStory.id})`)
    console.log(`✅ Quest seeded: ${mobileQuest.title} (${mobileQuest.id})`)

    // --- Certification: Go-Live Integration (BS) ---
    const goLiveTitle = 'Certification: Go-Live V1'
    const goLiveSlug = 'cert-go-live-v1'

    const goLivePassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the go-live checklist. Prepare the Bruised Banana Fundraiser for launch by confirming the core loop works before sending invitations.',
            cleanText: 'This certification quest verifies the go-live checklist.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Run loop readiness\n\nIn your terminal, run `npm run loop:ready` (or `npm run loop:ready:quick` to skip build). Confirm all checks pass. See docs/LOOP_READINESS_CHECKLIST.md in the repo for details.',
            cleanText: '### Step 1: Run loop readiness\n\nRun npm run loop:ready. Confirm all checks pass.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Sign in as admin\n\n[Open the app](/). Sign in with an admin account. Confirm you reach the dashboard.',
            cleanText: '### Step 2: Sign in as admin\n\nSign in. Confirm you reach the dashboard.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Complete a quest and confirm mint\n\n[Open Market](/bars/available) or [Adventures](/adventures). Pick up and complete a quest. Confirm vibeulons mint on completion.',
            cleanText: '### Step 3: Complete a quest\n\nComplete a quest. Confirm vibeulons mint.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Confirm wallet\n\n[Open Wallet](/wallet). Confirm your balance reflects the vibeulons you just earned.',
            cleanText: '### Step 4: Confirm wallet\n\nOpen Wallet. Confirm balance reflects earned vibeulons.',
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
            text: 'Verification complete. The core loop is ready for launch. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const goLiveParsedJson = JSON.stringify({
        title: goLiveTitle,
        startPassage: 'START',
        passages: goLivePassages
    })

    const goLiveStory = await db.twineStory.upsert({
        where: { slug: goLiveSlug },
        update: {
            title: goLiveTitle,
            parsedJson: goLiveParsedJson,
            isPublished: true
        },
        create: {
            title: goLiveTitle,
            slug: goLiveSlug,
            sourceType: 'manual_seed',
            sourceText: 'Go-live certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: goLiveParsedJson,
            isPublished: true,
            createdById
        }
    })

    const goLiveQuest = await db.customBar.upsert({
        where: { id: goLiveSlug },
        update: {
            title: goLiveTitle,
            description: 'Verify go-live checklist: loop:ready, sign in, complete quest, confirm wallet.',
            reward: 1,
            twineStoryId: goLiveStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: goLiveSlug,
            title: goLiveTitle,
            description: 'Verify go-live checklist: loop:ready, sign in, complete quest, confirm wallet.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: goLiveStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${goLiveStory.title} (${goLiveStory.id})`)
    console.log(`✅ Quest seeded: ${goLiveQuest.title} (${goLiveQuest.id})`)

    // --- Certification: Market Redesign for Launch (BT) ---
    const marketRedesignTitle = 'Certification: Market Redesign V1'
    const marketRedesignSlug = 'cert-market-redesign-v1'

    const marketRedesignPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'Verify the Market redesign for the Bruised Banana launch. The Market shows player-created quests; Adventures hold campaign content. Complete each step to validate the redesign.',
            cleanText: 'Verify the Market redesign for the Bruised Banana launch.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open Market\n\n[Open the Market](/bars/available). Confirm you see only player-created quests (no system quests). If no quests exist, confirm the empty state says "No commissions yet. Create one to get started."',
            cleanText: '### Step 1: Open Market\n\nOpen Market. Confirm player-created quests only.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Use filters\n\nUse the search box and filter pills (domain, nation, archetype). Confirm filtering works. Click "Clear all filters" and confirm results return.',
            cleanText: '### Step 2: Use filters\n\nUse search and filters. Confirm Clear all filters works.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Accept a quest\n\nOpen a quest and click "Details & Accept" (or equivalent). Confirm you can pick up a quest from the Market.',
            cleanText: '### Step 3: Accept a quest\n\nAccept a quest from Market.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Check the nav\n\nLook at the navigation bar. Confirm the Play link shows "PLAY" on both mobile and desktop (resize the window if needed).',
            cleanText: '### Step 4: Check the nav\n\nConfirm Play link shows PLAY on all breakpoints.',
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
            text: 'Market redesign verified. Player quests are easy to find and explore. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Market redesign verified.',
            links: []
        }
    ]

    const marketRedesignParsedJson = JSON.stringify({
        title: marketRedesignTitle,
        startPassage: 'START',
        passages: marketRedesignPassages
    })

    const marketRedesignStory = await db.twineStory.upsert({
        where: { slug: marketRedesignSlug },
        update: {
            title: marketRedesignTitle,
            parsedJson: marketRedesignParsedJson,
            isPublished: true
        },
        create: {
            title: marketRedesignTitle,
            slug: marketRedesignSlug,
            sourceType: 'manual_seed',
            sourceText: 'Market redesign certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: marketRedesignParsedJson,
            isPublished: true,
            createdById
        }
    })

    const marketRedesignQuest = await db.customBar.upsert({
        where: { id: marketRedesignSlug },
        update: {
            title: marketRedesignTitle,
            description: 'Verify Market redesign: player-created quests only, filters, empty states, Play on nav.',
            reward: 1,
            twineStoryId: marketRedesignStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        },
        create: {
            id: marketRedesignSlug,
            title: marketRedesignTitle,
            description: 'Verify Market redesign: player-created quests only, filters, empty states, Play on nav.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: marketRedesignStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true
        }
    })

    console.log(`✅ Story seeded: ${marketRedesignStory.title} (${marketRedesignStory.id})`)
    console.log(`✅ Quest seeded: ${marketRedesignQuest.title} (${marketRedesignQuest.id})`)
    console.log('✅ CYOA Certification Quests seeded.')
}

seed().catch(console.error)
