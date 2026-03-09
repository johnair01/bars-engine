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
    'cert-market-redesign-v1',
    'cert-campaign-onboarding-twine-v2-v1',
    'cert-quest-grammar-v1',
    'cert-quest-wizard-templates-v1',
    'cert-gameboard-quest-generation-v1',
    'cert-dashboard-orientation-flow-v1',
    'cert-lore-immersive-onboarding-v1',
    'cert-aid-decline-fork-v1',
    'cert-starter-quest-generator-v1',
    'cert-admin-onboarding-flow-api-v1',
    'cert-onboarding-flow-completion-v1',
    'cert-twine-authoring-ir-v1'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/campaign-onboarding-feature-merge/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/campaign-onboarding-feature-merge/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/cyoa-in-app-editing/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/cyoa-in-app-editing/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/bruised-banana-allyship-domains/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/bruised-banana-allyship-domains/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/domain-aligned-intentions/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/domain-aligned-intentions/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/event-page-campaign-editor/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/event-page-campaign-editor/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/lore-cyoa-onboarding/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/lore-cyoa-onboarding/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/avatar-from-cyoa-choices/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/avatar-from-cyoa-choices/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/two-minute-ride-story-bridge/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/two-minute-ride-story-bridge/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/k-space-librarian/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/k-space-librarian/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/jrpg-composable-sprite-avatar/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/jrpg-composable-sprite-avatar/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/existing-players-character-generation/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/existing-players-character-generation/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/book-to-quest-library/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/book-to-quest-library/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/book-quest-twine-export/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/book-quest-twine-export/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/admin-manual-avatar-assignment/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/admin-manual-avatar-assignment/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/admin-mobile-readiness/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/admin-mobile-readiness/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/go-live-integration/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/go-live-integration/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/market-redesign-launch/spec.md'
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
            isSystem: true,
            backlogPromptPath: '.specify/specs/market-redesign-launch/spec.md'
        }
    })

    console.log(`✅ Story seeded: ${marketRedesignStory.title} (${marketRedesignStory.id})`)
    console.log(`✅ Quest seeded: ${marketRedesignQuest.title} (${marketRedesignQuest.id})`)

    // --- Certification: Campaign Onboarding Twine v2 (BX) ---
    const onboardingV2Title = 'Certification: Campaign Onboarding Twine v2 V1'
    const onboardingV2Slug = 'cert-campaign-onboarding-twine-v2-v1'

    const onboardingV2Passages = [
        {
            name: 'START',
            pid: '1',
            text: 'Prepare the party for the Bruised Banana Fundraiser. Verify the initiation flow: lens selection, signal capture, BAR creation, micro-quest attach, vibeulon mint, Game Master selection, and commitment gate.',
            cleanText: 'Verify Bruised Banana initiation flow.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Initiation flow\n\n[Open /campaign/twine](/campaign/twine) (or /campaign?ref=bruised-banana). Play through: choose a lens (community/creative/strategic/allyship), enter raw signal, refine to one sentence, choose quadrant, then **Publish it** at Claim.',
            cleanText: '### Step 1: Initiation flow\n\nPlay through lens → signal → refine → quadrant → Publish it.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: BAR and micro-quest\n\nConfirm at Structure that the BAR was created and attached to the onboarding micro-quest. At Mint, confirm the vibeulon mint (demo or real) is shown.',
            cleanText: '### Step 2: BAR and micro-quest\n\nConfirm BAR created, attached, vibeulon minted.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Game Master and commitment gate\n\nChoose a Game Master (Shaman, Challenger, Regent, Architect, Diplomat, Sage). Reach the Commit passage. Optionally click Donate and confirm the external URL opens with telemetry. Optionally click Join the Beta Instance to sign up.',
            cleanText: '### Step 3: GM and commitment gate\n\nChoose GM, reach Commit, optionally donate or sign up.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: KB passages\n\nClick a "Learn more" link (e.g. KB_WhatIsThisPlace, KB_EmotionalFuel). Confirm the KB passage loads and you can return to the ritual spine.',
            cleanText: '### Step 4: KB passages\n\nVerify Learn more links and return navigation.',
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
            text: 'Campaign Onboarding Twine v2 verified. The initiation flow guides visitors through signal capture, BAR creation, vibeulon mint, and commitment. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const onboardingV2ParsedJson = JSON.stringify({
        title: onboardingV2Title,
        startPassage: 'START',
        passages: onboardingV2Passages
    })

    const onboardingV2Story = await db.twineStory.upsert({
        where: { slug: onboardingV2Slug },
        update: {
            title: onboardingV2Title,
            parsedJson: onboardingV2ParsedJson,
            isPublished: true
        },
        create: {
            title: onboardingV2Title,
            slug: onboardingV2Slug,
            sourceType: 'manual_seed',
            sourceText: 'Campaign Onboarding Twine v2 certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: onboardingV2ParsedJson,
            isPublished: true,
            createdById
        }
    })

    const onboardingV2Quest = await db.customBar.upsert({
        where: { id: onboardingV2Slug },
        update: {
            title: onboardingV2Title,
            description: 'Verify Bruised Banana initiation: lens, signal, BAR, micro-quest, vibeulon, GM, commitment gate, KB passages.',
            reward: 1,
            twineStoryId: onboardingV2Story.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/campaign-onboarding-twine-v2/spec.md'
        },
        create: {
            id: onboardingV2Slug,
            title: onboardingV2Title,
            description: 'Verify Bruised Banana initiation: lens, signal, BAR, micro-quest, vibeulon, GM, commitment gate, KB passages.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: onboardingV2Story.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/campaign-onboarding-twine-v2/spec.md'
        }
    })

    console.log(`✅ Story seeded: ${onboardingV2Story.title} (${onboardingV2Story.id})`)
    console.log(`✅ Quest seeded: ${onboardingV2Quest.title} (${onboardingV2Quest.id})`)

    // --- Certification: Quest Grammar Compiler (BY) ---
    const questGrammarTitle = 'Certification: Quest Grammar V1'
    const questGrammarSlug = 'cert-quest-grammar-v1'

    const questGrammarPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the Quest Grammar UX Flow. Covers: CYOA generation (one question per passage), AI generation, Import from .twee, Campaign orientation, and passage-to-quest completion. Admin only.',
            cleanText: 'Verify Quest Grammar UX: CYOA, AI, Import .twee, campaignRef, passage completion.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open Quest Grammar admin\n\n[Open /admin/quest-grammar](/admin/quest-grammar) (admin only). Confirm three tabs: **Form**, **CYOA**, **Import .twee**. Switch to **CYOA** tab.',
            cleanText: '### Step 1: Open Quest Grammar\n\nConfirm Form / CYOA / Import .twee tabs; use CYOA.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Play through CYOA flow\n\nClick through the CYOA steps (one question per passage). Fill Q1–Q7, Model, Segment, Archetype, Lens. Reach the **Generate** step.',
            cleanText: '### Step 2: CYOA flow\n\nPlay through steps; fill answers; reach Generate.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Generate with AI\n\nOn the Generate step, click **Generate with AI** (requires QUEST_GRAMMAR_AI_ENABLED). Confirm the preview shows signature + 6 nodes with coherent text. Then click **Export .twee** and confirm a .twee file downloads.',
            cleanText: '### Step 3: Generate with AI\n\nClick Generate with AI; confirm preview; Export .twee.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Generate overview (AI skeleton)\n\nFrom the same Generate step, click **Generate overview (AI skeleton)**. Confirm objectives and Download .twee work. This tests buildQuestPromptContext + AI output { quests, tweeSource }.',
            cleanText: '### Step 4: Generate overview\n\nClick Generate overview; confirm objectives + .twee.',
            links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_5',
            pid: '6',
            text: '### Step 5: Import from .twee\n\nSwitch to **Import .twee** tab. Paste minimal Twee 3:\n\n```\n:: StoryTitle\nTest Import\n\n:: StoryData\n{"start":"Start"}\n\n:: Start\nFirst passage.\n[[Next->Next]]\n\n:: Next\nEnd.\n```\n\nClick **Import from .twee**. Confirm redirect to Adventures; the new Adventure and its passages exist. [Open /admin/adventures](/admin/adventures) to verify.',
            cleanText: '### Step 5: Import .twee\n\nPaste minimal .twee; import; confirm Adventure created.',
            links: [{ label: 'Next', target: 'STEP_6' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_6',
            pid: '9',
            text: '### Step 6: Campaign orientation\n\n[Open /admin/adventures](/admin/adventures). Click **Edit Graph** on any Adventure. In Settings, find **Campaign Ref**. Set it (e.g. `test-campaign`) and click Save. Confirm it saves.',
            cleanText: '### Step 6: Campaign Ref\n\nEdit Adventure; set campaignRef; confirm save.',
            links: [{ label: 'Next', target: 'STEP_7' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_7',
            pid: '10',
            text: '### Step 7: Publish & initiation flow\n\nReturn to Quest Grammar CYOA. Generate (Compile & Preview or Generate with AI). Click **Publish to Campaign**. [Open /campaign/initiation?segment=player](/campaign/initiation?segment=player). Confirm the flow renders.',
            cleanText: '### Step 7: Publish & initiation\n\nPublish; confirm /campaign/initiation renders.',
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
            text: 'Quest Grammar verified. Campaign Owners can oneshot the Bruised Banana campaign via unpacking input. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const questGrammarParsedJson = JSON.stringify({
        title: questGrammarTitle,
        startPassage: 'START',
        passages: questGrammarPassages
    })

    const questGrammarStory = await db.twineStory.upsert({
        where: { slug: questGrammarSlug },
        update: {
            title: questGrammarTitle,
            parsedJson: questGrammarParsedJson,
            isPublished: true
        },
        create: {
            title: questGrammarTitle,
            slug: questGrammarSlug,
            sourceType: 'manual_seed',
            sourceText: 'Quest Grammar certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: questGrammarParsedJson,
            isPublished: true,
            createdById
        }
    })

    const questGrammarQuest = await db.customBar.upsert({
        where: { id: questGrammarSlug },
        update: {
            title: questGrammarTitle,
            description: 'Verify Quest Grammar UX: CYOA flow, Generate with AI, Generate overview, Import .twee, campaignRef, passage completion.',
            reward: 1,
            twineStoryId: questGrammarStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/quest-grammar-compiler/spec.md'
        },
        create: {
            id: questGrammarSlug,
            title: questGrammarTitle,
            description: 'Verify Quest Grammar UX: CYOA flow, Generate with AI, Import .twee, campaignRef.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: questGrammarStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/quest-grammar-compiler/spec.md'
        }
    })

    console.log(`✅ Story seeded: ${questGrammarStory.title} (${questGrammarStory.id})`)
    console.log(`✅ Quest seeded: ${questGrammarQuest.title} (${questGrammarQuest.id})`)

    // --- Certification: Quest Wizard Template Alignment (DA) ---
    const wizardTemplatesTitle = 'Certification: Quest Wizard Templates V1'
    const wizardTemplatesSlug = 'cert-quest-wizard-templates-v1'

    const wizardTemplatesPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the Quest Wizard template alignment. Confirm only three templates appear (Dreams & Schemes, Personal Development, Custom Quest) and that copy reflects campaign-level and Grow Up framing.',
            cleanText: 'This certification quest verifies the Quest Wizard template alignment.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open the quest creation flow\n\n[Open the quest creation flow](/quest/create) or use the Create BAR / quest wizard from the dashboard. The Quest Wizard should appear with "Choose a Quest Template".',
            cleanText: '### Step 1: Open the quest creation flow\n\nOpen the quest creation flow. The Quest Wizard should appear.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Confirm three templates\n\nVerify only **three** templates are shown: Dreams & Schemes (CAMPAIGN), Personal Development (GROW UP), and Custom Quest (CUSTOM). No Party Prep, Connection Quest, or Inner↔External.',
            cleanText: '### Step 2: Confirm three templates\n\nVerify only three templates: Dreams & Schemes, Personal Development, Custom Quest.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Dreams & Schemes copy\n\nSelect **Dreams & Schemes**. Confirm the description mentions campaign-level, sub-campaign, Kotter Model Stages, and series of adventures.',
            cleanText: '### Step 3: Dreams & Schemes copy\n\nSelect Dreams & Schemes. Confirm description mentions campaign, Kotter, sub-campaign.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Personal Development copy\n\nGo back and select **Personal Development**. Confirm the description mentions Grow Up, skill capacity, and developmental lines.',
            cleanText: '### Step 4: Personal Development copy\n\nSelect Personal Development. Confirm description mentions Grow Up, skill capacity.',
            links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_5',
            pid: '6',
            text: '### Step 5: Complete quest creation\n\nCreate a quest using any template (e.g. Custom Quest). Fill in title and description, save. Confirm the quest is created successfully.',
            cleanText: '### Step 5: Complete quest creation\n\nCreate a quest using any template. Confirm it saves.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '8',
            text: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '7',
            text: 'Verification complete. You have confirmed the Quest Wizard template alignment. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete. Complete this quest to receive your reward.',
            links: []
        }
    ]

    const wizardTemplatesParsedJson = JSON.stringify({
        title: wizardTemplatesTitle,
        startPassage: 'START',
        passages: wizardTemplatesPassages
    })

    const wizardTemplatesStory = await db.twineStory.upsert({
        where: { slug: wizardTemplatesSlug },
        update: {
            title: wizardTemplatesTitle,
            parsedJson: wizardTemplatesParsedJson,
            isPublished: true
        },
        create: {
            title: wizardTemplatesTitle,
            slug: wizardTemplatesSlug,
            sourceType: 'manual_seed',
            sourceText: 'Quest Wizard templates certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: wizardTemplatesParsedJson,
            isPublished: true,
            createdById
        }
    })

    const wizardTemplatesQuest = await db.customBar.upsert({
        where: { id: wizardTemplatesSlug },
        update: {
            title: wizardTemplatesTitle,
            description: 'Step-by-step verification of Quest Wizard templates: three templates only, Dreams & Schemes copy, Personal Development copy, quest creation.',
            reward: 1,
            twineStoryId: wizardTemplatesStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/quest-wizard-template-alignment/spec.md'
        },
        create: {
            id: wizardTemplatesSlug,
            title: wizardTemplatesTitle,
            description: 'Step-by-step verification of Quest Wizard templates: three templates only, Dreams & Schemes copy, Personal Development copy, quest creation.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: wizardTemplatesStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/quest-wizard-template-alignment/spec.md'
        }
    })

    console.log(`✅ Story seeded: ${wizardTemplatesStory.title} (${wizardTemplatesStory.id})`)
    console.log(`✅ Quest seeded: ${wizardTemplatesQuest.title} (${wizardTemplatesQuest.id})`)

    // --- Certification: Gameboard Quest Generation (CY) ---
    const gameboardQuestGenTitle = 'Certification: Gameboard Quest Generation V1'
    const gameboardQuestGenSlug = 'cert-gameboard-quest-generation-v1'

    const gameboardQuestGenPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the Gameboard Quest Generation: Kotter-stage-aligned deck, starter subquests, and Add subquest flow. Requires active instance with campaignRef bruised-banana at kotterStage 1.',
            cleanText: 'Verify gameboard: period filter, starters, Add subquest.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open the gameboard\n\n[Open /campaign/board?ref=bruised-banana](/campaign/board?ref=bruised-banana). Ensure you are logged in and have an active instance (Bruised Banana). Confirm the gameboard loads with 8 slots.',
            cleanText: '### Step 1: Open gameboard\n\nOpen /campaign/board?ref=bruised-banana. Confirm gameboard loads.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Confirm Stage 1 quests only\n\nWith instance at kotterStage 1, the deck should show only Stage 1 quests (e.g. Rally the Urgency, Name What\'s at Stake, Clear What Blocks the Urgency, Practice Naming Stakes, Create Urgency for One Person). No Stage 2–8 quests.',
            cleanText: '### Step 2: Stage 1 only\n\nConfirm only Stage 1 quests appear on the board.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Add subquest under container\n\nOn a container quest (e.g. Rally the Urgency), click **Add quest (1v)**. In the modal, use "Quick subquest" to enter a title and description. Click **Create subquest**. Confirm the subquest is created (costs 1 vibeulon).',
            cleanText: '### Step 3: Add subquest\n\nClick Add quest (1v) on a container; create subquest; confirm it appears.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Complete verification\n\nYou have verified the gameboard quest generation: Kotter-stage filtering, starter subquests, and Add subquest flow. Complete this quest to receive your vibeulon reward.',
            cleanText: '### Step 4: Complete\n\nVerification complete. Complete this quest for your reward.',
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
            text: 'Gameboard Quest Generation verified. The Bruised Banana gameboard shows only Stage 1 quests and supports adding subquests under containers. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const gameboardQuestGenParsedJson = JSON.stringify({
        title: gameboardQuestGenTitle,
        startPassage: 'START',
        passages: gameboardQuestGenPassages
    })

    const gameboardQuestGenStory = await db.twineStory.upsert({
        where: { slug: gameboardQuestGenSlug },
        update: {
            title: gameboardQuestGenTitle,
            parsedJson: gameboardQuestGenParsedJson,
            isPublished: true
        },
        create: {
            title: gameboardQuestGenTitle,
            slug: gameboardQuestGenSlug,
            sourceType: 'manual_seed',
            sourceText: 'Gameboard Quest Generation certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: gameboardQuestGenParsedJson,
            isPublished: true,
            createdById
        }
    })

    const gameboardQuestGenQuest = await db.customBar.upsert({
        where: { id: gameboardQuestGenSlug },
        update: {
            title: gameboardQuestGenTitle,
            description: 'Verify gameboard: period filter (kotterStage), starter subquests, Add quest (1v) flow.',
            reward: 1,
            twineStoryId: gameboardQuestGenStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/gameboard-quest-generation/spec.md'
        },
        create: {
            id: gameboardQuestGenSlug,
            title: gameboardQuestGenTitle,
            description: 'Verify gameboard: period filter (kotterStage), starter subquests, Add quest (1v) flow.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: gameboardQuestGenStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/gameboard-quest-generation/spec.md'
        }
    })

    console.log(`✅ Story seeded: ${gameboardQuestGenStory.title} (${gameboardQuestGenStory.id})`)
    console.log(`✅ Quest seeded: ${gameboardQuestGenQuest.title} (${gameboardQuestGenQuest.id})`)

    // --- Certification: Dashboard Orientation Flow (DG) ---
    const dashboardFlowTitle = 'Certification: Dashboard Orientation Flow V1'
    const dashboardFlowSlug = 'cert-dashboard-orientation-flow-v1'

    const dashboardFlowPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'Verify the dashboard-first orientation flow. Sign up via campaign CYOA, land on the dashboard (not conclave), see orientation quests, and complete the ritual.',
            cleanText: 'Verify dashboard-first orientation flow.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Sign up via campaign CYOA\n\n[Open /campaign?ref=bruised-banana](/campaign?ref=bruised-banana) and play through until you reach the **sign-up node**. Create a new account.',
            cleanText: '### Step 1: Sign up via campaign CYOA\n\nPlay through campaign and sign up.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Dashboard redirect\n\nAfter signing up, confirm you are redirected to the **dashboard** (/) — not /conclave/onboarding. The URL should be / or /?focusQuest=...',
            cleanText: '### Step 2: Dashboard redirect\n\nConfirm redirect to dashboard, not conclave.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Orientation quests visible\n\nConfirm the **orientation thread** and **orientation quests** are visible (e.g. "Continue Ritual" banner, "Enter Ritual" / "Start Journey").',
            cleanText: '### Step 3: Orientation quests visible\n\nConfirm orientation thread and quests visible.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Complete first orientation quest\n\nClick "Continue Ritual" or "Enter Ritual" and complete the first orientation quest.',
            cleanText: '### Step 4: Complete first orientation quest\n\nComplete the first orientation quest.',
            links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_5',
            pid: '6',
            text: '### Step 5: Ritual completion state\n\nConfirm the ritual completion state (e.g. "The Ritual is Complete" banner or orientation thread marked complete).',
            cleanText: '### Step 5: Ritual completion state\n\nConfirm ritual completion state.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '8',
            text: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '7',
            text: 'Dashboard orientation flow verified. New players land on the dashboard with orientation quests. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const dashboardFlowParsedJson = JSON.stringify({
        title: dashboardFlowTitle,
        startPassage: 'START',
        passages: dashboardFlowPassages
    })

    const dashboardFlowStory = await db.twineStory.upsert({
        where: { slug: dashboardFlowSlug },
        update: {
            title: dashboardFlowTitle,
            parsedJson: dashboardFlowParsedJson,
            isPublished: true
        },
        create: {
            title: dashboardFlowTitle,
            slug: dashboardFlowSlug,
            sourceType: 'manual_seed',
            sourceText: 'Dashboard Orientation Flow certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: dashboardFlowParsedJson,
            isPublished: true,
            createdById
        }
    })

    const dashboardFlowQuest = await db.customBar.upsert({
        where: { id: dashboardFlowSlug },
        update: {
            title: dashboardFlowTitle,
            description: 'Verify dashboard-first post-signup redirect, orientation quests visible, and ritual completion.',
            reward: 1,
            twineStoryId: dashboardFlowStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/dashboard-orientation-flow/spec.md'
        },
        create: {
            id: dashboardFlowSlug,
            title: dashboardFlowTitle,
            description: 'Verify dashboard-first post-signup redirect, orientation quests visible, and ritual completion.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: dashboardFlowStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/dashboard-orientation-flow/spec.md'
        }
    })

    console.log(`✅ Story seeded: ${dashboardFlowStory.title} (${dashboardFlowStory.id})`)
    console.log(`✅ Quest seeded: ${dashboardFlowQuest.title} (${dashboardFlowQuest.id})`)

    // --- Certification: Admin Onboarding Flow API + Graph View (DO) ---
    const adminFlowApiTitle = 'Certification: Admin Onboarding Flow API + Graph View V1'
    const adminFlowApiSlug = 'cert-admin-onboarding-flow-api-v1'

    const adminFlowApiPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'Verify the Admin Onboarding Flow API and Graph View. The onboarding page shows the Bruised Banana template structure with branching (The Invitation with 3 branches, etc.), Play draft and View API links, and the API returns valid FlowOutput JSON.',
            cleanText: 'Verify admin onboarding flow API and graph view.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Visit Admin Onboarding\n\n[Open Admin → Onboarding](/admin/onboarding). Ensure you are logged in as admin.',
            cleanText: '### Step 1: Visit Admin Onboarding\n\nOpen /admin/onboarding.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Template Structure + Branching visible\n\nConfirm the **"Template Structure (Bruised Banana)"** section is visible with nodes (Arrival, The Work, The Invitation, Why Identity Matters, etc.) in order. Confirm **The Invitation** shows 3 branches (Aligned, Curious, Skeptical) and a convergence node.',
            cleanText: '### Step 2: Template Structure + Branching visible\n\nConfirm template section with nodes and branching.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: API returns JSON\n\n[Open /api/admin/onboarding/flow?campaign=bruised-banana](/api/admin/onboarding/flow?campaign=bruised-banana) in a new tab. Confirm the response is valid JSON with flow_id, nodes, start_node_id, etc.',
            cleanText: '### Step 3: API returns JSON\n\nConfirm API returns valid FlowOutput.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Play draft and View API links\n\nIn the Template Structure section header, confirm **Play draft** opens [/campaign/twine](/campaign/twine) and **View API** opens the flow JSON in a new tab.',
            cleanText: '### Step 4: Play draft and View API links\n\nConfirm actionable links work.',
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
            pid: '7',
            text: 'Admin Onboarding Flow API + Graph View verified. The template structure shows branching, Play draft and View API links work, and the API returns valid FlowOutput. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const adminFlowApiParsedJson = JSON.stringify({
        title: adminFlowApiTitle,
        startPassage: 'START',
        passages: adminFlowApiPassages
    })

    const adminFlowApiStory = await db.twineStory.upsert({
        where: { slug: adminFlowApiSlug },
        update: {
            title: adminFlowApiTitle,
            parsedJson: adminFlowApiParsedJson,
            isPublished: true
        },
        create: {
            title: adminFlowApiTitle,
            slug: adminFlowApiSlug,
            sourceType: 'manual_seed',
            sourceText: 'Admin Onboarding Flow API certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: adminFlowApiParsedJson,
            isPublished: true,
            createdById
        }
    })

    const adminFlowApiQuest = await db.customBar.upsert({
        where: { id: adminFlowApiSlug },
        update: {
            title: adminFlowApiTitle,
            description: 'Verify Admin Onboarding Flow API + Graph View: template structure with branching, Play draft and View API links, API returns FlowOutput JSON.',
            reward: 1,
            twineStoryId: adminFlowApiStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/admin-onboarding-flow-api/spec.md'
        },
        create: {
            id: adminFlowApiSlug,
            title: adminFlowApiTitle,
            description: 'Verify Admin Onboarding Flow API + Graph View: template structure with branching, Play draft and View API links, API returns FlowOutput JSON.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: adminFlowApiStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/admin-onboarding-flow-api/spec.md'
        }
    })

    console.log(`✅ Story seeded: ${adminFlowApiStory.title} (${adminFlowApiStory.id})`)
    console.log(`✅ Quest seeded: ${adminFlowApiQuest.title} (${adminFlowApiQuest.id})`)

    // --- Certification: Lore-Immersive Onboarding (DI) ---
    const loreImmersiveTitle = 'Certification: Lore-Immersive Onboarding V1'
    const loreImmersiveSlug = 'cert-lore-immersive-onboarding-v1'

    const loreImmersivePassages = [
        {
            name: 'START',
            pid: '1',
            text: 'Verify lore-immersive onboarding: first passage drops you into story world (Conclave/heist), nation/archetype choices are story-framed, vibeulons introduced in-story, no long form block without narrative. Complete flow to dashboard.',
            cleanText: 'Verify lore-immersive onboarding.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: First passage — story world\n\n[Open /campaign?ref=bruised-banana](/campaign?ref=bruised-banana) and play from the start. Confirm the **first passage** drops you into the story world (Conclave, heist, nations, constructs). No abstract "Choose your path" without context.',
            cleanText: '### Step 1: First passage story world\n\nFirst passage uses Conclave/heist language.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Nation/archetype story framing\n\nContinue through character creation. Confirm **nation choice** is preceded by a story beat (e.g. "Each nation channels a different emotional energy"). Confirm **playbook/archetype choice** is story-framed (e.g. "How do you approach the heist?").',
            cleanText: '### Step 2: Nation/archetype story framing\n\nNation and playbook choices have story beats.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Vibeulons in-story\n\nContinue to the moves section. Confirm **vibeulons** are introduced in-story before sign-up (e.g. "emotional energy that powers the construct").',
            cleanText: '### Step 3: Vibeulons in-story\n\nVibeulons introduced before sign-up.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: No long form block\n\nConfirm there is **no long story block** followed by a long form block. Narrative and choices are interleaved.',
            cleanText: '### Step 4: No long form block\n\nStory and choices interleaved.',
            links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_5',
            pid: '6',
            text: '### Step 5: Complete to dashboard\n\nSign up and complete the flow. Confirm you land on the **dashboard** with orientation quests visible.',
            cleanText: '### Step 5: Complete to dashboard\n\nComplete flow, land on dashboard.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'FEEDBACK',
            pid: '8',
            text: '### Report an Issue\n\nSomething isn\'t working as expected? Describe what you encountered so we can fix it.',
            cleanText: '### Report an Issue\n\nDescribe what you encountered.',
            links: [],
            tags: ['feedback']
        },
        {
            name: 'END_SUCCESS',
            pid: '7',
            text: 'Lore-immersive onboarding verified. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const loreImmersiveParsedJson = JSON.stringify({
        title: loreImmersiveTitle,
        startPassage: 'START',
        passages: loreImmersivePassages
    })

    const loreImmersiveStory = await db.twineStory.upsert({
        where: { slug: loreImmersiveSlug },
        update: {
            title: loreImmersiveTitle,
            parsedJson: loreImmersiveParsedJson,
            isPublished: true
        },
        create: {
            title: loreImmersiveTitle,
            slug: loreImmersiveSlug,
            sourceType: 'manual_seed',
            sourceText: 'Lore-Immersive Onboarding certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: loreImmersiveParsedJson,
            isPublished: true,
            createdById
        }
    })

    const loreImmersiveQuest = await db.customBar.upsert({
        where: { id: loreImmersiveSlug },
        update: {
            title: loreImmersiveTitle,
            description: 'Verify lore-immersive onboarding: story-first intro, nation/archetype story framing, vibeulons in-story, flow to dashboard.',
            reward: 1,
            twineStoryId: loreImmersiveStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/lore-immersive-onboarding/spec.md'
        },
        create: {
            id: loreImmersiveSlug,
            title: loreImmersiveTitle,
            description: 'Verify lore-immersive onboarding: story-first intro, nation/archetype story framing, vibeulons in-story, flow to dashboard.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: loreImmersiveStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/lore-immersive-onboarding/spec.md'
        }
    })

    console.log(`✅ Story seeded: ${loreImmersiveStory.title} (${loreImmersiveStory.id})`)
    console.log(`✅ Quest seeded: ${loreImmersiveQuest.title} (${loreImmersiveQuest.id})`)

    // --- Certification: AID Decline Fork (DH) ---
    const aidDeclineForkTitle = 'Certification: AID Decline Fork V1'
    const aidDeclineForkSlug = 'cert-aid-decline-fork-v1'

    const aidDeclineForkPassages = [
        {
            name: 'START',
            pid: '1',
            text: 'Verify the AID decline fork flow: decline clock on offers, fork-on-decline when steward declines a quest-type AID offer. Requires two players (or two browser sessions).',
            cleanText: 'Verify AID decline clock and fork-on-decline.',
            links: [{ label: 'Begin', target: 'STEP_1' }]
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Open the gameboard\n\n[Open /campaign/board?ref=bruised-banana](/campaign/board?ref=bruised-banana). Ensure you are logged in. Player A: take a quest (become steward). Player B: open gameboard in another session.',
            cleanText: '### Step 1: Open gameboard\n\nPlayer A: take quest. Player B: open gameboard.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Offer quest-type AID\n\nAs Player B: click **Offer AID** on the slot where Player A is steward. Select type **Quest**. Create or link a quest. Submit the offer. As Player A: confirm the offer shows **Respond by** or **Expires in** (decline clock).',
            cleanText: '### Step 2: Offer quest AID\n\nPlayer B offers quest AID. Player A sees decline clock.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Decline and fork\n\nAs Player A: click **Decline** on the AID offer. As Player B: confirm **Your declined AID** section appears with the quest title. Click **Fork and complete**. Confirm the fork appears in your hand.',
            cleanText: '### Step 3: Decline and fork\n\nPlayer A declines. Player B sees Your declined AID, forks, fork in hand.',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }]
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Complete verification\n\nYou have verified the AID decline fork: decline clock on offers, fork-on-decline when steward declines. Complete this quest to receive your vibeulon reward.',
            cleanText: '### Step 4: Complete\n\nVerification complete. Complete for reward.',
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
            text: 'AID decline fork verified. Stewards see a decline clock on offers; when they decline, offerers can fork the quest and complete it privately. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete.',
            links: []
        }
    ]

    const aidDeclineForkParsedJson = JSON.stringify({
        title: aidDeclineForkTitle,
        startPassage: 'START',
        passages: aidDeclineForkPassages
    })

    const aidDeclineForkStory = await db.twineStory.upsert({
        where: { slug: aidDeclineForkSlug },
        update: {
            title: aidDeclineForkTitle,
            parsedJson: aidDeclineForkParsedJson,
            isPublished: true
        },
        create: {
            title: aidDeclineForkTitle,
            slug: aidDeclineForkSlug,
            sourceType: 'manual_seed',
            sourceText: 'AID Decline Fork certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: aidDeclineForkParsedJson,
            isPublished: true,
            createdById
        }
    })

    const aidDeclineForkQuest = await db.customBar.upsert({
        where: { id: aidDeclineForkSlug },
        update: {
            title: aidDeclineForkTitle,
            description: 'Verify AID decline clock and fork-on-decline: steward declines, offerer forks quest.',
            reward: 1,
            twineStoryId: aidDeclineForkStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/aid-decline-fork-clock-lore/spec.md'
        },
        create: {
            id: aidDeclineForkSlug,
            title: aidDeclineForkTitle,
            description: 'Verify AID decline clock and fork-on-decline: steward declines, offerer forks quest.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: aidDeclineForkStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/aid-decline-fork-clock-lore/spec.md'
        }
    })

    console.log(`✅ Story seeded: ${aidDeclineForkStory.title} (${aidDeclineForkStory.id})`)
    console.log(`✅ Quest seeded: ${aidDeclineForkQuest.title} (${aidDeclineForkQuest.id})`)

    // cert-starter-quest-generator-v1
    const starterGenSlug = 'cert-starter-quest-generator-v1'
    const starterGenPassages = [
        { name: 'START', pid: '1', text: 'Verify the Starter Quest Generator: domain-biased starter quests after Bruised Banana signup. Complete each step in order.', cleanText: 'Verify Starter Quest Generator.', links: [{ label: 'Begin', target: 'STEP_1' }] },
        { name: 'STEP_1', pid: '2', text: '### Step 1: Complete Bruised Banana signup with lens\n\n[Open /campaign?ref=bruised-banana](/campaign?ref=bruised-banana) and play through until sign-up. Create a new account. Choose a developmental lens (community, creative, strategic, or allyship).', cleanText: 'Complete Bruised Banana signup with lens.', links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_2', pid: '3', text: '### Step 2: Confirm starter quests appear\n\nOn the dashboard, confirm the **Help the Bruised Banana** orientation thread shows starter quests (Strengthen the Residency, Invite an Ally, Declare a Skill, Test the Engine, Create Momentum).', cleanText: 'Confirm starter quests appear.', links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_3', pid: '4', text: '### Step 3: Domain-biased quests present\n\nConfirm starter quests matching your lens are in the thread: creative→Strengthen (GATHERING), allyship→Invite/Create Momentum (RAISE_AWARENESS), strategic→Declare (SKILLFUL_ORGANIZING), community→Test (DIRECT_ACTION).', cleanText: 'Domain-biased quests present.', links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_4', pid: '5', text: '### Step 4: Complete one quest\n\nComplete at least one starter quest from the thread.', cleanText: 'Complete one quest.', links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_5', pid: '6', text: '### Step 5: Verify move/copy when resolved\n\nIf the quest displays emotional move metadata (e.g. move name, wave stage), confirm it appears. Otherwise, note that the quest completed successfully.', cleanText: 'Verify move/copy when resolved.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nSomething isn\'t working? Describe what you encountered.', cleanText: 'Report an Issue.', links: [], tags: ['feedback'] },
        { name: 'END_SUCCESS', pid: '7', text: 'Starter Quest Generator verified. Domain-biased quests appear after signup. Complete this quest to receive your vibeulon reward.', cleanText: 'Verification complete.', links: [] },
    ]
    const starterGenStory = await db.twineStory.upsert({
        where: { slug: starterGenSlug },
        update: { title: 'Certification: Starter Quest Generator V1', parsedJson: JSON.stringify({ startPassage: 'START', passages: starterGenPassages }), isPublished: true },
        create: {
            title: 'Certification: Starter Quest Generator V1',
            slug: starterGenSlug,
            sourceType: 'manual_seed',
            sourceText: 'Starter Quest Generator certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: JSON.stringify({ startPassage: 'START', passages: starterGenPassages }),
            isPublished: true,
            createdById,
        },
    })
    await db.customBar.upsert({
        where: { id: starterGenSlug },
        update: { title: 'Certification: Starter Quest Generator V1', description: 'Verify domain-biased starter quests after Bruised Banana signup.', twineStoryId: starterGenStory.id, status: 'active', visibility: 'public', isSystem: true },
        create: {
            id: starterGenSlug,
            title: 'Certification: Starter Quest Generator V1',
            description: 'Verify domain-biased starter quests after Bruised Banana signup.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: starterGenStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
        },
    })
    console.log(`✅ Quest seeded: cert-starter-quest-generator-v1`)

    // cert-onboarding-flow-completion-v1
    const onboardingFlowSlug = 'cert-onboarding-flow-completion-v1'
    const onboardingFlowPassages = [
        { name: 'START', pid: '1', text: 'Verify the Onboarding Flow Completion: Strengthen the Residency with 4 branches and visible effects. Complete each step in order.', cleanText: 'Verify Onboarding Flow Completion.', links: [{ label: 'Begin', target: 'STEP_1' }] },
        { name: 'STEP_1', pid: '2', text: '### Step 1: Complete Bruised Banana signup with lens\n\n[Open /campaign?ref=bruised-banana](/campaign?ref=bruised-banana) and play through until sign-up. Create a new account. Choose a developmental lens (community, creative, strategic, or allyship).', cleanText: 'Complete Bruised Banana signup with lens.', links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_2', pid: '3', text: '### Step 2: Confirm starter quests appear\n\nOn the dashboard, confirm the **Help the Bruised Banana** orientation thread shows starter quests including **Strengthen the Residency**.', cleanText: 'Confirm starter quests appear.', links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_3', pid: '4', text: '### Step 3: Complete Strengthen the Residency\n\nComplete **Strengthen the Residency** via one of the 4 options: Contribute Support (Donate), Invite an Ally, Share Feedback, or Share the Campaign. If the quest is on the gameboard, complete it there.', cleanText: 'Complete Strengthen via one of 4 options.', links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_4', pid: '5', text: '### Step 4: Observe visible effect\n\nConfirm a visible effect: your wallet shows +vibeulons. If you chose Contribute Support (Donate), Instance funding may also have incremented.', cleanText: 'Observe visible effect.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nSomething isn\'t working? Describe what you encountered.', cleanText: 'Report an Issue.', links: [], tags: ['feedback'] },
        { name: 'END_SUCCESS', pid: '7', text: 'Onboarding Flow Completion verified. Strengthen the Residency has 4 branches with visible effects. Complete this quest to receive your vibeulon reward.', cleanText: 'Verification complete.', links: [] },
    ]
    const onboardingFlowStory = await db.twineStory.upsert({
        where: { slug: onboardingFlowSlug },
        update: { title: 'Certification: Onboarding Flow Completion V1', parsedJson: JSON.stringify({ startPassage: 'START', passages: onboardingFlowPassages }), isPublished: true },
        create: {
            title: 'Certification: Onboarding Flow Completion V1',
            slug: onboardingFlowSlug,
            sourceType: 'manual_seed',
            sourceText: 'Onboarding Flow Completion certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: JSON.stringify({ startPassage: 'START', passages: onboardingFlowPassages }),
            isPublished: true,
            createdById,
        },
    })
    await db.customBar.upsert({
        where: { id: onboardingFlowSlug },
        update: { title: 'Certification: Onboarding Flow Completion V1', description: 'Verify Strengthen the Residency 4 branches and visible effects.', twineStoryId: onboardingFlowStory.id, status: 'active', visibility: 'public', isSystem: true },
        create: {
            id: onboardingFlowSlug,
            title: 'Certification: Onboarding Flow Completion V1',
            description: 'Verify Strengthen the Residency 4 branches and visible effects.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: onboardingFlowStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
        },
    })
    console.log(`✅ Quest seeded: cert-onboarding-flow-completion-v1`)

    // cert-twine-authoring-ir-v1
    const twineIrSlug = 'cert-twine-authoring-ir-v1'
    const twineIrPassages = [
        { name: 'START', pid: '1', text: 'Verify the Twine Authoring IR: create IR nodes, validate, compile to .twee, publish to TwineStory, and play the story. Complete each step in order.', cleanText: 'Verify Twine Authoring IR.', links: [{ label: 'Begin', target: 'STEP_1' }] },
        { name: 'STEP_1', pid: '2', text: '### Step 1: Open IR editor\n\n[Open Admin → Twine Stories](/admin/twine). Select any story and click **Edit IR**. Confirm the IR authoring page loads with story outline, node editor, and Compile/Publish buttons.', cleanText: 'Open IR editor.', links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_2', pid: '3', text: '### Step 2: Add or edit IR nodes\n\nAdd a node (+ Informational or + Choice Node). Edit node_id, body, choices (for choice_node), and emits. Save Draft.', cleanText: 'Add or edit IR nodes.', links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_3', pid: '4', text: '### Step 3: Validate and compile\n\nClick **Compile**. If there are errors (e.g. missing target), fix them. Confirm you receive valid .twee in the preview.', cleanText: 'Validate and compile.', links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'STEP_4', pid: '5', text: '### Step 4: Publish and play\n\nClick **Publish**. Then play the story (from Twine Stories list or campaign). Confirm the content matches what you authored in IR.', cleanText: 'Publish and play.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
        { name: 'FEEDBACK', pid: '6', text: '### Report an Issue\n\nSomething isn\'t working? Describe what you encountered.', cleanText: 'Report an Issue.', links: [], tags: ['feedback'] },
        { name: 'END_SUCCESS', pid: '7', text: 'Twine Authoring IR verified. IR nodes compile to .twee, publish to TwineStory, and play correctly. Complete this quest to receive your vibeulon reward.', cleanText: 'Verification complete.', links: [] },
    ]
    const twineIrStory = await db.twineStory.upsert({
        where: { slug: twineIrSlug },
        update: { title: 'Certification: Twine Authoring IR V1', parsedJson: JSON.stringify({ startPassage: 'START', passages: twineIrPassages }), isPublished: true },
        create: {
            title: 'Certification: Twine Authoring IR V1',
            slug: twineIrSlug,
            sourceType: 'manual_seed',
            sourceText: 'Twine Authoring IR certification quest (seed-cyoa-certification-quests.ts)',
            parsedJson: JSON.stringify({ startPassage: 'START', passages: twineIrPassages }),
            isPublished: true,
            createdById,
        },
    })
    await db.customBar.upsert({
        where: { id: twineIrSlug },
        update: { title: 'Certification: Twine Authoring IR V1', description: 'Verify IR authoring: validate, compile, publish, play.', twineStoryId: twineIrStory.id, status: 'active', visibility: 'public', isSystem: true, backlogPromptPath: '.specify/specs/twine-authoring-ir/spec.md' },
        create: {
            id: twineIrSlug,
            title: 'Certification: Twine Authoring IR V1',
            description: 'Verify IR authoring: validate, compile, publish, play.',
            creatorId: createdById,
            reward: 1,
            twineStoryId: twineIrStory.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/twine-authoring-ir/spec.md',
        },
    })
    console.log(`✅ Quest seeded: cert-twine-authoring-ir-v1`)

    console.log('✅ CYOA Certification Quests seeded.')
}

seed().catch(console.error)
