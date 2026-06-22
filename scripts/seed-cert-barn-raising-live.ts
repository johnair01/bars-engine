import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the live three-wall Milestone BAR.
 * Spec: .specify/specs/barn-raising-live-data/spec.md
 *
 * Idempotent: upserts one TwineStory + one CustomBar (id = slug); resets PlayerQuest /
 * TwineRun for re-cert. Run after `npm run seed:barn`.
 */
async function seed() {
  console.log('--- Seeding Barn Raising Live Certification Quest ---')

  const slug = 'cert-barn-raising-live-v1'
  const title = 'Certification: Barn Raising — Live Data V1'

  const deletedQuests = await db.playerQuest.deleteMany({ where: { questId: slug } })
  const deletedRuns = await db.twineRun.deleteMany({ where: { questId: slug } })
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
      text: 'This certification verifies the **three-wall barn** moves on real contributions: a pre-sale purchase should raise the pre-sale wall, live, so the room can watch the send-off fund itself on the 18th.\n\nPrereq: run `npm run seed:barn` first. Complete each step in order, then finish to receive your reward.',
      cleanText: 'Verify the barn moves on real contributions (pre-sale purchase raises Wall 2).',
      links: [{ label: 'Begin', target: 'STEP_1' }],
    },
    {
      name: 'STEP_1',
      pid: '2',
      text: '### Step 1: The walls are live\n\n[Open /event/barn](/event/barn) (no `?preview`). Confirm the three walls render — **Replace the car**, **Pre-sale**, **Runway** — reading from real milestone totals (likely $0 before any contribution).',
      cleanText: 'Open /event/barn; confirm the three live walls render.',
      links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'STEP_2',
      pid: '3',
      text: '### Step 2: Stand at the pre-sale wall\n\nThe real pre-sale is [/launch](/launch) (Gumroad checkout — every sale raises the wall via the sale webhook). To verify the wall math without a live card charge, open [/event/donate?wall=presale](/event/donate?wall=presale) and enter an amount — the honor-system path credits the same pre-sale wall.',
      cleanText: 'Open /event/donate?wall=presale and enter an amount (verifies the same pre-sale wall as /launch Gumroad sales).',
      links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'STEP_3',
      pid: '4',
      text: '### Step 3: Self-report the contribution\n\nLog in if needed, then submit the self-report form. Confirm you get a success message and vibeulons mint.',
      cleanText: 'Self-report the contribution; confirm success + vibeulons.',
      links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'STEP_4',
      pid: '5',
      text: '### Step 4: The pre-sale wall rose\n\nReturn to [/event/barn](/event/barn). Confirm the **Pre-sale** wall total increased by your contribution (the headline "Raised (one-time)" also moves).',
      cleanText: 'Return to /event/barn; confirm the pre-sale wall rose by your contribution.',
      links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'FEEDBACK',
      pid: '7',
      text: "### Report an Issue\n\nSomething isn't working as expected? Describe what you encountered so we can fix it.",
      cleanText: "### Report an Issue\n\nSomething isn't working as expected? Describe what you encountered so we can fix it.",
      links: [],
      tags: ['feedback'],
    },
    {
      name: 'END_SUCCESS',
      pid: '6',
      text: 'Verification complete. The barn is live — contributions raise the right wall, and the room can watch the send-off fund itself. Complete this quest to receive your vibeulon reward.',
      cleanText: 'Verification complete. The barn moves on real contributions.',
      links: [],
    },
  ]

  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages })

  const story = await db.twineStory.upsert({
    where: { slug },
    update: { title, parsedJson, isPublished: true },
    create: {
      title,
      slug,
      sourceType: 'manual_seed',
      sourceText: 'Barn raising live certification quest (seed-cert-barn-raising-live.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const description =
    'Step-by-step verification that the three-wall Milestone BAR moves on real contributions: live walls, pre-sale purchase, self-report, pre-sale wall rises.'

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
      backlogPromptPath: '.specify/specs/barn-raising-live-data/spec.md',
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
      backlogPromptPath: '.specify/specs/barn-raising-live-data/spec.md',
    },
  })

  console.log(`✅ Story seeded: ${story.title} (${story.id})`)
  console.log(`✅ Quest seeded: ${quest.title} (${quest.id})`)
  console.log('✅ Barn Raising Live Certification Quest seeded.')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
