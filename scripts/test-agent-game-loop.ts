/**
 * Test script for NPC Agent Game Loop Simulation
 *
 * Usage: npx tsx scripts/with-env.ts "tsx scripts/test-agent-game-loop.ts [playerId] [iterations]"
 *
 * Requires a valid playerId. Use an existing player or create an agent player via seed.
 */

import { simulateAgentGameLoop, pickQuestForAgent } from '@/actions/agent-game-loop'
import { db } from '@/lib/db'

async function main() {
  const playerId = process.argv[2]
  const iterations = parseInt(process.argv[3] ?? '3', 10) || 3

  if (!playerId) {
    const sample = await db.player.findFirst({
      select: { id: true, name: true },
    })
    console.error('Usage: npx tsx scripts/test-agent-game-loop.ts <playerId> [iterations]')
    if (sample) {
      console.error(`Example: npx tsx scripts/test-agent-game-loop.ts ${sample.id} ${iterations}`)
    }
    process.exit(1)
  }

  console.log(`Simulating agent game loop for player ${playerId} (${iterations} iterations)...`)
  const report = await simulateAgentGameLoop(playerId, iterations)

  console.log('\nReport:')
  console.log(`  Iterations: ${report.iterations}`)
  console.log(`  Completed: ${report.completed}`)
  console.log(`  Failed: ${report.failed}`)
  console.log(`  Vibeulons earned: ${report.vibeulonsEarned}`)
  if (report.errors.length > 0) {
    console.log('  Errors:')
    report.errors.forEach((e) => console.log(`    - ${e}`))
  }

  process.exit(report.failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
