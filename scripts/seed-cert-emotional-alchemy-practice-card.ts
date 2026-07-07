import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the Emotional Alchemy Practice Card (Practice Atlas
 * target 3, UX half). Twine + CustomBar cert, isSystem + public, deterministic
 * id, idempotent. Framed toward the Bruised Banana Fundraiser: a formed practice
 * is the payoff the whole engine builds toward.
 *
 * Spec: .specify/specs/emotional-alchemy-practice-card/spec.md § Verification Quest
 * Run:  npm run seed:cert:emotional-alchemy-practice-card (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-emotional-alchemy-practice-card-v1'
const SPEC = '.specify/specs/emotional-alchemy-practice-card/spec.md'

const PASSAGES: Passage[] = [
  {
    name: 'START',
    pid: '1',
    text: 'Verify the **formation** end-to-end: a named charge becomes a formed, element-coded practice with a real move. Every verified loop is prep for the **Bruised Banana Fundraiser**. Complete each step, then finish to mint your reward.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  {
    name: 'STEP_1',
    pid: '2',
    text: '### Step 1: Diagnose and reach the read\n\n[Open /practice/diagnose](/practice/diagnose). Name a charge (try **Mad**, intensity **6**), pass the forks, and reach **The Read** — confirm the channel gem appears there for the first time.',
    links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_2',
    pid: '3',
    text: '### Step 2: Form the practice\n\nTap **Form the practice →**. Pick a move (e.g. **Clean Up**). Confirm a **CultivationCard** forms — element **frame + glow** matching the channel (Anger → Fire), the tool name, and a timebox.',
    links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_3',
    pid: '4',
    text: '### Step 3: The move is playable\n\nConfirm the card shows the **stance question**, numbered **protocol steps**, and a distinct **spirit step** (element gem bullet) at the end. If the charge was hot (≥7), confirm a **grounding step comes first**.',
    links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_4',
    pid: '5',
    text: '### Step 4: Show up, then re-rate\n\nPick a **Show Up** option (internal or external). Confirm the **re-rate** appears; set a lower number and confirm the honest delta message. Confirm **“Not saved”** — nothing is persisted. Confirm **“Why this tool?”** reveals the considered candidates + guards.',
    links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'FEEDBACK',
    pid: '7',
    text: '### Report an Issue\n\nSomething off — the card didn’t form, the element was wrong, a step missing, or something got saved that shouldn’t? Describe what you hit so we can fix it before the **Bruised Banana Fundraiser**.',
    links: [],
    tags: ['feedback'],
  },
  {
    name: 'END_SUCCESS',
    pid: '6',
    text: 'Verified: a named charge becomes a formed, element-coded practice — pre-card resolves into post-card, the move is playable, and the loop closes with an honest re-rate. The heart of the engine holds. Complete this quest for your vibeulon.',
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
      sourceText: 'Emotional Alchemy Practice Card certification (seed-cert-emotional-alchemy-practice-card.ts)',
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
  console.log('--- Seeding Practice Card certification quest ---')
  const ids = [SLUG]
  await db.playerQuest.deleteMany({ where: { questId: { in: ids } } })
  await db.twineRun.deleteMany({ where: { questId: { in: ids } } })

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')

  await seedCert(
    SLUG,
    'Certification: Practice Card V1',
    'Verify formation: a named charge becomes a formed, element-coded practice with a playable move, closing with an honest re-rate.',
    PASSAGES,
    creator.id,
  )

  console.log('✅ Practice Card certification quest seeded.')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
