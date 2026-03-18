/**
 * Propose BAR/quest content from simulated agents.
 *
 * Run: npx tsx scripts/with-env.ts "tsx scripts/propose-agent-content.ts [count]"
 * Requires: simulated players (npm run seed:simulated-players)
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { proposeBarFromAgent } from '../src/actions/agent-content-proposal'

const GOALS = [
  'build a small project and share it',
  'form a deeper connection with someone',
  'solve a problem I have been avoiding',
  'explore an idea that excites me',
  'take one step toward a bigger goal',
]

const NARRATIVE_LOCKS = [
  "I'm afraid people won't like my work",
  "I don't know where to start",
  'I feel overwhelmed',
  "Maybe I'm not good at this",
  'I keep putting it off',
]

async function main() {
  const count = parseInt(process.argv[2] ?? '3', 10) || 3

  const agents = await db.player.findMany({
    where: { creatorType: 'agent' },
    select: { id: true, name: true, nationId: true, archetypeId: true },
    take: 10,
  })

  if (agents.length === 0) {
    console.error('No agent players found. Run: npm run seed:simulated-players -- 5')
    process.exit(1)
  }

  if (!agents[0].nationId || !agents[0].archetypeId) {
    console.error('Agent players need nationId and archetypeId. Re-run seed.')
    process.exit(1)
  }

  console.log(`--- Proposing ${count} agent content items ---`)

  let proposed = 0
  for (let i = 0; i < count; i++) {
    const agent = agents[i % agents.length]
    const goal = GOALS[i % GOALS.length]
    const narrativeLock = NARRATIVE_LOCKS[i % NARRATIVE_LOCKS.length]
    const energy = 0.5 + (i % 3) * 0.2

    const result = await proposeBarFromAgent(
      agent.id,
      {
        nationId: agent.nationId!,
        archetypeId: agent.archetypeId!,
        goal,
        narrativeLock,
        energy,
      },
      { campaignRef: 'bruised-banana', allyshipDomain: 'GATHERING_RESOURCES' }
    )

    if (result.success) {
      proposed++
      console.log(`  + ${agent.name}: ${goal.slice(0, 40)}…`)
    } else {
      console.warn(`  ✗ ${agent.name}: ${result.error}`)
    }
  }

  console.log(`\n✅ Proposed ${proposed} items. Review at /admin/agent-proposals`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
