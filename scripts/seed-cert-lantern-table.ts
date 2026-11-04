import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for the lantern table (bars-engine .specify/specs/lantern-table, FR-016, T011): a brass machine the
 * player sits at to dissolve a real block, first dealt from the TDT director application block. Twine + CustomBar cert,
 * isSystem + public, deterministic id, idempotent (an upsert; a tester's progress is kept).
 *
 * Run: npm run seed:cert:lantern-table (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-lantern-table-v1'
const SPEC = '.specify/specs/lantern-table/spec.md'
const PAGE = '/lantern'
const next = (target: string) => [{ label: 'Next', target }, { label: 'Report Issue', target: 'FEEDBACK' }]

const PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify the **lantern table**: you sit at a hex table in the lantern hall and set a real block into a brass machine with your hands, then dissolve it a move at a time. The first table is dealt from the TDT director application block. Nothing on the table is a card or a form; every step is an object you work.', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: `### Step 1: The hall\n\n[Open the lantern hall](${PAGE}). Confirm you stand in the Dusk hollow near an empty hex table with a brass rim, and that two other tables carry pale figures whose lanterns are tagged as stand-ins, not players.`, links: next('STEP_2') },
  { name: 'STEP_2', pid: '3', text: '### Step 2: Sit\n\nTap the stool. Your walker sits, and the view settles over your right shoulder with the lantern hanging over the board.', links: next('STEP_3') },
  { name: 'STEP_3', pid: '4', text: '### Step 3: Set the block with your hands\n\nStamp the brass plate at the far edge, turn the ring round the well, turn the lever\'s foot and pull the lever (the lead weight swings), flip the toggles on the near rim (each plate names its channel), press cells so stones rise, and tap stones to click their collars up: foot Minor, belly Medium, shoulder Major. A cell left down is dealt in fog.', links: next('STEP_4') },
  { name: 'STEP_4', pid: '5', text: '### Step 4: The three sliders\n\nBeside the stamped plate, move the Size, Charge and Deadline sliders. Confirm the purse of coins beside them grows and shrinks, and the table says the block\'s starting size and its payout in vibeulons.', links: next('STEP_5') },
  { name: 'STEP_5', pid: '6', text: '### Step 5: Deal and play a watch\n\nTap the well. The camera rises from the seat to straight down in about a second with no cut. Tap a stone for a basic move; lift the seal on the left shelf, turn it to a kind and press it on a stone for your BAR. Spend all four oil lamps, then tap a stone again to spend a vibeulon on a basic move. If you hold five vibeulons, confirm a fifth purchase in one watch is refused. Confirm that turning the hourglass grows the stones you left alone.', links: next('STEP_6') },
  { name: 'STEP_6', pid: '7', text: '### Step 6: Dissolve and get paid\n\nStrike one keep until it sinks into its cell under a gold ring. When every stone that came out of the fog has dissolved, confirm the table names each hand\'s share of the payout.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nSomething off? Describe what you saw, and on which device, so the table can be fixed before Wendell plays the director block on it.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '9', text: 'Verified: a block can be set into the brass machine by hand, played down with oil and vibeulons, and paid out by what each hand dealt. Complete this quest for your vibeulon.', links: [] },
]

async function seed() {
  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const title = 'Certification: The Lantern Table V1'
  const description = 'Verify the lantern table: sit, set the director block into the brass machine by hand, set the three sliders, deal, play a watch with oil and vibeulons, and dissolve a keep.'
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages: PASSAGES })
  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: { title, parsedJson, isPublished: true },
    create: { title, slug: SLUG, sourceType: 'manual_seed', sourceText: 'Lantern table certification (seed-cert-lantern-table.ts)', parsedJson, isPublished: true, createdById: creator.id },
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
