/**
 * Seed Campaign Portal Adventure (Phase 2E: Face × Move)
 *
 * Structure: 8 Portal + 8 Room + 3 shared Emit + 1 Hub_Return = 20 passages.
 *
 * Room choices now route to shared emit nodes (WakeUp_Emit, CleanUp_Emit, ShowUp_Emit).
 * The API route injects face-specific text + barTemplate at runtime via ?face= param.
 * Face is passed from CampaignHubView → AdventurePlayer → node fetch URL.
 *
 * Run: npm run seed:portal-adventure [campaignRef]
 * Default: bruised-banana
 */

import './require-db-env'
import { db } from '../src/lib/db'

const PORTAL_START_NODE_IDS = ['Portal_1', 'Portal_2', 'Portal_3', 'Portal_4', 'Portal_5', 'Portal_6', 'Portal_7', 'Portal_8']

// Phase 2D: Hexagram-flavored, invitation tone. No onboarding language.
const PORTAL_FLAVOR_TEMPLATES: Record<number, string> = {
  1: '**Portal 1** — The Creative Force\n\nThe hexagram speaks of beginnings. New energy stirs. Enter when you\'re ready.',
  2: '**Portal 2** — The Receptive\n\nYielding and open, the earth receives. Wisdom flows through receptivity. Enter when you\'re ready.',
  3: '**Portal 3** — Difficulty at the Beginning\n\nChaos before order. The first steps matter. Enter when you\'re ready.',
  4: '**Portal 4** — Youthful Folly\n\nInnocence and learning. Mistakes teach. Enter when you\'re ready.',
  5: '**Portal 5** — Waiting\n\nPatience in the right moment. Readiness matters. Enter when you\'re ready.',
  6: '**Portal 6** — Conflict\n\nTension seeks resolution. Clarity emerges from struggle. Enter when you\'re ready.',
  7: '**Portal 7** — The Army\n\nDiscipline and order. Collective strength. Enter when you\'re ready.',
  8: '**Portal 8** — Holding Together\n\nAlliance and unity. We are stronger together. Enter when you\'re ready.',
}

// Room copy — intentionally sparse. Move choices carry the weight.
const ROOM_TEXT = `**The room holds space for you.**

What kind of move do you want to make right now?`

// Phase 2E: Rooms route to shared emit nodes (face-aware at runtime) or schools
function buildRoomChoices(_roomIndex: number) {
  return [
    { text: 'Wake Up — See what\'s emerging', targetId: 'WakeUp_Emit' },
    { text: 'Clean Up — Tend to what blocks you', targetId: 'CleanUp_Emit' },
    { text: 'Grow Up — Study at a school', targetId: 'schools' },
    { text: 'Show Up — Make a commitment', targetId: 'ShowUp_Emit' },
  ]
}

