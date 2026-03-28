/**
 * Seed Campaign Portal Adventure (Phase B: SCL — four moves on portal, face pick, Wake → library)
 *
 * Structure: 8 Portal (4 moves each) + face-pick nodes + gather stubs + shared emit + PostWake + Hub_Return.
 * Phase 2E face×move text still applies at emit nodes when `?face=` is present (from hub or in-flow picker).
 *
 * Run: npm run seed:portal-adventure [campaignRef]
 * Default: bruised-banana
 */

import './require-db-env'
import { db } from '../src/lib/db'
import {
  SCL_PORTAL_START_NODE_IDS,
  SCL_POST_WAKE_NODE,
  SCL_HUB_RETURN_NODE,
  buildPortalEntryChoices,
  buildFacePickChoices,
  buildPostWakeChoices,
} from '../src/lib/campaign-portal/portal-graph-contract'

// Phase 2D: Hexagram-flavored, invitation tone. No onboarding language.
const PORTAL_FLAVOR_TEMPLATES: Record<number, string> = {
  1: '**Portal 1** — The Creative Force\n\nThe hexagram speaks of beginnings. New energy stirs. **Choose your move** — Wake, Clean, Grow, or Show.',
  2: '**Portal 2** — The Receptive\n\nYielding and open, the earth receives. **Choose your move** — Wake, Clean, Grow, or Show.',
  3: '**Portal 3** — Difficulty at the Beginning\n\nChaos before order. **Choose your move** — Wake, Clean, Grow, or Show.',
  4: '**Portal 4** — Youthful Folly\n\nInnocence and learning. **Choose your move** — Wake, Clean, Grow, or Show.',
  5: '**Portal 5** — Waiting\n\nPatience in the right moment. **Choose your move** — Wake, Clean, Grow, or Show.',
  6: '**Portal 6** — Conflict\n\nTension seeks resolution. **Choose your move** — Wake, Clean, Grow, or Show.',
  7: '**Portal 7** — The Army\n\nDiscipline and order. **Choose your move** — Wake, Clean, Grow, or Show.',
  8: '**Portal 8** — Holding Together\n\nAlliance and unity. **Choose your move** — Wake, Clean, Grow, or Show.',
}

const GATHER_WAKE_TEXT = `**Gather (Wake)**

You chose **Wake Up** and a **Game Master face**. Before the BAR, here is a short **gather-resources** beat.

A full quest thread for this leg is still wiring up (SMB / CBS). This step is an honest placeholder: pause, notice what you are carrying, then name what is emerging in the BAR ahead.

When you are ready, continue to the Wake BAR.`

const GATHER_CLEAN_TEXT = `**Gather (Clean)**

You chose **Clean Up** and a **Game Master face**. Take a breath — a deeper gather-resources quest will attach here later.

Continue when you are ready to name what blocks flow in your BAR.`

const GATHER_SHOW_TEXT = `**Gather (Show)**

You chose **Show Up** and a **Game Master face**. A future quest-shaped beat will sit here; for now, this is a clear pause before your commitment BAR.

Continue when you are ready.`

const GM_FACE_PICK_INTRO = `**Which voice shapes this moment?**

Pick a **Game Master face**. Tone and BAR prompts follow this choice (you can return through the hub to try another path).`

const POST_WAKE_TEXT = `**After your Wake BAR**

Your Wake move is recorded. The **library** is the Regent-shaped home for quests and references — a natural next step.

Below are **honest** ways to help the residency (no automatic milestone ticks until BBMT wiring says so).`

// Room copy — kept for deep links to Room_* ; same topology as portal
const ROOM_TEXT = `**The room holds space for you.**

What kind of move do you want to make right now?`

function buildRoomChoices(_roomIndex: number) {
  return [
    { text: 'Wake Up — See what\'s emerging', targetId: 'WakeUp_Emit' },
    { text: 'Clean Up — Tend to what blocks you', targetId: 'CleanUp_Emit' },
    { text: 'Grow Up — Study at a school', targetId: 'schools' },
    { text: 'Show Up — Make a commitment', targetId: 'ShowUp_Emit' },
  ]
}

