import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for The Crossing CYOA experience + steward dashboard.
 * Idempotent: upserts one TwineStory + one system CustomBar.
 *
 * Framed toward the Bruised Banana / barn-raising fundraiser: confirming The
 * Crossing means the community can help raise the barn — every verified move is
 * a brick toward the residency.
 *
 * Run: npm run seed:cert:the-crossing
 * Spec: .specify/specs/the-crossing-experience/spec.md
 */

const SLUG = 'cert-the-crossing-experience-v1'
const TITLE = 'Certification: The Crossing Experience V1'
const DESCRIPTION =
  'Walk the full Crossing loop — choose a path, make a move, and steward it from the board to a thank-you — so the community can help raise the barn.'

async function seed() {
  console.log('--- Seeding The Crossing verification quest ---')

  // Reset prior completions so the quest can be re-verified after reseed.
  const deletedQuests = await db.playerQuest.deleteMany({ where: { questId: SLUG } })
  const deletedRuns = await db.twineRun.deleteMany({ where: { questId: SLUG } })
  if (deletedQuests.count || deletedRuns.count) {
    console.log(`🔄 Reset ${deletedQuests.count} PlayerQuest(s) and ${deletedRuns.count} TwineRun(s)`)
  }

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const createdById = creator.id

  const passages = [
    {
      name: 'START',
      pid: '1',
      text: 'This certification verifies **The Crossing** — the community car-fund experience and Wendell’s steward board. Completing it confirms the loop works so the community can help raise the barn. Do each step in order, then finish to mint your reward.',
      links: [{ label: 'Begin', target: 'STEP_1' }],
    },
    {
      name: 'STEP_1',
      pid: '2',
      text: '### Step 1: Choose a path\n\n[Open /campaign/the-crossing](/campaign/the-crossing). Confirm the hero ("Wendell needs a reliable car to keep showing up."), the four **domain gates**, and that opening a role card expands its accordion (one open at a time).',
      links: [
        { label: 'Next', target: 'STEP_2' },
        { label: 'Report Issue', target: 'FEEDBACK' },
      ],
    },
    {
      name: 'STEP_2',
      pid: '3',
      text: '### Step 2: Enter a role\n\n[Open a role page](/campaign/the-crossing/role/car-scout). Confirm the header card, "Moves you can make", **two Allyship Deck cards**, and the Superpower Quiz fallback.',
      links: [
        { label: 'Next', target: 'STEP_3' },
        { label: 'Report Issue', target: 'FEEDBACK' },
      ],
    },
    {
      name: 'STEP_3',
      pid: '4',
      text: '### Step 3: Make a move (no account)\n\n[Open the capture form](/campaign/the-crossing/move/car-scout). Fill name, contact, and an offer — confirm submit stays disabled until all three are filled — then submit and reach the **"Your move is saved as a BAR."** screen.',
      links: [
        { label: 'Next', target: 'STEP_4' },
        { label: 'Report Issue', target: 'FEEDBACK' },
      ],
    },
    {
      name: 'STEP_4',
      pid: '5',
      text: '### Step 4: Find it on the board\n\n[Open the steward dashboard](/campaign/the-crossing/steward) (signed in as the steward). Confirm the new contribution sorts to the **top** with a **New** pill, and the car-fund card shows progress toward $4,800.',
      links: [
        { label: 'Next', target: 'STEP_5' },
        { label: 'Report Issue', target: 'FEEDBACK' },
      ],
    },
    {
      name: 'STEP_5',
      pid: '6',
      text: '### Step 5: Follow up\n\nOpen the contribution. In **Follow up**, write a message and **Log message** — confirm the status advances from **New** to **Contacted** and the note appears in Activity.',
      links: [
        { label: 'Next', target: 'STEP_6' },
        { label: 'Report Issue', target: 'FEEDBACK' },
      ],
    },
    {
      name: 'STEP_6',
      pid: '7',
      text: '### Step 6: Close the loop\n\nBack on the board, **Mark the car as purchased**, then **Thank your contributors**, edit the message, and send. Confirm you reach **"A yellow brick is paved."**',
      links: [
        { label: 'Complete verification', target: 'END_SUCCESS' },
        { label: 'Report Issue', target: 'FEEDBACK' },
      ],
    },
    {
      name: 'FEEDBACK',
      pid: '8',
      text: '### Report an Issue\n\nSomething off? Describe what you encountered so we can fix it before the campaign goes public.',
      links: [],
      tags: ['feedback'],
    },
    {
      name: 'END_SUCCESS',
      pid: '9',
      text: 'Verification complete. The Crossing carries care from "I want to help" all the way to a paved yellow brick. Complete this quest to mint your vibeulon — another brick toward the barn.',
      links: [],
    },
  ].map((p) => ({ ...p, cleanText: p.text }))

  const parsedJson = JSON.stringify({ title: TITLE, startPassage: 'START', passages })

  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: { title: TITLE, parsedJson, isPublished: true },
    create: {
      title: TITLE,
      slug: SLUG,
      sourceType: 'manual_seed',
      sourceText: 'The Crossing verification quest (seed-cyoa-cert-the-crossing.ts)',
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
      backlogPromptPath: '.specify/specs/the-crossing-experience/spec.md',
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
      backlogPromptPath: '.specify/specs/the-crossing-experience/spec.md',
    },
  })

  console.log(`✅ Story seeded: ${story.title} (${story.id})`)
  console.log(`✅ Quest seeded: ${quest.title} (${quest.id})`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
