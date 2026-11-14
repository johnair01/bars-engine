import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the shared pick at Chapter 1's hunters' choice and the hollow (Six-faces-council feature
 * ch1-shared-pick, FR-009). Twine + CustomBar cert, isSystem + public, deterministic id, idempotent (an upsert; a
 * tester's progress is kept). Framed as readying Chapter 1's two-player play for the Bruised Banana residency.
 *
 * Run: npm run seed:cert:ch1-shared-pick (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-ch1-shared-pick-v1'
const SPEC = '.specify/specs/ch1-shared-pick/spec.md'
const PAGE = '/ontology-game/between'
const next = (target: string) => [{ label: 'Next', target }, { label: 'Report Issue', target: 'FEEDBACK' }]

const PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify the **shared pick**: two people in one Between garden take turns lifting Wake Up cards from one ring of seven stones, so each pick changes what the other can play. This readies Chapter 1\'s two-player play for the **Bruised Banana residency**. You need two phones, or a phone and a laptop, each signed in as a different player.', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: `### Step 1: Send the invite\n\nOn the first phone, [open the Between](${PAGE}), plant a spark toward the second player, and send its link from the **Invite** sheet.`, links: next('STEP_2') },
  { name: 'STEP_2', pid: '3', text: '### Step 2: Meet at the hearth\n\nOn the second phone, open the link, walk through the doorway and **Ask to join** at the spark. On the first phone, welcome them. Both avatars walk to the hearth.', links: next('STEP_3') },
  { name: 'STEP_3', pid: '4', text: `### Step 3: The first pick\n\nOn the first phone, add \`&skipHome=1&pick=a6\` to the room's address. Seven stones light in a ring round the hearth on **both** screens. Tap a stone: your avatar walks to it and its card's question shows. Tap **Lift it**. Confirm its light goes out on the second phone within a few seconds.`, links: next('STEP_4') },
  { name: 'STEP_4', pid: '5', text: '### Step 4: The partner picks for the hunters\n\nOn the second phone, try the dark stone: it says it has been lifted already. Walk to one of the six still lit and lift it, or tap **Pass**.', links: next('STEP_5') },
  { name: 'STEP_5', pid: '6', text: '### Step 5: The hollow turns the order\n\nConfirm the second phone now says **Your pick** at the hollow: the partner goes first. Each of you may lift a lit stone or **Lift your own hollow card**, which goes to your own pouch; the other screen shows only that you took your own.', links: next('STEP_6') },
  { name: 'STEP_6', pid: '7', text: '### Step 6: The log\n\nWhen both have picked at the hollow, confirm each screen shows **The pick is done** with every hand\'s card at each moment beside the card written for it. Your own hollow card shows only on your own screen.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nSomething off? Describe what you saw on each phone so it can be fixed before the residency\'s two-player play.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '9', text: 'Verified: two people can share one hand at the hunters\' choice, and the hollow pays back whoever went second. Chapter 1\'s two-player play is one step closer for the **Bruised Banana residency**. Complete this quest for your vibeulon.', links: [] },
]

async function seed() {
  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const title = 'Certification: Shared Pick at the Hunters\' Choice V1'
  const description = 'Verify the shared pick: two players lift Wake Up cards in turns from one ring of stones, a lifted stone goes dark on both screens, and the hollow turns the order.'
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages: PASSAGES })
  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: { title, parsedJson, isPublished: true },
    create: { title, slug: SLUG, sourceType: 'manual_seed', sourceText: 'Shared pick certification (seed-cert-ch1-shared-pick.ts)', parsedJson, isPublished: true, createdById: creator.id },
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