// Shared emit node definitions (face-neutral fallback when ?face= absent; runtime replaces with face×move when face set)
const EMIT_PASSAGES = [
  {
    nodeId: 'WakeUp_Emit',
    text: 'Take a moment to orient. What is becoming visible that was hidden before?\n\nName it in a BAR.',
    metadata: {
      actionType: 'bar_emit',
      blueprintKey: 'move_wakeUp',
      barTemplate: { defaultTitle: 'What I see emerging', defaultDescription: 'What became visible when I stepped in?' },
      nextTargetId: SCL_POST_WAKE_NODE,
    },
  },
  {
    nodeId: 'CleanUp_Emit',
    text: 'Something is blocking flow. What charge are you ready to metabolize?\n\nName it in a BAR.',
    metadata: {
      actionType: 'bar_emit',
      blueprintKey: 'move_cleanUp',
      barTemplate: { defaultTitle: 'What is blocking me', defaultDescription: 'What would unblock my flow right now?' },
      nextTargetId: SCL_HUB_RETURN_NODE,
    },
  },
  {
    nodeId: 'ShowUp_Emit',
    text: 'You are ready to make a move. Name the specific commitment you are making.\n\nCapture it as a BAR.',
    metadata: {
      actionType: 'bar_emit',
      blueprintKey: 'move_showUp',
      barTemplate: { defaultTitle: 'My commitment', defaultDescription: 'The specific action I am committing to.' },
      nextTargetId: SCL_HUB_RETURN_NODE,
    },
  },
]

async function upsertPassage(
  adventureId: string,
  nodeId: string,
  data: { text: string; choices: string; metadata?: object | null },
  counters: { created: number; updated: number },
) {
  const existing = await db.passage.findUnique({
    where: { adventureId_nodeId: { adventureId, nodeId } },
  })
  if (existing) {
    await db.passage.update({
      where: { id: existing.id },
      data: {
        text: data.text,
        choices: data.choices,
        ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
      },
    })
    counters.updated++
  } else {
    await db.passage.create({
      data: {
        adventureId,
        nodeId,
        text: data.text,
        choices: data.choices,
        ...(data.metadata != null ? { metadata: data.metadata } : {}),
      },
    })
    counters.created++
  }
}

