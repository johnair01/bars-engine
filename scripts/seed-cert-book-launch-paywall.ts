/**
 * Verification quest: cert-book-launch-paywall-v1
 *
 * Walks a tester through the Phase 1 book paywall (1.78 BLP): free Prologue,
 * gated chapter → paywall CTA, redeem a (mock-mode) license key, gated chapter
 * unlocks. The download step lands with Phase 2 (depends on the PDF pipeline,
 * 1.80 DPX) and will be appended then.
 *
 * Framed toward the Bruised Banana Fundraiser: a working paywall lets backers
 * buy the book and fund the residency.
 *
 * Idempotent. Run: npm run seed:cert:book-paywall
 * Requires GUMROAD_VERIFY_MODE=mock so step 3 redeems a TEST- key without a sale.
 */
import './require-db-env'
import { db } from '../src/lib/db'

const slug = 'cert-book-launch-paywall-v1'
const title = 'Certification: Book Launch Paywall V1'

const passages = [
  {
    name: 'START',
    pid: '1',
    text: 'This certification verifies the **book launch paywall**: the free Prologue, the gated chapters, and redeeming a license key. A working paywall lets backers buy *Mastering the Game of Allyship* and fund the Bruised Banana residency.\n\nComplete each step in order, then finish to receive your reward.\n\n_Tip: set `GUMROAD_VERIFY_MODE=mock` so step 3 accepts a `TEST-` key without a real sale._',
    cleanText: 'This certification verifies the book launch paywall: the free Prologue, the gated chapters, and redeeming a license key. A working paywall lets backers buy Mastering the Game of Allyship and fund the Bruised Banana residency. Complete each step in order, then finish to receive your reward. Tip: set GUMROAD_VERIFY_MODE=mock so step 3 accepts a TEST- key without a real sale.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  {
    name: 'STEP_1',
    pid: '2',
    text: '### Step 1: Free Prologue\n\n[Open /handbook](/handbook) while logged out. Confirm the Prologue reader loads with no paywall — this is the free marketing funnel.',
    cleanText: 'Step 1: Free Prologue. Open /handbook while logged out. Confirm the Prologue reader loads with no paywall — this is the free marketing funnel.',
    links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_2',
    pid: '3',
    text: '### Step 2: Gated chapter → paywall\n\n[Open /handbook/chapter-one](/handbook/chapter-one) (any non-Prologue chapter) while not entitled. Confirm you see the **paywall** — "Continue the journey" with **Buy on Gumroad** and **I already have a code** — instead of the chapter.',
    cleanText: 'Step 2: Gated chapter. Open /handbook/chapter-one while not entitled. Confirm you see the paywall — Continue the journey with Buy on Gumroad and I already have a code — instead of the chapter.',
    links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_3',
    pid: '4',
    text: '### Step 3: Redeem a key\n\n[Open /handbook/unlock](/handbook/unlock). Log in if prompted (the form routes you to sign in and back). Enter a test key such as `TEST-allyship` and submit. Confirm it verifies and routes you into the reader.',
    cleanText: 'Step 3: Redeem a key. Open /handbook/unlock. Log in if prompted (the form routes you to sign in and back). Enter a test key such as TEST-allyship and submit. Confirm it verifies and routes you into the reader.',
    links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_4',
    pid: '5',
    text: '### Step 4: Chapter unlocks\n\n[Open /handbook/chapter-one](/handbook/chapter-one) again now that you are entitled. Confirm the paywall is **gone** and the reader shell loads (content arrives once chapters are authored via the content pipeline).',
    cleanText: 'Step 4: Chapter unlocks. Open /handbook/chapter-one again now that you are entitled. Confirm the paywall is gone and the reader shell loads (content arrives once chapters are authored via the content pipeline).',
    links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'FEEDBACK',
    pid: '7',
    text: "### Report an Issue\n\nSomething isn't working as expected? Describe what you encountered so we can fix it.",
    cleanText: "Report an Issue. Something isn't working as expected? Describe what you encountered so we can fix it.",
    links: [],
    tags: ['feedback'],
  },
  {
    name: 'END_SUCCESS',
    pid: '6',
    text: 'Verification complete. The book paywall gates chapters, redeems keys, and unlocks the reader — backers can buy the book and fund the residency. Complete this quest to receive your vibeulon reward.',
    cleanText: 'Verification complete. The book paywall gates chapters, redeems keys, and unlocks the reader — backers can buy the book and fund the residency. Complete this quest to receive your vibeulon reward.',
    links: [],
  },
]

async function seed() {
  console.log('--- Seeding cert-book-launch-paywall-v1 ---')

  // Reset completion so admins can re-run the quest after a reseed.
  const deletedQuests = await db.playerQuest.deleteMany({ where: { questId: slug } })
  const deletedRuns = await db.twineRun.deleteMany({ where: { questId: slug } })
  if (deletedQuests.count > 0 || deletedRuns.count > 0) {
    console.log(`🔄 Reset ${deletedQuests.count} PlayerQuest(s) and ${deletedRuns.count} TwineRun(s)`)
  }

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const createdById = creator.id

  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages })

  const story = await db.twineStory.upsert({
    where: { slug },
    update: { title, parsedJson, isPublished: true },
    create: {
      title,
      slug,
      sourceType: 'manual_seed',
      sourceText: 'Book launch paywall certification quest (seed-cert-book-launch-paywall.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const description =
    'Step-by-step verification of the book launch paywall: free Prologue, gated chapter → paywall CTA, redeem a license key, chapter unlocks. Lets backers buy the book and fund the Bruised Banana Fundraiser.'

  const quest = await db.customBar.upsert({
    where: { id: slug },
    update: {
      title,
      description,
      reward: 1,
      twineStoryId: story.id,
      status: 'active',
      visibility: 'public',
      isSystem: true,
      backlogPromptPath: '.specify/specs/book-launch-paywall/spec.md',
    },
    create: {
      id: slug,
      title,
      description,
      creatorId: createdById,
      reward: 1,
      twineStoryId: story.id,
      status: 'active',
      visibility: 'public',
      isSystem: true,
      backlogPromptPath: '.specify/specs/book-launch-paywall/spec.md',
    },
  })

  console.log(`✅ Story seeded: ${story.title} (${story.id})`)
  console.log(`✅ Quest seeded: ${quest.title} (${quest.id})`)
}

seed()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await db.$disconnect()
    process.exit(1)
  })
