/**
 * Seed simulated players for NPC & Simulated Player Content Ecology.
 *
 * Creates N players with creatorType: 'agent', varied nation and archetype.
 * Use with simulateAgentGameLoop for testing and single-player populated world.
 *
 * Run: npx tsx scripts/with-env.ts "tsx scripts/seed-simulated-players.ts [count]"
 * Requires: DATABASE_URL (see docs/ENV_AND_VERCEL.md)
 */

import './require-db-env'
import { db } from '../src/lib/db'

const NATIONS = ['Argyra', 'Pyrakanth', 'Lamenth', 'Meridia', 'Virelune']
const ARCHETYPES = ['Bold Heart', 'Danger Walker', 'Truth Seer', 'Still Point', 'Subtle Influence', 'Devoted Guardian', 'Decisive Storm', 'Joyful Connector']

async function main() {
  const count = parseInt(process.argv[2] ?? '5', 10) || 5

  if (count < 1 || count > 50) {
    console.error('Usage: npx tsx scripts/seed-simulated-players.ts [count]')
    console.error('  count: 1–50 (default 5)')
    process.exit(1)
  }

  console.log(`--- Seeding ${count} simulated players ---`)

  const nations = await db.nation.findMany({ select: { id: true, name: true } })
  const archetypes = await db.archetype.findMany({ select: { id: true, name: true } })
  let agentInvite = await db.invite.findFirst({ where: { token: { startsWith: 'agent-sim-' } } })
  if (!agentInvite) {
    agentInvite = await db.invite.create({
      data: {
        token: `agent-sim-${Date.now()}`,
        status: 'active',
        maxUses: 999,
      },
    })
    console.log(`Created agent invite: ${agentInvite.token}`)
  }

  const nationIds = nations.map((n) => n.id)
  const archetypeIds = archetypes.map((a) => a.id)
  if (nationIds.length === 0 || archetypeIds.length === 0) {
    console.error('Need nations and archetypes seeded first. Run: make db-seed')
    process.exit(1)
  }

  let created = 0
  for (let i = 0; i < count; i++) {
    const nationId = nationIds[i % nationIds.length]
    const archetypeId = archetypeIds[i % archetypeIds.length]
    const nationName = nations.find((n) => n.id === nationId)?.name ?? 'Unknown'
    const archetypeName = archetypes.find((a) => a.id === archetypeId)?.name ?? 'Unknown'
    const name = `Simulated ${archetypeName} (${nationName}) #${i + 1}`

    const existing = await db.player.findFirst({
      where: { name, creatorType: 'agent' },
    })
    if (existing) {
      console.log(`  Skip (exists): ${name}`)
      continue
    }

    await db.player.create({
      data: {
        name,
        creatorType: 'agent',
        contactType: 'email',
        contactValue: `agent-sim-${i + 1}-${Date.now()}@simulated.local`,
        inviteId: agentInvite.id,
        nationId,
        archetypeId,
        onboardingComplete: true,
      },
    })
    created++
    console.log(`  + ${name}`)
  }

  console.log(`\n✅ Created ${created} simulated players`)
  console.log(`Run: npx tsx scripts/with-env.ts "tsx scripts/test-agent-game-loop.ts <playerId> 5"`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
