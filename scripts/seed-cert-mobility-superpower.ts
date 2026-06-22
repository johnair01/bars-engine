import './require-db-env'
import { db } from '../src/lib/db'

/**
 * Verification quests for the Mobility Quest superpower campaign (T4.7 / FR8/FR13).
 * Twine + CustomBar certs, isSystem + public, deterministic ids, idempotent.
 * Framed toward the MtGoA Launch + Barn Raising fundraiser.
 *
 *   - cert-superpower-quiz-v1     — discover your superpower (the intake)
 *   - cert-mobility-superpower-v1 — discover → claim a matched need → complete
 *
 * Run: npm run seed:cert:superpower (after db:migrate:deploy + seed:mobility-quest)
 */
type Passage = { name: string; pid: string; text: string; links: { label: string; target: string }[]; tags?: string[] }

const QUIZ_SLUG = 'cert-superpower-quiz-v1'
const MOBILITY_SLUG = 'cert-mobility-superpower-v1'
const SPEC = '.specify/specs/mobility-quest-superpower-campaign/spec.md'

const QUIZ_PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify the **Superpower discovery quiz** — the intake that helps a guest learn which allyship superpower they bring to the Mobility Quest. Complete each step, then finish to mint your reward.', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: '### Step 1: Open the quiz\n\n[Open /superpower](/superpower). Confirm it loads with **no sign-up / email gate**, a progress indicator, and the first forced-choice question.', links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'STEP_2', pid: '3', text: '### Step 2: Answer through\n\nAnswer the 12 questions, then the final **orientation** question ("where does the work want to happen?"). Confirm Back works and progress advances.', links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'STEP_3', pid: '4', text: '### Step 3: The reveal\n\nConfirm the result shows a **primary + secondary** superpower, a **margin band**, the primary\'s **shadow** (not just flattery), the full spectrum, and the **"a reading, not a sentence"** framing. Still **no email gate**.', links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'STEP_4', pid: '5', text: '### Step 4: You are the authority\n\nConfirm the **"try the adjacent one"** nudge names your secondary, and that retaking the quiz is offered. The result reads as a lens, never a verdict.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nSomething off? Describe what you encountered so we can fix it before the launch party.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '6', text: 'Verified: guests can discover their superpower cleanly. One more piece of the Mobility Quest ready for the **MtGoA Launch + Barn Raising**. Complete this quest for your vibeulon.', links: [] },
]

const MOBILITY_PASSAGES: Passage[] = [
  { name: 'START', pid: '1', text: 'Verify the **Mobility Quest tiered-donation loop** end-to-end: discover a superpower, then use it to move a real campaign milestone forward (gathering resources for an accessible vehicle, so the book tour can reach its people). Framed toward the **MtGoA Launch + Barn Raising**.', links: [{ label: 'Begin', target: 'STEP_1' }] },
  { name: 'STEP_1', pid: '2', text: '### Step 1: Discover your superpower\n\n[Take the quiz](/superpower). Note your **primary** superpower (e.g. Connector). Signed in, your result is saved to your campaign membership.', links: [{ label: 'Next', target: 'STEP_2' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'STEP_2', pid: '3', text: '### Step 2: See your matched needs\n\n[Open the campaign needs board](/campaign/mobility-quest/needs). Confirm the **progress header** shows *Help the world* (external) and *Inner work* (internal) as **separate tracks**, and a **Tier 1 "Ways only a {Lens} can help"** hand of cards matched to your superpower.', links: [{ label: 'Next', target: 'STEP_3' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'STEP_3', pid: '4', text: '### Step 3: Claim a need\n\nOn a matched (open) card, tap **"I\'ll take this"**. Confirm it becomes **claimed by you** — the card shows the **Release** + **Done — log it** bar and a "Claimed by you" pill.', links: [{ label: 'Next', target: 'STEP_4' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'STEP_4', pid: '5', text: '### Step 4: Complete it\n\nTap **"Done — log it"**. Confirm the matching **external progress bar ticks up** by the right unit ($ / hrs / action) — and that **no points or rank** are ever shown. "That moved the milestone."', links: [{ label: 'Next', target: 'STEP_5' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'STEP_5', pid: '6', text: '### Step 5: Other ways to help\n\nExpand **"Other ways to help"** (Tier 2). Confirm unmatched open needs appear as collapsed cards that expand on tap. Help is offered, never coerced.', links: [{ label: 'Complete verification', target: 'END_SUCCESS' }, { label: 'Report Issue', target: 'FEEDBACK' }] },
  { name: 'FEEDBACK', pid: '8', text: '### Report an Issue\n\nDescribe anything that broke the loop so we can fix it before the residency send-off.', links: [], tags: ['feedback'] },
  { name: 'END_SUCCESS', pid: '7', text: 'Verified: a person can discover their superpower and turn it into a scoped act that visibly moves the Mobility Quest forward. The needle moves. Complete this quest for your vibeulon.', links: [] },
]

async function seedCert(slug: string, title: string, description: string, passages: Passage[], createdById: string) {
  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages })
  const story = await db.twineStory.upsert({
    where: { slug },
    update: { title, parsedJson, isPublished: true },
    create: { title, slug, sourceType: 'manual_seed', sourceText: 'Mobility Quest superpower certification (seed-cert-mobility-superpower.ts)', parsedJson, isPublished: true, createdById },
  })
  const quest = await db.customBar.upsert({
    where: { id: slug },
    update: { title, description, reward: 1, twineStoryId: story.id, status: 'active', visibility: 'public', isSystem: true, backlogPromptPath: SPEC },
    create: { id: slug, title, description, creatorId: createdById, reward: 1, twineStoryId: story.id, status: 'active', visibility: 'public', isSystem: true, backlogPromptPath: SPEC },
  })
  console.log(`✅ ${quest.title} (${quest.id})`)
}

async function seed() {
  console.log('--- Seeding Mobility Quest superpower certification quests ---')
  const ids = [QUIZ_SLUG, MOBILITY_SLUG]
  await db.playerQuest.deleteMany({ where: { questId: { in: ids } } })
  await db.twineRun.deleteMany({ where: { questId: { in: ids } } })

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')

  await seedCert(QUIZ_SLUG, 'Certification: Superpower Discovery Quiz V1', 'Verify the superpower discovery intake: no email gate, 12 questions + orientation, and an honest primary+secondary+shadow reveal.', QUIZ_PASSAGES, creator.id)
  await seedCert(MOBILITY_SLUG, 'Certification: Mobility Quest Superpower Loop V1', 'Verify the tiered-donation loop: discover a superpower, claim a matched milestone need, complete it, and watch the milestone advance — no points, no rank.', MOBILITY_PASSAGES, creator.id)

  console.log('✅ Mobility Quest certification quests seeded.')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
