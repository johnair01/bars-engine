import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the Friends' Fire, the road home of the charge-to-world episode (Six-faces-council feature
 * ctw-friends-fire, FR-010). Twine + CustomBar cert, isSystem + public, deterministic id, idempotent (an upsert; a
 * tester's progress is kept). Framed as readying the episode's road home for a first player.
 *
 * Run: npm run seed:cert:ctw-friends-fire (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-ctw-friends-fire-v1'
const SPEC = '.specify/specs/ctw-friends-fire/spec.md'
const PAGE = '/between/land.html?place=friends-fire&at=crate'
const next = (target: string) => [{ label: 'Next', target }, { label: 'Report Issue', target: 'FEEDBACK' }]

const PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify the **Friends\' Fire**: the episode\'s road home, where you play an unfinished bar on five seals and a friend plays it on to its end. This readies the charge-to-world episode for a first player. Use a phone with the sound on.', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: `### Step 1: Sit at the fire\n\n[Open the fire](${PAGE}). You are seated on the empty crate and the view sits low over your shoulder. Confirm the crackle is under the scene and Oriel tunes a string at a time.`, links: next('STEP_2') },
  { name: 'STEP_2', pid: '3', text: '### Step 2: Play your notes\n\nTap **Open the toolbag and play**. Five seals show, with the stump\'s notes ringed. Tap a few. Confirm each sounds and lights, that the crackle drops a little while you play, and that nothing scores you.', links: next('STEP_3') },
  { name: 'STEP_3', pid: '4', text: '### Step 3: Hand it over\n\nTap **Hand it to Oriel**, name what would block you, and tap **Put it in Oriel\'s hand**. Confirm Oriel does not start before that tap and that the friends are quiet while Oriel plays.', links: next('STEP_4') },
  { name: 'STEP_4', pid: '5', text: '### Step 4: Oriel plays it home\n\nConfirm Oriel picks up from your last note at your pace, five seals light above Oriel, the view swings so your back does not cover Oriel, and the song ends on the home note.', links: next('STEP_5') },
  { name: 'STEP_5', pid: '6', text: '### Step 5: The silence and the laugh\n\nConfirm a silence of about a second and a half after the last note, and only then do the friends laugh. Play again with different notes: the laugh must come the same way.', links: next('STEP_6') },
  { name: 'STEP_6', pid: '7', text: '### Step 6: Take it home\n\nConfirm the last card names this week\'s capability and key, names the energy you tagged, asks for no name, and offers two buttons.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nSomething off? Say which step, what you heard or saw, and what phone you used, so it can be fixed before the first player.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '9', text: 'Verified: you can sit at the fire, play your own notes, hand them to Oriel and carry the week\'s step home. The episode\'s road home is ready for a first player. Complete this quest for your vibeulon.', links: [] },
]

async function seed() {
  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const title = 'Certification: The Friends\' Fire V1'
  const description = 'Verify the Friends\' Fire: sit, play your notes on five seals, hand them to Oriel, hear the song played home, and take the week\'s step with you.'
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages: PASSAGES })
  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: { title, parsedJson, isPublished: true },
    create: { title, slug: SLUG, sourceType: 'manual_seed', sourceText: 'Friends\' Fire certification (seed-cert-ctw-friends-fire.ts)', parsedJson, isPublished: true, createdById: creator.id },
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
