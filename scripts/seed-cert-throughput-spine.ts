/**
 * Verification quest: cert-throughput-spine-v1
 *
 * Walks a tester down the whole personal→collective throughput spine (1.82 TSG):
 * capture a charge → metabolize it into a BAR → seed it (Show Up) → offer it to a
 * campaign → see the contribution on the hub → watch a milestone advance →
 * (steward) author a well-crafted milestone. Completing this end-to-end IS the
 * go-live readiness signal.
 *
 * Framed toward the Bruised Banana Fundraiser: it verifies a person can carry a
 * charge all the way to advancing the residency milestone.
 *
 * Idempotent. Run: npm run seed:cert:throughput-spine
 */
import './require-db-env'
import { db } from '../src/lib/db'

const slug = 'cert-throughput-spine-v1'
const title = 'Certification: Throughput Spine V1'

const passages = [
  {
    name: 'START',
    pid: '1',
    text: 'This certification verifies the **throughput spine** end-to-end: from capturing a charge all the way to advancing a campaign milestone. If you can walk this without a dead end, a person can carry a charge all the way to funding the Bruised Banana residency.\n\nComplete each step in order, then finish to receive your reward.',
    cleanText: 'This certification verifies the throughput spine end-to-end: from capturing a charge all the way to advancing a campaign milestone. If you can walk this without a dead end, a person can carry a charge all the way to funding the Bruised Banana residency. Complete each step in order, then finish to receive your reward.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  {
    name: 'STEP_1',
    pid: '2',
    text: '### Step 1: Capture a charge\n\n[Open the Now page](/) and capture a charge — anything alive for you right now. Confirm it lands as a capture you can metabolize.',
    cleanText: 'Step 1: Capture a charge. Open the Now page (/) and capture a charge — anything alive for you right now. Confirm it lands as a capture you can metabolize.',
    links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_2',
    pid: '3',
    text: '### Step 2: Metabolize into a BAR\n\nRun the charge through **3-2-1** to metabolize it. Confirm you end with a **BAR** (a Belief / Action / Result you can open on its detail page).',
    cleanText: 'Step 2: Metabolize into a BAR. Run the charge through 3-2-1 to metabolize it. Confirm you end with a BAR (a Belief / Action / Result you can open on its detail page).',
    links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_3',
    pid: '4',
    text: '### Step 3: Show Up — seed the BAR\n\nOpen the BAR detail page and use **Seed this BAR** (the Show Up move). Plant it as a **Quest**. Confirm you are routed to the quest in your Hand.',
    cleanText: 'Step 3: Show Up — seed the BAR. Open the BAR detail page and use Seed this BAR (the Show Up move). Plant it as a Quest. Confirm you are routed to the quest in your Hand.',
    links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_4',
    pid: '5',
    text: '### Step 4: Offer it to a campaign\n\nBack on the BAR detail page, use **Offer to a campaign** and choose the Bruised Banana residency (add a short intent note). Confirm it saves — this is the explicit personal→collective bridge.',
    cleanText: 'Step 4: Offer it to a campaign. Back on the BAR detail page, use Offer to a campaign and choose the Bruised Banana residency (add a short intent note). Confirm it saves — this is the explicit personal to collective bridge.',
    links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_5',
    pid: '6',
    text: '### Step 5: See your contribution on the hub\n\n[Open the campaign hub](/campaign/hub?ref=bruised-banana). Confirm your offered BAR appears under **"Offered by you"** and that the contribution progress reflects it.',
    cleanText: 'Step 5: See your contribution on the hub. Open the campaign hub (/campaign/hub?ref=bruised-banana). Confirm your offered BAR appears under Offered by you and that the contribution progress reflects it.',
    links: [{ label: 'Next', target: 'STEP_6' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_6',
    pid: '7',
    text: '### Step 6: Watch a milestone advance\n\nOn the hub, confirm a **milestone** reflects the contribution — the progress bar moves and, when a threshold is reached, the milestone narrative is shown. This is the collective payoff of the spine.',
    cleanText: 'Step 6: Watch a milestone advance. On the hub, confirm a milestone reflects the contribution — the progress bar moves and, when a threshold is reached, the milestone narrative is shown. This is the collective payoff of the spine.',
    links: [{ label: 'Next', target: 'STEP_7' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_7',
    pid: '8',
    text: '### Step 7: (Steward) Author a milestone\n\nAs a steward, [open the milestones page](/campaign/bruised-banana/milestones). **Craft a milestone** — a why-it-matters narrative, a target, and a celebration shown on reach — then **Approve** it. Confirm it goes Active. (If you are not a steward, confirm this page is gated.)',
    cleanText: 'Step 7: (Steward) Author a milestone. As a steward, open the milestones page (/campaign/bruised-banana/milestones). Craft a milestone — a why-it-matters narrative, a target, and a celebration shown on reach — then Approve it. Confirm it goes Active. If you are not a steward, confirm this page is gated.',
    links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'FEEDBACK',
    pid: '9',
    text: "### Report an Issue\n\nSomething isn't working as expected? Describe what you encountered so we can fix it.",
    cleanText: "Report an Issue. Something isn't working as expected? Describe what you encountered so we can fix it.",
    links: [],
    tags: ['feedback'],
  },
  {
    name: 'END_SUCCESS',
    pid: '10',
    text: 'Verification complete. The spine is walkable: a charge became a BAR, the BAR seeded a quest, the quest was offered to a campaign, the contribution surfaced on the hub, a milestone advanced, and a steward can author the next one. The personal throughput system connects to the collective one — and that path funds the residency. Complete this quest to receive your vibeulon reward.',
    cleanText: 'Verification complete. The spine is walkable: a charge became a BAR, the BAR seeded a quest, the quest was offered to a campaign, the contribution surfaced on the hub, a milestone advanced, and a steward can author the next one. The personal throughput system connects to the collective one — and that path funds the residency. Complete this quest to receive your vibeulon reward.',
    links: [],
  },
]

async function seed() {
  console.log('--- Seeding cert-throughput-spine-v1 ---')

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
      sourceText: 'Throughput spine certification quest (seed-cert-throughput-spine.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const description =
    'End-to-end verification of the throughput spine: capture a charge → metabolize into a BAR → seed it (Show Up) → offer it to a campaign → see the contribution on the hub → watch a milestone advance → (steward) author a milestone. Completing it is the go-live readiness signal for the Bruised Banana Fundraiser.'

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
      backlogPromptPath: '.specify/specs/throughput-spine-go-live/spec.md',
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
      backlogPromptPath: '.specify/specs/throughput-spine-go-live/spec.md',
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