// Shared emit node definitions (face-neutral fallback text; runtime replaces with face-specific content)
const EMIT_PASSAGES = [
  {
    nodeId: 'WakeUp_Emit',
    text: 'Take a moment to orient. What is becoming visible that was hidden before?\n\nName it in a BAR.',
    metadata: {
      actionType: 'bar_emit',
      blueprintKey: 'move_wakeUp',
      barTemplate: { defaultTitle: 'What I see emerging', defaultDescription: 'What became visible when I stepped in?' },
      nextTargetId: 'Hub_Return',
    },
  },
  {
    nodeId: 'CleanUp_Emit',
    text: 'Something is blocking flow. What charge are you ready to metabolize?\n\nName it in a BAR.',
    metadata: {
      actionType: 'bar_emit',
      blueprintKey: 'move_cleanUp',
      barTemplate: { defaultTitle: 'What is blocking me', defaultDescription: 'What would unblock my flow right now?' },
      nextTargetId: 'Hub_Return',
    },
  },
  {
    nodeId: 'ShowUp_Emit',
    text: 'You are ready to make a move. Name the specific commitment you are making.\n\nCapture it as a BAR.',
    metadata: {
      actionType: 'bar_emit',
      blueprintKey: 'move_showUp',
      barTemplate: { defaultTitle: 'My commitment', defaultDescription: 'The specific action I am committing to.' },
      nextTargetId: 'Hub_Return',
    },
  },
]

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
      description: `8 portal entries + 8 room passages for campaign ${campaignRef}. Each portal leads to a room with 4 moves.`,
    },
    create: {
      slug,
      title,
      status: 'ACTIVE',
      startNodeId: 'Portal_1',
      campaignRef,
      description: `8 portal entries + 8 room passages for campaign ${campaignRef}. Each portal leads to a room with 4 moves.`,
      visibility: 'PUBLIC_ONBOARDING',
    },
  })

  console.log(`✅ Adventure: ${adventure.title} (${adventure.slug})`)

  let created = 0
  let updated = 0

  // 8 Portal passages
  for (let i = 1; i <= 8; i++) {
    const nodeId = `Portal_${i}`
    const text = PORTAL_FLAVOR_TEMPLATES[i] ?? `**Portal ${i}** — The path awaits. Enter to choose your move.`
    const choices = [{ text: 'Enter the room →', targetId: `Room_${i}` }]
    const choicesJson = JSON.stringify(choices)

    const existing = await db.passage.findUnique({
      where: { adventureId_nodeId: { adventureId: adventure.id, nodeId } },
    })

    if (existing) {
      await db.passage.update({
        where: { id: existing.id },
        data: { text, choices: choicesJson },
      })
      updated++
    } else {
      await db.passage.create({
        data: { adventureId: adventure.id, nodeId, text, choices: choicesJson },
      })
      created++
    }
  }

  // 8 Room passages (Phase 2B: each room has 4 moves with proper targets)
  for (let i = 1; i <= 8; i++) {
    const nodeId = `Room_${i}`
    const roomChoicesJson = JSON.stringify(buildRoomChoices(i))

    const existing = await db.passage.findUnique({
      where: { adventureId_nodeId: { adventureId: adventure.id, nodeId } },
    })

    if (existing) {
      await db.passage.update({
        where: { id: existing.id },
        data: { text: ROOM_TEXT, choices: roomChoicesJson },
      })
      updated++
    } else {
      await db.passage.create({
        data: {
          adventureId: adventure.id,
          nodeId,
          text: ROOM_TEXT,
          choices: roomChoicesJson,
        },
      })
      created++
    }
  }

  // Shared emit passages (WakeUp_Emit, CleanUp_Emit, ShowUp_Emit) + Hub_Return
  for (const ep of EMIT_PASSAGES) {
    const existing = await db.passage.findUnique({
      where: { adventureId_nodeId: { adventureId: adventure.id, nodeId: ep.nodeId } },
    })
    if (existing) {
      await db.passage.update({
        where: { id: existing.id },
        data: { text: ep.text, choices: '[]', metadata: ep.metadata },
      })
      updated++
    } else {
      await db.passage.create({
        data: { adventureId: adventure.id, nodeId: ep.nodeId, text: ep.text, choices: '[]', metadata: ep.metadata },
      })
      created++
    }
  }

  // Hub_Return passage
  const hubReturnNodeId = 'Hub_Return'
  const hubReturnExisting = await db.passage.findUnique({
    where: { adventureId_nodeId: { adventureId: adventure.id, nodeId: hubReturnNodeId } },
  })
  const hubReturnChoices = JSON.stringify([{ text: 'Return to the hub →', targetId: 'redirect:/campaign/hub' }])
  const hubReturnText = 'Your response has been captured.\n\nReturn to the campaign hub when you\'re ready.'
  if (hubReturnExisting) {
    await db.passage.update({
      where: { id: hubReturnExisting.id },
      data: { text: hubReturnText, choices: hubReturnChoices },
    })
    updated++
  } else {
    await db.passage.create({
      data: { adventureId: adventure.id, nodeId: hubReturnNodeId, text: hubReturnText, choices: hubReturnChoices },
    })
    created++
  }

  // Phase 2C: Grow Up → schools adventure (targetId "schools"). Remove old Schools_N placeholders.
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

  // Remove legacy placeholders if they exist (migrate from Phase 2A)
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

  console.log(`✅ Passages: ${created} created, ${updated} updated`)

  // Link Instance.portalAdventureId if instance exists
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
  console.log(`   Start node IDs: ${PORTAL_START_NODE_IDS.join(', ')}`)
}

const campaignRef = process.argv[2] ?? 'bruised-banana'
seed(campaignRef).catch(console.error)
