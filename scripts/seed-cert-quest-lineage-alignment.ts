/**
 * Verification quest: cert-quest-lineage-alignment-v1
 *
 * Walks a tester through the QLA loop: a Tap-the-Vein commit becomes a QUEST that
 * hangs on this week's lens goal (aligned) and shows its week→year lineage; a
 * commit with no weekly goal becomes a SHADOW quest, which can be folded into a
 * weekly goal to bring it into alignment.
 *
 * Framed toward the Bruised Banana Fundraiser: it verifies a guest can turn a
 * morning check-in into an aligned quest — proving the daily loop before the
 * residency launch.
 *
 * Idempotent. Run: npm run seed:cert:quest-lineage-alignment
 */
import './require-db-env'
import { db } from '../src/lib/db'

const slug = 'cert-quest-lineage-alignment-v1'
const title = 'Certification: Quest Lineage & Alignment V1'

const passages = [
  {
    name: 'START',
    pid: '1',
    text: 'This certification verifies the **Quest Lineage & Alignment** loop: a Tap-the-Vein commit becomes a quest hung on this week’s goal, unaligned work surfaces as a shadow quest, and a shadow can be folded back into alignment.\n\nComplete each step in order, then finish to receive your reward.',
    cleanText: 'This certification verifies the Quest Lineage & Alignment loop: a Tap-the-Vein commit becomes a quest hung on this week’s goal, unaligned work surfaces as a shadow quest, and a shadow can be folded back into alignment. Complete each step in order, then finish to receive your reward.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  {
    name: 'STEP_1',
    pid: '2',
    text: '### Step 1: Commit an aligned move\n\n[Open Tap the Vein](/tap-the-vein). Free-write, brainstorm, then in **Commit** select **this week’s goal** and commit a move. Confirm the note reads “aligned to this week.”',
    cleanText: 'Step 1: Commit an aligned move. Open Tap the Vein (/tap-the-vein). Free-write, brainstorm, then in Commit select this week’s goal and commit a move. Confirm the note reads aligned to this week.',
    links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_2',
    pid: '3',
    text: '### Step 2: See it as a quest in the Vault\n\n[Open the Vault → All BARs](/vault/all). Confirm the move you just committed appears as a **quest** (not a bare seed).',
    cleanText: 'Step 2: See it as a quest in the Vault. Open the Vault → All BARs (/vault/all). Confirm the move you just committed appears as a quest (not a bare seed).',
    links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_3',
    pid: '4',
    text: '### Step 3: Confirm the lineage chain\n\nOpen the quest’s detail page. Confirm the **lens alignment** panel shows the chain **Week → Month → Quarter → Year** and an **Aligned** badge.',
    cleanText: 'Step 3: Confirm the lineage chain. Open the quest’s detail page. Confirm the lens alignment panel shows the chain Week to Month to Quarter to Year and an Aligned badge.',
    links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_4',
    pid: '5',
    text: '### Step 4: Make a shadow quest\n\nBack in [Tap the Vein](/tap-the-vein), commit another move with **No weekly goal** selected. Then [open Vault → Shadow quests](/vault/shadow) and confirm it appears there, tagged **No weekly goal**.',
    cleanText: 'Step 4: Make a shadow quest. Back in Tap the Vein (/tap-the-vein), commit another move with No weekly goal selected. Then open Vault → Shadow quests (/vault/shadow) and confirm it appears there, tagged No weekly goal.',
    links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_5',
    pid: '6',
    text: '### Step 5: Fold it into alignment\n\nOn the Shadow quests page, pick a **weekly goal** and use **Fold into this week**. Confirm the quest leaves the shadow list and its detail page now shows **Aligned**.',
    cleanText: 'Step 5: Fold it into alignment. On the Shadow quests page, pick a weekly goal and use Fold into this week. Confirm the quest leaves the shadow list and its detail page now shows Aligned.',
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
    pid: '8',
    text: 'Verification complete. A morning commit became an aligned quest hung on this week’s goal, unaligned work surfaced as a shadow, and the shadow folded back into alignment. The daily loop connects to the lens hierarchy — ready for guests at the Bruised Banana Fundraiser. Complete this quest to receive your vibeulon reward.',
    cleanText: 'Verification complete. A morning commit became an aligned quest hung on this week’s goal, unaligned work surfaced as a shadow, and the shadow folded back into alignment. The daily loop connects to the lens hierarchy — ready for guests at the Bruised Banana Fundraiser. Complete this quest to receive your vibeulon reward.',
    links: [],
  },
]

async function seed() {
  console.log('--- Seeding cert-quest-lineage-alignment-v1 ---')

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
      sourceText: 'Quest Lineage & Alignment certification quest (seed-cert-quest-lineage-alignment.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const description =
    'Verifies the QLA loop: a Tap-the-Vein commit becomes a quest hung on this week’s lens goal (aligned, week→year lineage), an unaligned commit surfaces as a shadow quest, and a shadow folds back into a weekly goal. Proves the daily loop before the Bruised Banana Fundraiser.'

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
      backlogPromptPath: '.specify/specs/quest-lineage-alignment/spec.md',
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
      backlogPromptPath: '.specify/specs/quest-lineage-alignment/spec.md',
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
