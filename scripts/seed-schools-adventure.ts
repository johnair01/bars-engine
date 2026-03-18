/**
 * Seed Game Master Schools Adventure (Phase 2C + Phase 3)
 *
 * Creates one shared Adventure with 6 entry passages (Shaman, Challenger, Regent,
 * Architect, Diplomat, Sage). Each school has:
 * - Intro passage → Room (branch node with 4 moves)
 * - Room: Wake Up → 321, Clean Up → EFA, Grow Up → Practice, Show Up → returnTo
 * - Practice: deeper stub with Back → Room (recursive structure)
 *
 * Run: npm run seed:schools-adventure
 * Then: npm run seed:portal-adventure to link instance.schoolsAdventureId
 */

import './require-db-env'
import { db } from '../src/lib/db'

const SLUG = 'game-master-schools'
const TITLE = 'Game Master Schools'

const GM_FACES = [
  { key: 'shaman', name: 'Shaman', nodeId: 'Schools_Shaman', roomId: 'Room_Shaman', practiceId: 'Practice_Shaman', theme: 'Threshold, emergence, Wake Up' },
  { key: 'challenger', name: 'Challenger', nodeId: 'Schools_Challenger', roomId: 'Room_Challenger', practiceId: 'Practice_Challenger', theme: 'Friction, edge, Clean Up' },
  { key: 'regent', name: 'Regent', nodeId: 'Schools_Regent', roomId: 'Room_Regent', practiceId: 'Practice_Regent', theme: 'Order, rules, Show Up' },
  { key: 'architect', name: 'Architect', nodeId: 'Schools_Architect', roomId: 'Room_Architect', practiceId: 'Practice_Architect', theme: 'Structure, blueprint, Grow Up' },
  { key: 'diplomat', name: 'Diplomat', nodeId: 'Schools_Diplomat', roomId: 'Room_Diplomat', practiceId: 'Practice_Diplomat', theme: 'Relational, invitation' },
  { key: 'sage', name: 'Sage', nodeId: 'Schools_Sage', roomId: 'Room_Sage', practiceId: 'Practice_Sage', theme: 'Integration, the whole' },
] as const

// Phase 3: Branch node 4 moves (same as portal rooms)
const SCHOOL_ROOM_CHOICES = (practiceId: string) => [
  { text: 'Wake Up — See what\'s emerging', targetId: 'redirect:/shadow/321' },
  { text: 'Clean Up — Tend to what blocks you', targetId: 'redirect:/emotional-first-aid' },
  { text: 'Grow Up — Deeper practice', targetId: practiceId },
  { text: 'Show Up — Return to room', targetId: 'redirect:returnTo' },
]

async function seed() {
  console.log('--- Seeding Game Master Schools Adventure (Phase 3) ---')

  const adventure = await db.adventure.upsert({
    where: { slug: SLUG },
    update: {
      title: TITLE,
      status: 'ACTIVE',
      startNodeId: 'Schools_Entry',
      description: '6-face schools CYOA. Each face has a branch node with 4 moves (recursive).',
    },
    create: {
      slug: SLUG,
      title: TITLE,
      status: 'ACTIVE',
      startNodeId: 'Schools_Entry',
      description: '6-face schools CYOA. Each face has a branch node with 4 moves (recursive).',
      visibility: 'PUBLIC_ONBOARDING',
    },
  })

  console.log(`✅ Adventure: ${adventure.title} (${adventure.slug})`)

  let created = 0
  let updated = 0

  // Entry passage: 6 choices (pick your school)
  const entryText = `**Game Master Schools**

Choose a school to study. Each face offers a different path of growth.

- **Shaman** — Threshold, emergence, Wake Up
- **Challenger** — Friction, edge, Clean Up
- **Regent** — Order, rules, Show Up
- **Architect** — Structure, blueprint, Grow Up
- **Diplomat** — Relational, invitation
- **Sage** — Integration, the whole`

  const entryChoices = GM_FACES.map((f) => ({ text: f.name, targetId: f.nodeId }))
  const entryChoicesJson = JSON.stringify(entryChoices)

  const entryExisting = await db.passage.findUnique({
    where: { adventureId_nodeId: { adventureId: adventure.id, nodeId: 'Schools_Entry' } },
  })
  if (entryExisting) {
    await db.passage.update({
      where: { id: entryExisting.id },
      data: { text: entryText, choices: entryChoicesJson },
    })
    updated++
  } else {
    await db.passage.create({
      data: { adventureId: adventure.id, nodeId: 'Schools_Entry', text: entryText, choices: entryChoicesJson },
    })
    created++
  }

  // Phase 3: Each school = intro → room (branch) → practice (Grow Up)
  async function upsertPassage(
    advId: string,
    nodeId: string,
    text: string,
    choices: { text: string; targetId: string }[]
  ) {
    const choicesJson = JSON.stringify(choices)
    const existing = await db.passage.findUnique({
      where: { adventureId_nodeId: { adventureId: advId, nodeId } },
    })
    if (existing) {
      await db.passage.update({ where: { id: existing.id }, data: { text, choices: choicesJson } })
      updated++
    } else {
      await db.passage.create({ data: { adventureId: advId, nodeId, text, choices: choicesJson } })
      created++
    }
  }

  for (const face of GM_FACES) {
    const introText = `**${face.name} School**

${face.theme}.

This school holds space for your growth. Enter the practice room when you're ready.`
    const introChoices = [{ text: 'Enter the practice room →', targetId: face.roomId }]
    await upsertPassage(adventure.id, face.nodeId, introText, introChoices)

    const roomText = `**${face.name} practice room**

What do you need right now? Choose your move:

- **Wake Up** — See what's emerging
- **Clean Up** — Tend to what blocks you
- **Grow Up** — Deeper practice in this school
- **Show Up** — Return to your room`
    const roomChoices = SCHOOL_ROOM_CHOICES(face.practiceId)
    await upsertPassage(adventure.id, face.roomId, roomText, roomChoices)

    const practiceText = `**Deeper ${face.name} practice**

You've chosen to go deeper. More structured practice paths coming in Phase 4.

For now, return to the practice room to choose another move.`
    const practiceChoices = [{ text: '← Back to practice room', targetId: face.roomId }]
    await upsertPassage(adventure.id, face.practiceId, practiceText, practiceChoices)
  }

  console.log(`✅ Passages: ${created} created, ${updated} updated`)

  // Link to instances that have portalAdventureId (e.g. bruised-banana)
  const instances = await db.instance.findMany({
    where: { portalAdventureId: { not: null } },
    select: { id: true, name: true, slug: true },
  })
  for (const inst of instances) {
    await db.instance.update({
      where: { id: inst.id },
      data: { schoolsAdventureId: adventure.id },
    })
    console.log(`✅ Linked instance "${inst.name}" (${inst.slug}) → schoolsAdventureId`)
  }

  if (instances.length === 0) {
    console.log('⚠ No instances with portalAdventureId. Run seed:portal-adventure first.')
  }

  console.log('✅ Game Master Schools Adventure seeded.')
}

seed().catch(console.error)
