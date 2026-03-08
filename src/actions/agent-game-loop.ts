'use server'

import { db } from '@/lib/db'
import { completeQuestForPlayer } from '@/actions/quest-engine'
import { getActiveInstance } from '@/actions/instance'

/**
 * NPC Agent Game Loop Simulation
 *
 * Simulate the full game loop: pick quest → complete → mint vibeulons.
 * See .specify/specs/npc-agent-game-loop-simulation/spec.md
 */

export interface PickQuestOptions {
  threadId?: string
  campaignRef?: string
  source?: 'thread' | 'market'
}

export interface PickQuestResult {
  questId: string
  threadId?: string
  inputs?: Record<string, string>
}

/**
 * Pick a quest for an agent to complete.
 * Prefer: (1) already-assigned quest from threads, (2) market quest (pick up).
 */
export async function pickQuestForAgent(
  playerId: string,
  options?: PickQuestOptions
): Promise<PickQuestResult | { error: string }> {
  if (!playerId) return { error: 'Player ID required' }

  // 1. Check for already-assigned quest (PlayerQuest status = assigned)
  const assigned = await db.playerQuest.findFirst({
    where: { playerId, status: 'assigned' },
    include: {
      quest: true,
    },
  })
  if (assigned?.quest) {
    const threadQuest = await db.threadQuest.findFirst({
      where: { questId: assigned.questId },
      select: { threadId: true },
    })
    return {
      questId: assigned.questId,
      threadId: threadQuest?.threadId,
      inputs: {},
    }
  }

  // 2. Try market: get public quests, pick one not completed by this player
  const instance = await getActiveInstance()
  const kotterStage = instance?.kotterStage ?? 1

  const completedByPlayer = await db.playerQuest.findMany({
    where: { playerId, status: 'completed' },
    select: { questId: true },
  })
  const completedIds = new Set(completedByPlayer.map((pq) => pq.questId))

  const marketQuest = await db.customBar.findFirst({
    where: {
      visibility: 'public',
      status: 'active',
      kotterStage,
      id: { notIn: Array.from(completedIds) },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!marketQuest) return { error: 'No available quests' }

  // Assign (pick up) the quest
  await db.playerQuest.upsert({
    where: {
      playerId_questId: { playerId, questId: marketQuest.id },
    },
    update: { status: 'assigned' },
    create: {
      playerId,
      questId: marketQuest.id,
      status: 'assigned',
    },
  })

  return {
    questId: marketQuest.id,
    inputs: {},
  }
}

export interface SimulationReport {
  iterations: number
  completed: number
  failed: number
  vibeulonsEarned: number
  errors: string[]
}

/**
 * Simulate N iterations of the game loop: pick quest → complete → mint.
 */
export async function simulateAgentGameLoop(
  playerId: string,
  iterations: number = 5
): Promise<SimulationReport> {
  const report: SimulationReport = {
    iterations,
    completed: 0,
    failed: 0,
    vibeulonsEarned: 0,
    errors: [],
  }

  const player = await db.player.findUnique({
    where: { id: playerId },
  })
  if (!player) {
    report.errors.push('Player not found')
    return report
  }

  const vibeulonCountBefore = await db.vibulon.count({
    where: { ownerId: playerId },
  })

  for (let i = 0; i < iterations; i++) {
    const pick = await pickQuestForAgent(playerId)
    if ('error' in pick) {
      report.failed++
      report.errors.push(`Iteration ${i + 1}: ${pick.error}`)
      continue
    }

    const result = await completeQuestForPlayer(
      playerId,
      pick.questId,
      pick.inputs ?? {},
      { source: 'gameboard', threadId: pick.threadId }
    )

    if (result && 'error' in result) {
      report.failed++
      report.errors.push(`Iteration ${i + 1}: ${result.error}`)
    } else {
      report.completed++
    }
  }

  const vibeulonCountAfter = await db.vibulon.count({
    where: { ownerId: playerId },
  })
  report.vibeulonsEarned = Math.max(0, vibeulonCountAfter - vibeulonCountBefore)

  return report
}
