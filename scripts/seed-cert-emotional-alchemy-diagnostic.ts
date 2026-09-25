import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the Emotional Alchemy Charge Diagnostic (Practice Atlas
 * target 2). Twine + CustomBar cert, isSystem + public, deterministic id,
 * idempotent. Framed toward the Bruised Banana Fundraiser: a verified diagnostic
 * is party-prep for the practice engine.
 *
 * Spec: .specify/specs/emotional-alchemy-diagnostic/spec.md § Verification Quest
 * Run:  npm run seed:cert:emotional-alchemy-diagnostic (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-emotional-alchemy-diagnostic-v1'
const SPEC = '.specify/specs/emotional-alchemy-diagnostic/spec.md'

const PASSAGES: Passage[] = [
  {
    name: 'START',
    pid: '1',
    text: 'Verify the **Charge Diagnostic** end-to-end: a player turns a live charge into a structured read without their raw words ever leaving the device. Every verified loop is prep for the **Bruised Banana Fundraiser**. Complete each step, then finish to mint your reward.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  {
    name: 'STEP_1',
    pid: '2',
    text: '### Step 1: Name the charge\n\n[Open /practice/diagnose](/practice/diagnose). Confirm the somatic-pause copy ("notice where in your body it lives") and that the **"I need more than a practice"** exit is visible at the bottom. Name a blocker, label the thread.',
    links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_2',
    pid: '3',
    text: '### Step 2: The flat fork fires\n\nTap **Flat or numb**. Confirm the four-answer fork appears (rested / walled-off / buried / grey) — flatness must never route straight to Peace. Pick **Buried** and confirm it reads as Neutrality / overload.',
    links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_3',
    pid: '4',
    text: '### Step 3: Hot charge + layer check\n\nRestart. Pick **Mad**, set intensity **7**. Confirm the **layer check** is offered (intensity ≥ 5) and that the final read flags the charge as **hot** (a grounding reset comes first).',
    links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_4',
    pid: '5',
    text: '### Step 4: Safety and privacy hold\n\nEnter a blocker naming **your boss**. Confirm the **power-over safety fork** fires. With the network tab open, complete the flow and confirm **nothing is POSTed** — the diagnostic is client-only and your raw text never leaves the device.',
    links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_5',
    pid: '6',
    text: '### Step 5: The read is honest and editable\n\nReach the summary. Confirm the structured read (**channel → target**, intensity, shape chip, time / temporal / fuel) and that altitude/target were **pre-filled and editable**. Confirm the **capture-only** and **crisis** exits both work and neither shames you.',
    links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'FEEDBACK',
    pid: '8',
    text: '### Report an Issue\n\nSomething off — a fork that didn’t fire, a default that was silent, raw text on the wire? Describe what you hit so we can fix it before the **Bruised Banana Fundraiser**.',
    links: [],
    tags: ['feedback'],
  },
  {
    name: 'END_SUCCESS',
    pid: '7',
    text: 'Verified: a player can turn a live charge into a clean, composer-ready read — flat disambiguated, hot charge flagged, safety asked, words kept on the device. The instrument that feeds every practice holds. Complete this quest for your vibeulon.',
    links: [],
  },
]

async function seedCert(slug: string, title: string, description: string, passages: Passage[], createdById: string) {
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages })
  const story = await db.twineStory.upsert({
    where: { slug },
    update: { title, parsedJson, isPublished: true },
    create: {
      title,
      slug,
      sourceType: 'manual_seed',
      sourceText: 'Emotional Alchemy Charge Diagnostic certification (seed-cert-emotional-alchemy-diagnostic.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })
  await db.customBar.upsert({
    where: { id: slug },
    update: { title, description, reward: 1, twineStoryId: story.id, status: 'active', visibility: 'public', isSystem: true, backlogPromptPath: SPEC },
    create: { id: slug, title, description, creatorId: createdById, reward: 1, twineStoryId: story.id, status: 'active', visibility: 'public', isSystem: true, backlogPromptPath: SPEC },
  })
  console.log(`✅ ${title} (${slug})`)
}

async function seed() {
  console.log('--- Seeding Charge Diagnostic certification quest ---')
  const ids = [SLUG]
  await db.playerQuest.deleteMany({ where: { questId: { in: ids } } })
  await db.twineRun.deleteMany({ where: { questId: { in: ids } } })

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')

  await seedCert(
    SLUG,
    'Certification: Charge Diagnostic V1',
    'Verify the Charge Diagnostic: a live charge becomes a structured read — flat disambiguated, hot charge flagged, safety asked, raw words kept on the device.',
    PASSAGES,
    creator.id,
  )

  console.log('✅ Charge Diagnostic certification quest seeded.')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
