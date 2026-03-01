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
    'cert-existing-players-character-v1'
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
    console.log('✅ CYOA Certification Quests seeded.')
}

seed().catch(console.error)
