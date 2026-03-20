/**
 * Bridge agent mind → transformation simulation harness (FO → FN).
 */

import type { AgentMindState } from './types'
import { simulateQuest, type SimulateQuestResult } from '@/lib/transformation-simulation/simulateQuest'
import { NATIONS } from '@/lib/game/nations'

function nationIdFromAgent(agent: AgentMindState): string | undefined {
  const entry = Object.values(NATIONS).find((n) => n.name === agent.nation)
  return entry?.id
}

/** Run quest simulation using the agent's current narrative lock + identity. */
export function simulateQuestForAgent(agent: AgentMindState, seed?: number): SimulateQuestResult {
  const nationId = nationIdFromAgent(agent)
  return simulateQuest(agent.narrative_lock, {
    nationId: nationId ?? null,
    archetypeKey: agent.archetype,
    seed,
  })
}
