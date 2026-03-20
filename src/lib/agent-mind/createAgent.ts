/**
 * createAgent — FO Phase 1
 */

import type { AgentMindState, CreateAgentInput } from './types'
import { resolveAgentIdentity } from './validation'

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.5
  return Math.min(1, Math.max(0, n))
}

function randomAgentId(): string {
  return `agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createAgent(input: CreateAgentInput): AgentMindState {
  const id = resolveAgentIdentity(input.nation, input.archetype)
  return {
    agent_id: input.agent_id?.trim() || randomAgentId(),
    nation: id.nation.name,
    archetype: id.archetype_slug,
    goal: input.goal.trim(),
    narrative_lock: input.narrative_lock.trim(),
    emotional_state: input.emotional_state ?? 'neutrality',
    energy: clamp01(input.energy ?? 0.7),
    bars: [],
  }
}
