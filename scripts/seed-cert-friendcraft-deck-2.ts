import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for Friendcraft onboarding slice 2, sitting together and drawing from each other's deck
 * (Six-faces-council spec .specify/specs/friendcraft-deck-2, FR-015). Twine + CustomBar cert, isSystem + public,
 * deterministic id, idempotent (an upsert; a tester's progress is kept).
 *
 * Run: npm run seed:cert:friendcraft-deck-2 (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-friendcraft-deck-2-v1'
const SPEC = '.specify/specs/friendcraft-deck-2/spec.md'
const next = (target: string) => [{ label: 'Next', target }, { label: 'Report Issue', target: 'FEEDBACK' }]

const PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify **sitting together**: two friends who share a Between and are both in Friendcraft draw from each other\'s deck at the low table. You need two accounts, each in Friendcraft with a deck of at least one goal and three worded cards (light, middle, deep), and one Between they share. Two browsers, or one and a private window, work.', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: '### Step 1: Sit and draw a light card\n\nBoth friends walk into the shared hollow and sit at the low table. As the first friend, tap **Draw from <name>\'s deck** until a light card turns face up. Write your line. Confirm the card shows its goal on a ribbon, the card has the same shape as the deck\'s back, and no number appears anywhere.', links: next('STEP_2') },
  { name: 'STEP_2', pid: '3', text: '### Step 2: Keep it\n\nAs the second friend, sit (or stay seated), see the card and the first line, and write yours. Confirm both of you see **Kept in both your books.** and one bowl of tea fills on the table.', links: next('STEP_3') },
  { name: 'STEP_3', pid: '4', text: '### Step 3: A sealed card, asked for\n\nAs the first friend, draw until a middle or deep card lies under its paper band. Confirm the band shows its depth and empty bowls and none of its words. Tap **Ask <name> to offer it**: the card goes small to a paper slip. As the second friend, sit: confirm **<name> asked for a card you wrote.** with the goal it came from, tap **Offer it**, and both write a line.', links: next('STEP_4') },
  { name: 'STEP_4', pid: '5', text: '### Step 4: Put it back\n\nAs the first friend, draw a sealed card and tap **Put it back**. Confirm it costs nothing and the next draw is open.', links: next('STEP_5') },
  { name: 'STEP_5', pid: '6', text: '### Step 5: Tea, and not today\n\nWith two bowls of tea on the table, draw a deep card and tap **Earn it together**, then **Open it with tea**. As the second friend, tap **Not today**. Confirm the card goes back and the tea is on the table again.', links: next('STEP_6') },
  { name: 'STEP_6', pid: '7', text: '### Step 6: The books\n\nIn each friend\'s record book, after the goal pages, find the kept turns as ink pages: the card\'s words, its goal, and both lines, the first friend\'s first. In the first friend\'s Between BARs, find the slip they left; in both, the kept page.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nDid something look wrong? Say which step you were on and what the table showed, so we can fix it before Wendell sits with a friend.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '9', text: 'Verified: two friends can draw from each other\'s deck, ask for a sealed card or earn it with tea, and keep what they said in both books. Complete this quest for your vibeulon.', links: [] },
]

async function seed() {
  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const title = 'Certification: Sitting Together V1'
  const description = 'Verify Friendcraft slice 2: two friends at a shared low table draw from each other\'s deck, answer a light card, ask for or earn a sealed one, and keep the turn in both books.'
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages: PASSAGES })
  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: { title, parsedJson, isPublished: true },
    create: { title, slug: SLUG, sourceType: 'manual_seed', sourceText: 'Friendcraft slice 2 certification (seed-cert-friendcraft-deck-2.ts)', parsedJson, isPublished: true, createdById: creator.id },
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
