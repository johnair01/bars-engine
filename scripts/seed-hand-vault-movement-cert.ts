/**
 * Verification quest: cert-hand-vault-movement-v1
 *
 * Walks a tester through the Hand ↔ Vault loop that issue #132 unblocked:
 * capture on the whiteboard → confirm it's in the Hand → Return it to the
 * Vault → Hold it back in the Hand → fill the Hand and capture again (silent
 * Vault fallback) → pull a Vault BAR into an empty slot from the Hand glance.
 *
 * Framed toward the Bruised Banana Fundraiser: it verifies a person can stock
 * their Hand with live seeds and move them freely before the party.
 *
 * Idempotent. Run: npm run seed:cert:hand-vault-movement
 */
import './require-db-env'
import { db } from '../src/lib/db'

const slug = 'cert-hand-vault-movement-v1'
const title = 'Certification: Hand ↔ Vault Movement V1'

const passages = [
  {
    name: 'START',
    pid: '1',
    text: 'This certification verifies the **Hand ↔ Vault** loop end-to-end: a fresh capture lands in your Hand, and you can move BARs freely between your Hand and your Vault. If you can walk this without a dead end, a person can stock their Hand with live seeds before the Bruised Banana Fundraiser.\n\nComplete each step in order, then finish to receive your reward.',
    cleanText: 'This certification verifies the Hand to Vault loop end-to-end: a fresh capture lands in your Hand, and you can move BARs freely between your Hand and your Vault. If you can walk this without a dead end, a person can stock their Hand with live seeds before the Bruised Banana Fundraiser. Complete each step in order, then finish to receive your reward.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  {
    name: 'STEP_1',
    pid: '2',
    text: '### Step 1: Capture into the Hand\n\n[Open the capture whiteboard](/bars/capture), drop a seed (a line of text is enough), and **Keep** it. Confirm the closing card reads **"Held in your Hand"**, then [open Now](/) and confirm the seed sits in a Hand slot.',
    cleanText: 'Step 1: Capture into the Hand. Open the capture whiteboard (/bars/capture), drop a seed (a line of text is enough), and Keep it. Confirm the closing card reads Held in your Hand, then open Now (/) and confirm the seed sits in a Hand slot.',
    links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_2',
    pid: '3',
    text: '### Step 2: Return it to the Vault\n\nOpen that BAR\'s detail page. In the location section use **Return to Vault**. Confirm the section now reads **"In your Vault"** and the BAR has left your Hand on Now.',
    cleanText: 'Step 2: Return it to the Vault. Open that BAR detail page. In the location section use Return to Vault. Confirm the section now reads In your Vault and the BAR has left your Hand on Now.',
    links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_3',
    pid: '4',
    text: '### Step 3: Hold it back in your Hand\n\nStill on the BAR detail page (or from the **Garden** list), use **Hold in Hand**. Confirm the BAR returns to a Hand slot. This is the Vault → Hand direction.',
    cleanText: 'Step 3: Hold it back in your Hand. Still on the BAR detail page (or from the Garden list), use Hold in Hand. Confirm the BAR returns to a Hand slot. This is the Vault to Hand direction.',
    links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_4',
    pid: '5',
    text: '### Step 4: Fill the Hand, then capture again\n\nGet your Hand to **6 / 6** (capture or hold more BARs). Now capture once more on the whiteboard. Confirm capture is **never blocked**: the closing card tells you **"Hand full — saved to your Vault."** No modal interrupts the canvas.',
    cleanText: 'Step 4: Fill the Hand, then capture again. Get your Hand to 6 of 6 (capture or hold more BARs). Now capture once more on the whiteboard. Confirm capture is never blocked: the closing card tells you Hand full — saved to your Vault. No modal interrupts the canvas.',
    links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_5',
    pid: '6',
    text: '### Step 5: Pull a Vault BAR into an empty slot\n\nReturn one BAR to the Vault to free a slot, then on [Now](/) tap the **empty Hand slot**. In the sheet, choose **a Vault BAR to pull in** (or "+ Capture new"). Confirm it lands in that slot.',
    cleanText: 'Step 5: Pull a Vault BAR into an empty slot. Return one BAR to the Vault to free a slot, then on Now (/) tap the empty Hand slot. In the sheet, choose a Vault BAR to pull in (or + Capture new). Confirm it lands in that slot.',
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
    text: 'Verification complete. The Hand fills: a fresh capture is held in your Hand, BARs move both ways between Hand and Vault, capture is never blocked when the Hand is full, and you can pull a Vault BAR into an empty slot. Your Hand reflects what you are actively holding — ready to stock with live seeds for the Bruised Banana Fundraiser. Complete this quest to receive your vibeulon reward.',
    cleanText: 'Verification complete. The Hand fills: a fresh capture is held in your Hand, BARs move both ways between Hand and Vault, capture is never blocked when the Hand is full, and you can pull a Vault BAR into an empty slot. Your Hand reflects what you are actively holding — ready to stock with live seeds for the Bruised Banana Fundraiser. Complete this quest to receive your vibeulon reward.',
    links: [],
  },
]

async function seed() {
  console.log('--- Seeding cert-hand-vault-movement-v1 ---')

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
      sourceText: 'Hand ↔ Vault movement certification quest (seed-hand-vault-movement-cert.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const description =
    'End-to-end verification of the Hand ↔ Vault loop: capture on the whiteboard → confirm it is in the Hand → Return to Vault → Hold in Hand → fill the Hand and capture again (silent Vault fallback) → pull a Vault BAR into an empty slot. Verifies issue #132 is resolved for the Bruised Banana Fundraiser.'

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
      backlogPromptPath: '.specify/specs/hand-vault-capture-movement/spec.md',
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
      backlogPromptPath: '.specify/specs/hand-vault-capture-movement/spec.md',
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
