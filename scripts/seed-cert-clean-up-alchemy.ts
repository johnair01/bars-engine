import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the card turn: Open Up and Clean Up on a Your steps card's back (six-faces-council
 * .specify/specs/clean-up-alchemy, FR-014, T011). The card back lives on the Council Board (/board/council#steps) and
 * pencils its six answers through POST /api/unpack/read. Twine + CustomBar cert, isSystem + public, deterministic id,
 * idempotent (an upsert; a tester's progress is kept).
 *
 * Run: npm run seed:cert:clean-up-alchemy (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-clean-up-alchemy-v1'
const SPEC = 'six-faces-council/.specify/specs/clean-up-alchemy/spec.md'
const PAGE = '/board/council#steps'
const next = (target: string) => [{ label: 'Next', target }, { label: 'Report Issue', target: 'FEEDBACK' }]

const PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify the **card turn**: a stuck card in your hand turns over, the six unpacking questions are asked on its back one at a time, pencilled from the card\'s own words, and Clean Up walks one way through the move table for each feeling the card is in. The card\'s front words never change.', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: `### Step 1: Lift a stuck card\n\n[Open Your steps](${PAGE}) and tap a card in your hand that names a feeling, such as one written in Tap the Vein that morning. It lifts, with the five seals on its rim.`, links: next('STEP_2') },
  { name: 'STEP_2', pid: '3', text: '### Step 2: Unpack it\n\nTap Open Up, then Turn it over. The card turns and its back shows the front\'s words small at the top and one question. Keep two pencilled answers, retype one with Write my own, add "frustrated" to the dotted words for how it feels now and "peaceful" to how you will feel, and tap Stuck. Confirm only one question shows at a time, and that one coin drops after the sixth.', links: next('STEP_3') },
  { name: 'STEP_3', pid: '4', text: '### Step 3: Walk a way to its end\n\nTap Walk the way through. Confirm one way per feeling, each a trail of stones from your feeling to the one you want. Walk one: tap It moved on each move. Confirm the move is written on the card, and at the end its dot at the top of the card fills with the colour it landed in. No coin is spent.', links: next('STEP_4') },
  { name: 'STEP_4', pid: '5', text: '### Step 4: A card with no unpacking\n\nLift a card you have not unpacked and tap Clean Up. Confirm it asks What\'s stirring?, Where do you want to land? and How stuck is it?, all by taps. Tap two feelings and confirm two ways come up.', links: next('STEP_5') },
  { name: 'STEP_5', pid: '6', text: '### Step 5: Not yet, and another way\n\nTap Not yet. Confirm the same move comes back in other words, for free, marked act 2 of 2. Tap Not yet again and confirm the card offers another way for this feeling for one coin.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '7', text: '### Report an Issue\n\nSomething off? Describe what you saw and on which device, so the card back can be fixed before Wendell turns his own cards over.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '8', text: 'Verified: a card turns over, the six are answered by tap from pencilled words, and each feeling walks its own way through the move table. Complete this quest for your vibeulon.', links: [] },
]

async function seed() {
  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const title = 'Certification: The Card Turn V1'
  const description = 'Verify Open Up and Clean Up on a card\'s back: unpack a stuck card through the six questions, walk one way to its end, and take another way.'
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages: PASSAGES })
  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: { title, parsedJson, isPublished: true },
    create: { title, slug: SLUG, sourceType: 'manual_seed', sourceText: 'Card turn certification (seed-cert-clean-up-alchemy.ts)', parsedJson, isPublished: true, createdById: creator.id },
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
