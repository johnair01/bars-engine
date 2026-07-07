import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the Go Deeper superpower funnel (go-deeper Slice 5 / FR13).
 * Twine + CustomBar cert, isSystem + public, deterministic id, idempotent.
 * Framed toward the Bruised Banana Fundraiser (party prep / engine improvement).
 *
 *   - cert-go-deeper-v1 — quiz → result → draw a card → Go Deeper (inner pays off)
 *                          → Go Deeper (outer upsell) → mint.
 *
 * Spec: .specify/specs/go-deeper/spec.md § Verification Quest
 * Run:  npm run seed:cert:go-deeper (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const GO_DEEPER_SLUG = 'cert-go-deeper-v1'
const SPEC = '.specify/specs/go-deeper/spec.md'

const GO_DEEPER_PASSAGES: Passage[] = [
  {
    name: 'START',
    pid: '1',
    text: 'Verify the **Go Deeper** funnel end-to-end: a player discovers their superpower, draws an allyship card, and finds their superpower\'s move waiting inside it — paying off for the slot they own, and inviting them to unlock the slot they don\'t. Framed toward the **Bruised Banana Fundraiser** (every verified loop is party prep). Complete each step, then finish to mint your reward.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  {
    name: 'STEP_1',
    pid: '2',
    text: '### Step 1: Find your superpower\n\n[Open /superpower](/superpower). Confirm the quiz loads with **no email gate**, answer through to the reveal, then **log in to save**. Confirm your `{inner, outer}` loadout persists (the reveal’s primary/secondary mapped by orientation).',
    links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_2',
    pid: '3',
    text: '### Step 2: Draw a card\n\n[Open the deck](/deck). Draw or pick any **move** card and open its detail overlay. Confirm the **subject toggle** (self / other) is present — Go Deeper reads the active subject.',
    links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_3',
    pid: '4',
    text: '### Step 3: Go Deeper on a *self* card (inner pays off)\n\nWith the card in the **self** reading, find the **Go Deeper** affordance. As a deck owner your **inner** superpower\'s pack was granted on quiz completion — confirm the move **opens fully**: name, essence, real steps, and the working-vs-performed tell. No paywall on the slot you own.',
    links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_4',
    pid: '5',
    text: '### Step 4: Go Deeper on an *other* card (outer upsell)\n\nSwitch the card to the **other** reading. Confirm Go Deeper shows your **outer** superpower has a move here, but it is **locked** — citation only, **never the content** — with an **"Unlock the {Outer} pack"** link pointing at the real pack SKU (not a `/launch` placeholder).',
    links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'STEP_5',
    pid: '6',
    text: '### Step 5: The gates are honest\n\nConfirm the edges hold: logged-out → Go Deeper asks you to **log in**; no loadout → it sends you to **find your superpower**; a coordinate with no published move shows **nothing** (never an empty or broken affordance). The locked path leaks no steps.',
    links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }],
  },
  {
    name: 'FEEDBACK',
    pid: '8',
    text: '### Report an Issue\n\nSomething off — a leak, a dead link, a move that didn’t open? Describe what you hit so we can fix it before the **Bruised Banana Fundraiser**.',
    links: [],
    tags: ['feedback'],
  },
  {
    name: 'END_SUCCESS',
    pid: '7',
    text: 'Verified: a player can discover their superpower, draw a card, and feel their inner move pay off while the outer move invites them deeper — gates honest, content never leaked. The link from buying the deck to playing the game holds. Complete this quest for your vibeulon.',
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
      sourceText: 'Go Deeper superpower funnel certification (seed-cert-go-deeper.ts)',
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
  console.log('--- Seeding Go Deeper funnel certification quest ---')
  const ids = [GO_DEEPER_SLUG]
  await db.playerQuest.deleteMany({ where: { questId: { in: ids } } })
  await db.twineRun.deleteMany({ where: { questId: { in: ids } } })

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')

  await seedCert(
    GO_DEEPER_SLUG,
    'Certification: Go Deeper Funnel V1',
    'Verify the Go Deeper loop: discover your superpower, draw a card, watch your inner move pay off and your outer move invite the unlock — gates honest, locked content never leaked.',
    GO_DEEPER_PASSAGES,
    creator.id,
  )

  console.log('✅ Go Deeper certification quest seeded.')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
