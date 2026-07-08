import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the Emotional Alchemy service — capture trigger + BARs
 * logging (service Phase 1). Twine + CustomBar cert, deterministic id, idempotent.
 * Framed toward the Bruised Banana Fundraiser.
 *
 * Spec: .specify/specs/emotional-alchemy-service/spec.md § Verification Quest
 * Run:  npm run seed:cert:emotional-alchemy-service (after prisma migrate deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-emotional-alchemy-service-v1'
const SPEC = '.specify/specs/emotional-alchemy-service/spec.md'

const PASSAGES: Passage[] = [
  {
    name: 'START',
    pid: '1',
    text: 'Verify the **service**: a captured charge flows into a practice and the rep is logged back onto that charge. Every verified loop is prep for the **Bruised Banana Fundraiser**. Complete each step, then finish to mint your reward.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  {
    name: 'STEP_1',
    pid: '2',
    text: '### Step 1: Capture, then metabolize\n\n[Open /capture](/capture). Name a charge, pick an emotion (try **Mad**), add intensity/satisfaction, and capture. Confirm a **"Metabolize it now →"** link appears on the captured charge.',
    links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_2',
    pid: '3',
    text: '### Step 2: The diagnostic is pre-seeded\n\nTap **Metabolize it now →**. Confirm the diagnostic **skips the channel and intensity questions** (they came from the charge) and that no raw charge text is in the URL — only `src`, `ch`, `i`, `bar`, `return`.',
    links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_3',
    pid: '4',
    text: '### Step 3: Draw, practice, log\n\nReach the read, **Form the practice →**, draw a card, pick a **Show Up** option, then tap **Log this rep →**. Confirm it says **"Logged to this charge."**',
    links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_4',
    pid: '5',
    text: '### Step 4: The charge remembers\n\nConfirm an **`alchemy_sessions`** row exists with `chargeSourceBarId` = your charge, and the charge BAR\'s **`sourceAlchemySessionId`** points back at it. Confirm the row holds **no raw blocker/story text** — only enums, numbers, the thread label, and the flags (§1.6).',
    links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'FEEDBACK',
    pid: '7',
    text: '### Report an Issue\n\nSomething off — the link didn\'t appear, a seeded step wasn\'t skipped, raw text on the URL, or the session didn\'t log? Describe what you hit so we can fix it before the **Bruised Banana Fundraiser**.',
    links: [],
    tags: ['feedback'],
  },
  {
    name: 'END_SUCCESS',
    pid: '6',
    text: 'Verified: a charge becomes a practice and the rep is remembered on the charge — the loop closes. Reps can now compound into a practice. Complete this quest for your vibeulon.',
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
      sourceText: 'Emotional Alchemy service (capture trigger + BARs logging) certification',
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
  console.log('--- Seeding Emotional Alchemy service certification quest ---')
  const ids = [SLUG]
  await db.playerQuest.deleteMany({ where: { questId: { in: ids } } })
  await db.twineRun.deleteMany({ where: { questId: { in: ids } } })

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')

  await seedCert(
    SLUG,
    'Certification: Emotional Alchemy Service V1',
    'Verify the service: a captured charge flows into a practice and the rep is logged back onto that charge (structured-only), closing the loop.',
    PASSAGES,
    creator.id,
  )

  console.log('✅ Emotional Alchemy service certification quest seeded.')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