async function seed(campaignRef: string) {
  console.log(`--- Seeding Campaign Portal Adventure: ${campaignRef} ---`)

  const slug = `campaign-portal-${campaignRef}`
  const title = `Campaign Portals: ${campaignRef}`

  const adventure = await db.adventure.upsert({
    where: { slug },
    update: {
      title,
      status: 'ACTIVE',
      startNodeId: 'Portal_1',
      campaignRef,
      description: `8 portals (4 moves on entry) + face pick + gather stubs + emit + PostWake (Wake). Campaign ${campaignRef}.`,
    },
    create: {
      slug,
      title,
      status: 'ACTIVE',
      startNodeId: 'Portal_1',
      campaignRef,
      description: `8 portals (4 moves on entry) + face pick + gather stubs + emit + PostWake (Wake). Campaign ${campaignRef}.`,
      visibility: 'PUBLIC_ONBOARDING',
    },
  })

  console.log(`✅ Adventure: ${adventure.title} (${adventure.slug})`)

  const counters = { created: 0, updated: 0 }

  const portalChoicesJson = JSON.stringify(buildPortalEntryChoices())

  // 8 Portal passages — four moves on entry (SCL-B1)
  for (let i = 1; i <= 8; i++) {
    const nodeId = `Portal_${i}`
    const text = PORTAL_FLAVOR_TEMPLATES[i] ?? `**Portal ${i}** — The path awaits. **Choose your move** — Wake, Clean, Grow, or Show.`
    await upsertPassage(
      adventure.id,
      nodeId,
      { text, choices: portalChoicesJson },
      counters,
    )
  }

  // Face pick (SCL-B4a) + Grow → schools
  await upsertPassage(
    adventure.id,
    'GM_FacePick_wakeUp',
    { text: GM_FACE_PICK_INTRO, choices: JSON.stringify(buildFacePickChoices('Gather_Wake')) },
    counters,
  )
  await upsertPassage(
    adventure.id,
    'GM_FacePick_cleanUp',
    { text: GM_FACE_PICK_INTRO, choices: JSON.stringify(buildFacePickChoices('Gather_Clean')) },
    counters,
  )
  await upsertPassage(
    adventure.id,
    'GM_FacePick_showUp',
    { text: GM_FACE_PICK_INTRO, choices: JSON.stringify(buildFacePickChoices('Gather_Show')) },
    counters,
  )
  await upsertPassage(
    adventure.id,
    'GM_FacePick_growUp',
    { text: GM_FACE_PICK_INTRO, choices: JSON.stringify(buildFacePickChoices('schools')) },
    counters,
  )

  // Gather stubs (SCL-B9)
  await upsertPassage(
    adventure.id,
    'Gather_Wake',
    {
      text: GATHER_WAKE_TEXT,
      choices: JSON.stringify([{ text: 'Continue to Wake BAR →', targetId: 'WakeUp_Emit' }]),
    },
    counters,
  )
  await upsertPassage(
    adventure.id,
    'Gather_Clean',
    {
      text: GATHER_CLEAN_TEXT,
      choices: JSON.stringify([{ text: 'Continue to Clean Up BAR →', targetId: 'CleanUp_Emit' }]),
    },
    counters,
  )
  await upsertPassage(
    adventure.id,
    'Gather_Show',
    {
      text: GATHER_SHOW_TEXT,
      choices: JSON.stringify([{ text: 'Continue to Show Up BAR →', targetId: 'ShowUp_Emit' }]),
    },
    counters,
  )

  // Post-wake bridge: library + honest campaign links (SCL-B2, B5)
  await upsertPassage(
    adventure.id,
    'PostWake_Library',
    { text: POST_WAKE_TEXT, choices: JSON.stringify(buildPostWakeChoices()) },
    counters,
  )

  // 8 Room passages (legacy / alternate entry)
  for (let i = 1; i <= 8; i++) {
    const nodeId = `Room_${i}`
    const roomChoicesJson = JSON.stringify(buildRoomChoices(i))
    await upsertPassage(
      adventure.id,
      nodeId,
      { text: ROOM_TEXT, choices: roomChoicesJson },
      counters,
    )
  }

  for (const ep of EMIT_PASSAGES) {
    await upsertPassage(
      adventure.id,
      ep.nodeId,
      { text: ep.text, choices: '[]', metadata: ep.metadata },
      counters,
    )
  }

  const hubReturnNodeId = SCL_HUB_RETURN_NODE
  const hubReturnChoices = JSON.stringify([])
  const hubReturnText = 'Your response has been captured.\n\nYour seed has been planted.'
  await upsertPassage(
    adventure.id,
    hubReturnNodeId,
    { text: hubReturnText, choices: hubReturnChoices },
    counters,
  )

  for (let i = 1; i <= 8; i++) {
    const nodeId = `Schools_${i}`
    const existing = await db.passage.findUnique({
      where: { adventureId_nodeId: { adventureId: adventure.id, nodeId } },
    })
    if (existing) {
      await db.passage.delete({ where: { id: existing.id } })
      console.log(`  Removed placeholder ${nodeId}`)
    }
  }

  const legacyNodeIds = ['WakeUp_1', 'CleanUp_1', 'Schools_Entry']
  for (const nodeId of legacyNodeIds) {
    const existing = await db.passage.findUnique({
      where: { adventureId_nodeId: { adventureId: adventure.id, nodeId } },
    })
    if (existing) {
      await db.passage.delete({ where: { id: existing.id } })
      console.log(`  Removed legacy passage ${nodeId}`)
    }
  }

  console.log(`✅ Passages: ${counters.created} created, ${counters.updated} updated`)

  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
  })
  if (instance) {
    await db.instance.update({
      where: { id: instance.id },
      data: { portalAdventureId: adventure.id },
    })
    console.log(`✅ Linked instance "${instance.name}" (${instance.slug}) → portalAdventureId`)
  } else {
    console.log(`⚠ No instance with campaignRef=${campaignRef} found. Run for each campaign.`)
  }

  console.log('✅ Campaign Portal Adventure seeded.')
  console.log(`   Start node IDs: ${SCL_PORTAL_START_NODE_IDS.join(', ')}`)
}

const campaignRef = process.argv[2] ?? 'bruised-banana'
seed(campaignRef).catch(console.error)
