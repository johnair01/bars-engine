/**
 * Seed Campaign Portal Adventure (Phase 2A + 2B)
 *
 * Creates one Adventure per campaignRef with 8 portal entry passages (Portal_1 … Portal_8)
 * and 8 room passages (Room_1 … Room_8). Each Portal_N has hexagram-flavored text and
 * a single choice "Enter the room" → Room_N.
 *
 * Phase 2B: Each Room has 4 choices:
 * - Wake Up → redirect:/shadow/321 (with returnTo to lobby)
 * - Clean Up → redirect:/emotional-first-aid (with returnTo to lobby)
 * - Grow Up → schools (client navigates to schools adventure; Phase 2C)
 * - Show Up → redirect:/campaign/lobby
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

// Phase 2D: Warm, inviting room copy. No onboarding language.
const ROOM_TEXT = `**The room holds space for you.**

What do you need right now? Choose your move:

- **Wake Up** — See what's emerging
- **Clean Up** — Tend to what blocks you
- **Grow Up** — Study at a school
- **Show Up** — Return to the lobby`

// Phase 2B+2C: Wake Up → 321, Clean Up → EFA, Grow Up → schools (client navigates), Show Up → lobby
function buildRoomChoices(_roomIndex: number) {
  return [
    { text: 'Wake Up — See what\'s emerging', targetId: 'redirect:/shadow/321' },
    { text: 'Clean Up — Tend to what blocks you', targetId: 'redirect:/emotional-first-aid' },
    { text: 'Grow Up — Study at a school', targetId: 'schools' },
    { text: 'Show Up — Return to the lobby', targetId: 'redirect:/campaign/lobby' },
  ]
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
