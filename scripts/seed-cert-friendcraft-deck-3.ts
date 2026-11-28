import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for Friendcraft onboarding slice 3, a kept turn as a BAR card and the ember set into it
 * (Six-faces-council spec .specify/specs/friendcraft-deck-3). Twine + CustomBar cert, isSystem + public,
 * deterministic id, idempotent (an upsert; a tester's progress is kept).
 *
 * Run: npm run seed:cert:friendcraft-deck-3 (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-friendcraft-deck-3-v1'
const SPEC = '.specify/specs/friendcraft-deck-3/spec.md'
const next = (target: string) => [{ label: 'Next', target }, { label: 'Report Issue', target: 'FEEDBACK' }]

const PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify **the kept turn as a BAR**: two friends keep a turn together, the kept page is drawn as a BAR card, and a worked ember set into it makes one vibeulon. You need two accounts in Friendcraft sharing one Between, and a lit ember you can work.', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: '### Step 1: The BAR card\n\nKeep a turn together at the low table. Open the kept page. Confirm it is drawn as a BAR card with both lines on it, and no number appears anywhere.', links: next('STEP_2') },
  { name: 'STEP_2', pid: '3', text: '### Step 2: Work an ember\n\nIn the hearth, work a lit ember until it is worked. Confirm it appears among the things you hold.', links: next('STEP_3') },
  { name: 'STEP_3', pid: '4', text: '### Step 3: Set it into the BAR\n\nOpen the kept turn and tap **Set it into this BAR**. Confirm one coin, drawn as a hex tile, now sits on the BAR\'s corner.', links: next('STEP_4') },
  { name: 'STEP_4', pid: '5', text: '### Step 4: Its story, and take it back\n\nTap the coin to read its story. Then tap **Take my coin back** and confirm the coin returns to you and the BAR\'s corner is empty.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '6', text: '### Report an Issue\n\nSay which step you were on and what the table showed, so we can fix it before Wendell sits with a friend.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '7', text: 'Verified: a kept turn is a BAR, a worked ember can be set into it as a coin, and the coin can be read and taken back. Complete this quest for your vibeulon.', links: [] },
]

async function seed() {
  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const title = 'Certification: Kept Turn as a BAR V1'
  const description = 'Verify Friendcraft slice 3: a kept turn is drawn as a BAR, a worked ember is set into it as a coin, and the coin can be read and taken back.'
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages: PASSAGES })
  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: { title, parsedJson, isPublished: true },
    create: { title, slug: SLUG, sourceType: 'manual_seed', sourceText: 'Friendcraft slice 3 certification (seed-cert-friendcraft-deck-3.ts)', parsedJson, isPublished: true, createdById: creator.id },
  })
  const quest = await db.customBar.upsert({
    where: { id: SLUG },
    update: { title, description, reward: 1, twineStoryId: story.id, status: 'active', visibility: 'public', isSystem: true, backlogPromptPath: SPEC },
    create: { id: SLUG, title, description, creatorId: creator.id, reward: 1, twineStoryId: story.id, status: 'active', visibility: 'public', isSystem: true, backlogPromptPath: SPEC },
  })
  console.log(`✅ ${quest.title} (${quest.id})`)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
