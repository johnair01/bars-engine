import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quest for Friendcraft onboarding slice 1, a friend's own deck written in their book (Six-faces-council
 * spec .specify/specs/friendcraft-deck, FR-014). Twine + CustomBar cert, isSystem + public, deterministic id, idempotent
 * (an upsert; a tester's progress is kept).
 *
 * It also makes sure the `friendcraft` instance exists, so a steward's spark link can enrol a friend (T003). A steward
 * is a membership with `roleKey: "steward"`; this script never gives that role to anyone. Set FRIENDCRAFT_STEWARD to a
 * player's email or id to make that player the steward (Wendell's, once, before he sends the first link).
 *
 * Run: npm run seed:cert:friendcraft-deck (after db:migrate:deploy)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const SLUG = 'cert-friendcraft-deck-v1'
const SPEC = '.specify/specs/friendcraft-deck/spec.md'
const next = (target: string) => [{ label: 'Next', target }, { label: 'Report Issue', target: 'FEEDBACK' }]

const PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify the **friend\'s own deck**: a friend opens a steward\'s link, wakes in their nook, writes one goal in their book and words three cards under it. You need the steward\'s spark link and a browser with no account signed in (a private window works).', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: `### Step 1: Open the link signed out\n\nOpen the steward's spark link in a private window. Confirm the first screen says **Create your account**, with **Sign in** one tap away, not a Sign In form. Make the account.`, links: next('STEP_2') },
  { name: 'STEP_2', pid: '3', text: `### Step 2: The first minute\n\nConfirm you wake in your nook and the first minute plays as before. When the doorway opens, confirm the last line says **Your book waits on the low table: sit, and write what you want from a friend.**`, links: next('STEP_3') },
  { name: 'STEP_3', pid: '4', text: `### Step 3: Sit at the table\n\nWalk to the low table and sit. Confirm the book opens at a blank leaf that asks **What do you want from a friend?** with one ink line, and, if you wrote a hope at the mirror, that hope faint above the line with "Only you see this line."`, links: next('STEP_4') },
  { name: 'STEP_4', pid: '5', text: '### Step 4: Write a goal and three cards\n\nWrite a goal and press Enter. Word the **light** card, then the **middle**, then the **deep**, one at a time. Confirm the middle card shows one empty tea bowl, the deep two, and no number appears anywhere on the page.', links: next('STEP_5') },
  { name: 'STEP_5', pid: '6', text: '### Step 5: Add them to your deck\n\nConfirm the page says **Anyone you sit with can draw these.** Tap **Add these to my deck**. The book closes onto the table.', links: next('STEP_6') },
  { name: 'STEP_6', pid: '7', text: '### Step 6: Stand, sit again, write another\n\nStand, then sit again. Confirm the book opens at your goal page with its red ribbon and red tab. Tap **Write another**: a new blank leaf turns up. Rewrite a card on the first page, then clear one, and confirm both stick when you sit again.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nSomething off? Say which step, and what you saw on the page, so it can be fixed before the first link goes to a friend.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '9', text: 'Verified: a friend can open the link, write what they want from a friend and keep three cards in their own deck. Complete this quest for your vibeulon.', links: [] },
]

async function ensureInstance() {
  const instance = await db.instance.upsert({
    where: { slug: 'friendcraft' },
    update: {},
    create: { slug: 'friendcraft', name: 'Friendcraft', domainType: 'friendship' },
  })
  const who = process.env.FRIENDCRAFT_STEWARD
  if (who) {
    const player = await db.player.findFirst({ where: { OR: [{ id: who }, { account: { email: who } }] }, select: { id: true } })
    if (!player) throw new Error(`No player found for FRIENDCRAFT_STEWARD=${who}`)
    await db.instanceMembership.upsert({
      where: { instanceId_playerId: { instanceId: instance.id, playerId: player.id } },
      create: { instanceId: instance.id, playerId: player.id, roleKey: 'steward' },
      update: { roleKey: 'steward' },
    })
    console.log(`✅ steward set on the friendcraft instance (${player.id})`)
  } else {
    const n = await db.instanceMembership.count({ where: { instanceId: instance.id, roleKey: 'steward' } })
    console.log(`ℹ️  friendcraft instance ready; stewards: ${n}${n ? '' : ' (set FRIENDCRAFT_STEWARD to a player email or id to add one)'}`)
  }
}

async function seed() {
  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  await ensureInstance()
  const title = 'Certification: A Friend\'s Own Deck V1'
  const description = 'Verify Friendcraft slice 1: a friend opens a steward\'s link, writes one goal in their book and words three cards, light, middle and deep, into their own deck.'
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages: PASSAGES })
  const story = await db.twineStory.upsert({
    where: { slug: SLUG },
    update: { title, parsedJson, isPublished: true },
    create: { title, slug: SLUG, sourceType: 'manual_seed', sourceText: 'Friendcraft deck certification (seed-cert-friendcraft-deck.ts)', parsedJson, isPublished: true, createdById: creator.id },
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
