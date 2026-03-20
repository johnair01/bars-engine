/**
 * Agent narrative / action loop — FO Phase 2
 */

import type { AgentActionProposal, AgentMindState, QuestStageHint } from './types'

export function updateAgentNarrative(agentReadonly: AgentMindState, newLock: string): AgentMindState {
  return {
    ...agentReadonly,
    narrative_lock: newLock.trim(),
  }
}

function inferStageFromLock(lock: string): QuestStageHint {
  const t = lock.toLowerCase()
  if (/overwhelm|stuck|frozen|procrastin/.test(t)) return 'reflection'
  if (/angry|rage|conflict/.test(t)) return 'cleanup'
  if (/afraid|fear|anxious/.test(t)) return 'growth'
  if (/celebrat|launch|show/.test(t)) return 'action'
  return 'reflection'
}

/**
 * Heuristic action selection — no LLM. Biased by energy + emotional_state + lock text.
 */
export function selectAgentAction(
  agent: AgentMindState,
  _questSeedStage?: QuestStageHint
): AgentActionProposal {
  const stage = _questSeedStage ?? inferStageFromLock(agent.narrative_lock)

  if (agent.energy < 0.25) {
    return {
      allowed: true,
      action_kind: 'rest',
      reason: 'Low energy — recover before big moves.',
      label: 'rest_and_name_state',
    }
  }

  if (agent.emotional_state === 'fear' || stage === 'growth') {
    return {
      allowed: true,
      action_kind: 'observe',
      reason: 'Fear/growth stage → observe and name.',
      label: 'micro_truth_experiment',
    }
  }

  if (agent.emotional_state === 'anger' || stage === 'cleanup') {
    return {
      allowed: true,
      action_kind: 'experiment',
      reason: 'Activation / cleanup — small external experiment.',
      label: 'bounded_experiment',
    }
  }

  if (agent.energy > 0.75 && stage === 'action') {
    return {
      allowed: true,
      action_kind: 'experiment',
      reason: 'High energy — take a visible step.',
      label: 'public_step',
    }
  }

  return {
    allowed: true,
    action_kind: 'integrate',
    reason: 'Default — integrate learning into BAR.',
    label: 'integrate_insight',
  }
}

export type IntegrateResultInput = {
  bar_id?: string
  insight_note?: string
  energy_delta?: number
}

export function integrateAgentResult(
  agent: AgentMindState,
  result: IntegrateResultInput
): AgentMindState {
  const bars = [...agent.bars]
  if (result.bar_id) bars.push({ bar_id: result.bar_id, note: result.insight_note ?? null })
  else if (result.insight_note) bars.push({ synthetic: true, note: result.insight_note })

  let energy = agent.energy + (result.energy_delta ?? 0.05)
  if (energy > 1) energy = 1
  if (energy < 0) energy = 0

  return {
    ...agent,
    bars,
    energy,
    emotional_state: energy > 0.45 ? 'neutrality' : agent.emotional_state,
  }
}
