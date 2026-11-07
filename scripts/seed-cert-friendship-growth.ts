import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the friendship Between's growth (Six-faces-council spec .specify/specs/friendship-between-growth,
 * FR-015). Twine + CustomBar cert, isSystem + public, deterministic id, idempotent (an upsert; a tester's progress is kept).
 *
 * Run: npm run seed:cert:friendship-growth (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-friendship-growth-v1'
const SPEC = '.specify/specs/friendship-between-growth/spec.md'
const next = (target: string) => [{ label: 'Next', target }, { label: 'Report Issue', target: 'FEEDBACK' }]

const PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify **the Between grows from play**: an answer fills a bowl of tea, a cup is left covered and drunk by the other, a pot is found on the shelf, a lantern lights at the nook\'s door, and an ember that has risen wakes. You need two signed-in players in one shared Between, and two browsers.', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: '### Step 1: Answer a cast as the second player\n\nAs the first player, cast at the coin table and leave it face up. As the second player, open the Between and answer it. Confirm a bowl of tea now stands on the low table, and the sky and the creature are a little brighter on both screens. Confirm no number, streak word or score appears anywhere.', links: next('STEP_2') },
  { name: 'STEP_2', pid: '3', text: '### Step 2: Pour a cup alone, drink it as the other\n\nAs the first player, sit at the hearth and pour a cup while the second player is away. Confirm a covered cup stays on the low table. As the second player, open the Between: confirm the line **their name left you a cup.** and a **Drink it** button. Tap it, and confirm the Between brightens and a bowl fills.', links: next('STEP_3') },
  { name: 'STEP_3', pid: '4', text: '### Step 3: The first pot\n\nKeep answering, drinking and playing in the hollow\'s games until the line **A new pot is on the shelf.** shows. Confirm the first pot on the mantel is lit and glows once. Pour from it at the hearth and confirm the tea in the cup is that pot\'s own colour.', links: next('STEP_4') },
  { name: 'STEP_4', pid: '5', text: '### Step 4: The lantern at the door\n\nLeave a cup or an answer waiting on the second player, then have them go to their nook. Confirm a lantern is lit at the nook\'s doorway, and that their next-moves card says what waits and with whom. Answer it, and confirm the lantern goes out.', links: next('STEP_5') },
  { name: 'STEP_5', pid: '6', text: '### Step 5: The notices switch\n\nIn the nook, open Rooms. Confirm the switch **Tell me when a friend answers** is on. Turn it off and reload; confirm it stays off. Turn it on again.', links: next('STEP_6') },
  { name: 'STEP_6', pid: '7', text: '### Step 6: Sit twice with one ember and watch it wake\n\nSit at the hearth with one ember and let the sit run its length: the ember rises. Sit with the same ember again. Confirm **Something small stirs by the coals.**, then **Give it a name?** with one line and **Leave it be**. Name it, and confirm it stays beside the hearth.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nDid something look wrong? Say which step you were on and what the page showed, so we can fix it before the friend plays.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '9', text: 'Verified: play feeds the Between, and the Between shows it as light, tea, pots and a lantern, never as a number. Complete this quest for your vibeulon.', links: [] },
]

async function seed() {
  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const title = 'Certification: The Between Grows From Play V1'
  const description = 'Verify the friendship Between\'s growth: an answer fills a bowl, a covered cup is drunk by the other, a pot is found, the door lantern lights, and a risen ember wakes.'
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages: PASSAGES })
  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: { title, parsedJson, isPublished: true },
    create: { title, slug: SLUG, sourceType: 'manual_seed', sourceText: 'Friendship growth certification (seed-cert-friendship-growth.ts)', parsedJson, isPublished: true, createdById: creator.id },
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
