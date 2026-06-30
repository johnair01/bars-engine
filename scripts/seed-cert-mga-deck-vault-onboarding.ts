import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Seeds the verification quest for the MGA Deck → Hand → Vault → Onboarding
 * loop (Bruised Banana Fundraiser front door). Idempotent: upserts the
 * TwineStory + CustomBar by slug and resets any prior completion so the quest
 * can be re-walked after a reseed.
 *
 * @see .specify/specs/mga-deck-vault-onboarding/spec.md § Verification Quest
 * Run: npm run seed:cert:mga-deck-vault-onboarding
 */

const SLUG = 'cert-mga-deck-vault-onboarding-v1'
const TITLE = 'Certification: MGA Deck → Vault Onboarding V1'
const DESCRIPTION =
    'Verify the new front door: a guest picks up their first allyship move from the deck, creates an account, and finds the BAR waiting in their Hand and Vault.'

async function seed() {
    console.log('--- Seeding MGA Deck → Vault Onboarding certification quest ---')

    // Reset completion so the quest can be walked again after a reseed.
    const deletedQuests = await db.playerQuest.deleteMany({ where: { questId: SLUG } })
    const deletedRuns = await db.twineRun.deleteMany({ where: { questId: SLUG } })
    if (deletedQuests.count > 0 || deletedRuns.count > 0) {
        console.log(`🔄 Reset ${deletedQuests.count} PlayerQuest(s) and ${deletedRuns.count} TwineRun(s)`)
    }

    const creator = await db.player.findFirst()
    if (!creator) throw new Error('No player found for createdById')
    const createdById = creator.id

    const passages = [
        {
            name: 'START',
            pid: '1',
            text: 'This certification quest verifies the **MGA front door**: drawing a deck card, sending it to BARS while logged out, signing up, and finding that exact BAR waiting in your Hand and Vault.\n\nUse a fresh (logged-out) browser session. Complete each step in order, then finish the quest to receive your reward.',
            cleanText: 'This certification quest verifies the MGA front door: drawing a deck card, sending it to BARS while logged out, signing up, and finding that exact BAR waiting in your Hand and Vault. Use a fresh (logged-out) browser session. Complete each step in order, then finish the quest to receive your reward.',
            links: [{ label: 'Begin', target: 'STEP_1' }],
        },
        {
            name: 'STEP_1',
            pid: '2',
            text: '### Step 1: Draw a card\n\nFrom a fresh (logged-out) session, [open the Allyship Deck](/deck) and draw a card.',
            cleanText: 'Step 1: Draw a card. From a fresh (logged-out) session, open the Allyship Deck (/deck) and draw a card.',
            links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
        },
        {
            name: 'STEP_2',
            pid: '3',
            text: '### Step 2: Send to BARS → MGA signup\n\nTap **Send to BARS**. Confirm you are taken to **MGA signup** — **no** "Not logged in" error string, and **no** Conclave story / guided auth costume.',
            cleanText: 'Step 2: Send to BARS → MGA signup. Tap Send to BARS. Confirm you are taken to MGA signup — no "Not logged in" error string, and no Conclave story / guided auth costume.',
            links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
        },
        {
            name: 'STEP_3',
            pid: '4',
            text: '### Step 3: Sign up → land on NOW with the BAR in hand\n\nCreate an account. Confirm you land on **NOW home** (`/`) with the card\'s BAR **in your Hand** (or in the Vault with a "hand full" note if your hand was already full).',
            cleanText: 'Step 3: Sign up → land on NOW with the BAR in hand. Create an account. Confirm you land on NOW home (/) with the card\'s BAR in your Hand (or in the Vault with a "hand full" note if your hand was already full).',
            links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
        },
        {
            name: 'STEP_4',
            pid: '5',
            text: '### Step 4: Hand modal\n\nOpen the **Hand modal** from NOW (or from the deck top bar). Confirm the new BAR is present.',
            cleanText: 'Step 4: Hand modal. Open the Hand modal from NOW (or from the deck top bar). Confirm the new BAR is present.',
            links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }],
        },
        {
            name: 'STEP_5',
            pid: '6',
            text: '### Step 5: Vault — five rooms\n\nOpen the [Vault](/vault). Confirm **five move-rooms** — Wake Up · Open Up · Clean Up · Grow Up · Show Up — enterable in any order, and that your new BAR is visible (it surfaces in the **Wake Up / Charges** room as "what\'s alive"). Confirm the lobby is **free of** Scene Atlas, summary-strip counts, and campaign/invite blocks.',
            cleanText: 'Step 5: Vault — five rooms. Open the Vault (/vault). Confirm five move-rooms — Wake Up, Open Up, Clean Up, Grow Up, Show Up — enterable in any order, and that your new BAR is visible (it surfaces in the Wake Up / Charges room). Confirm the lobby is free of Scene Atlas, summary-strip counts, and campaign/invite blocks.',
            links: [{ label: 'Next', target: 'STEP_6' }, { label: 'Report Issue', target: 'FEEDBACK' }],
        },
        {
            name: 'STEP_6',
            pid: '7',
            text: '### Step 6: Open Up (viewing space)\n\nEnter [Open Up](/vault/open-up). Confirm you can **see your live charges and sit with them**, and that nothing here changes a charge.\n\n_Note: the felt-sense interaction is still being designed — Open Up ships as a contemplative viewing space for now. Re-add a "feel into a charge" step once that mechanic lands._',
            cleanText: 'Step 6: Open Up (viewing space). Enter Open Up (/vault/open-up). Confirm you can see your live charges and sit with them, and that nothing here changes a charge. Note: the felt-sense interaction is still being designed — Open Up ships as a contemplative viewing space for now.',
            links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }],
        },
        {
            name: 'FEEDBACK',
            pid: '8',
            text: "### Report an Issue\n\nSomething isn't working as expected? Describe what you encountered so we can fix it.",
            cleanText: "Report an Issue. Something isn't working as expected? Describe what you encountered so we can fix it.",
            links: [],
            tags: ['feedback'],
        },
        {
            name: 'END_SUCCESS',
            pid: '9',
            text: 'Verification complete. You have confirmed the MGA front door: deck → signup → Hand → Vault. Complete this quest to receive your vibeulon reward.',
            cleanText: 'Verification complete. You have confirmed the MGA front door: deck → signup → Hand → Vault. Complete this quest to receive your vibeulon reward.',
            links: [],
        },
    ]

    const parsedJson = JSON.stringify({ title: TITLE, startPassage: 'START', passages })

    const story = await db.twineStory.upsert({
        where: { slug: SLUG },
        update: { title: TITLE, parsedJson, isPublished: true },
        create: {
            title: TITLE,
            slug: SLUG,
            sourceType: 'manual_seed',
            sourceText: 'MGA Deck → Vault onboarding certification quest (seed-cert-mga-deck-vault-onboarding.ts)',
            parsedJson,
            isPublished: true,
            createdById,
        },
    })

    const quest = await db.customBar.upsert({
        where: { id: SLUG },
        update: {
            title: TITLE,
            description: DESCRIPTION,
            reward: 1,
            twineStoryId: story.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/mga-deck-vault-onboarding/spec.md',
        },
        create: {
            id: SLUG,
            title: TITLE,
            description: DESCRIPTION,
            creatorId: createdById,
            reward: 1,
            twineStoryId: story.id,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            backlogPromptPath: '.specify/specs/mga-deck-vault-onboarding/spec.md',
        },
    })

    console.log(`✅ Story seeded: ${story.title} (${story.id})`)
    console.log(`✅ Quest seeded: ${quest.title} (${quest.id})`)
}

seed().catch((e) => {
    console.error(e)
    process.exit(1)
})
