#!/usr/bin/env npx tsx
/**
 * Seed the CYOA_INTAKE adventure for Bruised Banana (Apr 2026 residency).
 *
 *   npx tsx scripts/with-env.ts "npx tsx scripts/seed-cyoa-intake-bruised-banana.ts"
 *
 * Stable slug: bb-cyoa-intake-apr2026
 * Player URL:  /cyoa-intake/<id>
 *
 * What this creates:
 *   1. CYOA_INTAKE Adventure with EXAMPLE_INTAKE_TEMPLATE routing weights
 *   2. Three branching passages + one BB-flavored terminal passage
 *   3. Pre-warms the 4 most likely (gmFace × moveType) spoke combinations
 *      so April 4/5 players get zero-latency spoke generation.
 *
 * Idempotent — safe to re-run; upserts by slug.
 */
import './require-db-env'
import { db } from '../src/lib/db'
import { EXAMPLE_INTAKE_TEMPLATE } from '../src/lib/cyoa-intake/seed'
import { findOrGenerateSpokeAdventure } from '../src/lib/cyoa-intake/spoke-generator'
import type { GmFaceKey, IntakeMoveType } from '../src/lib/cyoa-intake/types'

const SLUG = 'bb-cyoa-intake-apr2026'
const CAMPAIGN_REF = 'bruised-banana'

const TITLE = 'Bruised Banana Residency — Where Are You Arriving From?'

const DESCRIPTION = [
  'Bruised Banana is a Portland-based arts residency and community building two live events in April 2026:',
  'a dance night on April 4 (public, strangers welcome, low-pressure high-signal) and a',
  'collaborators day on April 5 (scheming, building, momentum). The community is small,',
  'real, and oriented around people who make things together — music, art, action.',
  'This intake routes each player into a personalized adventure shaped to where they are arriving from.',
].join(' ')

// BB-specific terminal passage replacing the generic "You're ready" text
const BB_TERMINAL_TEXT = [
  "You've named where you're arriving from.",
  'The residency is real — two nights, one community, and whatever you bring into the room.',
  'Your path forward is taking shape.',
].join(' ')

// The 4 most likely (gmFace × moveType) combinations for an arts community event.
// Pre-generate so April 4/5 players hit cache, not AI latency.
const PREWARM: Array<{ gmFace: GmFaceKey; moveType: IntakeMoveType }> = [
  { gmFace: 'diplomat', moveType: 'showUp' },   // showing up for the collective (most common)
  { gmFace: 'shaman',   moveType: 'wakeUp' },   // threshold-crossing arrival
  { gmFace: 'challenger', moveType: 'showUp' }, // action-oriented presence
  { gmFace: 'diplomat', moveType: 'growUp' },   // here to build something together
]

async function main() {
  console.log(`\nSeeding CYOA_INTAKE for ${CAMPAIGN_REF}…`)

  // ── 1. Upsert the Adventure ────────────────────────────────────────────────
  const existing = await db.adventure.findFirst({
    where: { slug: SLUG },
    select: { id: true },
  })

  const template = {
    ...EXAMPLE_INTAKE_TEMPLATE,
    // Replace generic terminal text with BB-specific welcome
    passages: EXAMPLE_INTAKE_TEMPLATE.passages.map((p) =>
      p.isTerminal ? { ...p, text: BB_TERMINAL_TEXT } : p,
    ),
  }

  let adventure: { id: string }

  if (existing) {
    adventure = existing
    // Update playbookTemplate + description in case they changed
    await db.adventure.update({
      where: { id: existing.id },
      data: {
        title: TITLE,
        description: DESCRIPTION,
        playbookTemplate: JSON.stringify(template),
        status: 'ACTIVE',
      },
    })
    console.log(`  ↻ Updated existing adventure ${existing.id}`)
  } else {
    adventure = await db.adventure.create({
      data: {
        slug: SLUG,
        title: TITLE,
        description: DESCRIPTION,
        adventureType: 'CYOA_INTAKE',
        campaignRef: CAMPAIGN_REF,
        status: 'ACTIVE',
        startNodeId: template.startNodeId,
        playbookTemplate: JSON.stringify(template),
        passages: {
          create: template.passages.map((p) => ({
            nodeId: p.nodeId,
            text: p.text,
            choices: JSON.stringify(
              p.choices.map((c) => ({
                text: c.text,
                targetId: c.targetId,
                choiceKey: c.choiceKey,
                // routing stripped — never exposed to client
              })),
            ),
            ...(p.isTerminal ? { metadata: { isTerminal: true } } : {}),
          })),
        },
      },
      select: { id: true },
    })
    console.log(`  ✓ Created adventure ${adventure.id} (slug: ${SLUG})`)
  }

  console.log(`  Player URL: /cyoa-intake/${adventure.id}`)

  // ── 2. Pre-warm spoke adventures ──────────────────────────────────────────
  console.log(`\nPre-warming ${PREWARM.length} spoke combinations…`)

  for (const { gmFace, moveType } of PREWARM) {
    const label = `${gmFace}/${moveType}`
    process.stdout.write(`  ${label}… `)
    try {
      const result = await findOrGenerateSpokeAdventure(gmFace, moveType, CAMPAIGN_REF)
      if (!result) {
        console.log('✗ generation failed (null)')
      } else if (result.generated) {
        console.log(`✓ generated → ${result.adventureId}`)
      } else {
        console.log(`↻ already cached → ${result.adventureId}`)
      }
    } catch (err) {
      console.log(`✗ error: ${(err as Error).message}`)
    }
  }

  console.log('\nDone.\n')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
