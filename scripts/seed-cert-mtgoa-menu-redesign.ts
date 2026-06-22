import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the MtGoA menu skeuomorphic CYOA redesign.
 * Spec: .specify/specs/mtgoa-menu-skeuomorphic-cyoa/spec.md
 *
 * Idempotent: upserts one TwineStory + one CustomBar (id = slug); resets PlayerQuest /
 * TwineRun for this quest so it can be re-certified after a reseed.
 */
async function seed() {
  console.log('--- Seeding MtGoA Menu Redesign Certification Quest ---')

  const slug = 'cert-mtgoa-menu-redesign-v1'
  const title = 'Certification: MtGoA Menu Skeuomorphic Redesign V1'

  // Allow re-completion after reseed.
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
      text: 'This certification verifies the redesigned **Mastering the Game of Allyship** menu — a deck of cards on a slate table. Confirm the launch menu feels like a real object (not a flat app screen) before the July 18 party, so guests meet the book as a thing they can pick up.\n\nComplete each step in order, then finish to receive your reward.',
      cleanText: 'Verify the redesigned MtGoA deck menu feels like a real object before the July 18 party.',
      links: [{ label: 'Begin', target: 'STEP_1' }],
    },
    {
      name: 'STEP_1',
      pid: '2',
      text: '### Step 1: The deck is public + tactile\n\n[Open /mastering-allyship/hub](/mastering-allyship/hub) **logged out**. Confirm it loads with **no login redirect**, and that the eight spokes read as **cards on a dark-slate table** — each card has a frame, a top-edge highlight, and casts a shadow onto the slate (not flat black-on-black).',
      cleanText: 'Open the hub logged out; confirm it is public and the spokes are cards on a slate table.',
      links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'STEP_2',
      pid: '3',
      text: "### Step 2: Read a card at a glance\n\nPick any card and confirm you can see, without clicking: the **chapter numeral** (I–VIII), the **Kotter stage** + emoji, a **feeling chip**, and the wall-tinted **funnel ribbon** (e.g. \"Free door · Begin free\", \"First gift · Make your move\", \"Become · Choose your role\").",
      cleanText: 'Confirm each card shows numeral, Kotter stage, feeling chip, and a funnel ribbon.',
      links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'STEP_3',
      pid: '4',
      text: '### Step 3: Draw a card\n\nClick a card ("Draw →"). Confirm it routes to that spoke\'s funnel door. Then [open a spoke directly](/mastering-allyship/spoke/3) and confirm it renders as **the drawn card, opened** on the slate — header, feeling chips, the ribbon + door CTA, the description well, and the four WAVE-move wells.',
      cleanText: 'Draw a card and confirm routing; open a spoke page and confirm the opened-card layout.',
      links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
    },
    {
      name: 'STEP_4',
      pid: '5',
      text: '### Step 4: Reduced motion respected\n\nEnable **Reduce Motion** (OS accessibility settings, or DevTools → Rendering → "Emulate prefers-reduced-motion: reduce"). Reload [the deck](/mastering-allyship/hub) and confirm the cards appear **without** the entry slide / float animation (accessibility gate).',
      cleanText: 'Enable reduced motion; confirm card entry/float animations do not run.',
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
      text: 'Verification complete. The MtGoA menu reads as a real deck on a slate table, the cards are legible at a glance, drawing routes correctly, and reduced motion is respected. The launch menu is ready for the party. Complete this quest to receive your vibeulon reward.',
      cleanText: 'Verification complete. The MtGoA menu redesign is confirmed.',
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
      sourceText: 'MtGoA menu redesign certification quest (seed-cert-mtgoa-menu-redesign.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const description =
    'Step-by-step verification of the MtGoA skeuomorphic deck menu: public + tactile hub, legible cards, draw routing, and reduced-motion. Prepares the launch menu for the July 18 party.'

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
      backlogPromptPath: '.specify/specs/mtgoa-menu-skeuomorphic-cyoa/spec.md',
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
      backlogPromptPath: '.specify/specs/mtgoa-menu-skeuomorphic-cyoa/spec.md',
    },
  })

  console.log(`✅ Story seeded: ${story.title} (${story.id})`)
  console.log(`✅ Quest seeded: ${quest.title} (${quest.id})`)
  console.log('✅ MtGoA Menu Redesign Certification Quest seeded.')
}

seed().catch(console.error)
