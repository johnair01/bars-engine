#!/usr/bin/env tsx
/**
 * Seed chained initiation adventure: intro + character creation + moves/GM.
 * Run: npm run seed:chained-initiation
 * @see .specify/specs/auto-flow-chained-initiation/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { compileStoryIntroPacket } from '../src/lib/quest-grammar/storyIntroPacket'
import { compileCharacterCreationPacket } from '../src/lib/quest-grammar/characterCreationPacket'
import { compileMovesGMPacket } from '../src/lib/quest-grammar/movesGMPacket'
import { publishChainedInitiationAdventure } from '../src/actions/quest-grammar'

const SLUG = 'bruised-banana-initiation-player'

async function main() {
  console.log('--- Seeding Chained Initiation Adventure ---')

  const [nations, playbooks] = await Promise.all([
    db.nation.findMany({
      where: { archived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.playbook.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const charPacket = compileCharacterCreationPacket({
    segment: 'player',
    nations: nations.map((n) => ({ id: n.id, name: n.name })),
    playbooks: playbooks.map((p) => ({ id: p.id, name: p.name })),
  })

  const movesGMPacket = compileMovesGMPacket({ segment: 'player' })

  // Lore-immersive story intro (Conclave/heist) per DI spec
  const introPacket = compileStoryIntroPacket({ segment: 'player' })

  const result = await publishChainedInitiationAdventure(
    introPacket,
    charPacket,
    movesGMPacket,
    SLUG,
    { campaignRef: 'bruised-banana', skipAdminCheck: true }
  )

  if (result.error) {
    console.error('Failed:', result.error)
    process.exit(1)
  }

  console.log(`✅ Chained initiation published: ${SLUG}`)
  console.log(`   Adventure ID: ${result.adventureId}`)
  console.log(`   Passages: ${result.passageCount}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
