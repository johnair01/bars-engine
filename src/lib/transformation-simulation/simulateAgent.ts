/**
 * Transformation Simulation Harness — agent mode (FN Phase 2).
 * Loop: narrative lock → quest pipeline → heuristic action → integrate → state update.
 *
 * @see .specify/specs/transformation-simulation-harness/spec.md
 */

import type { AgentActionProposal, AgentMindState } from '@/lib/agent-mind/types'
import {
  integrateAgentResult,
  selectAgentAction,
  updateAgentNarrative,
} from '@/lib/agent-mind/actions'
import { generateNarrativeLock } from '@/lib/agent-mind/narrativeTriggers'
import { simulateQuestForAgent } from '@/lib/agent-mind/simulationBridge'

import type { SimulateQuestResult } from './simulateQuest'

export type SimulateAgentOptions = {
  /** Number of loop iterations (capped at 500). */
  steps: number
  /** Passed through to per-step `simulateQuestForAgent` for stable simulation ids. */
  seed?: number
  /** When true, occasionally refresh narrative via low-energy trigger if energy is low. */
  narrativeDrift?: boolean
}

export type SimulateAgentStepRecord = {
  step: number
  /** Quest pipeline output for the agent's narrative lock at this step. */
  quest: SimulateQuestResult
  action: AgentActionProposal
  agent_after: AgentMindState
  /** Harness events (e.g. narrative_drift). */
  events: string[]
}

export type SimulateAgentRunResult = {
  run_id: string
  seed?: number
  steps_requested: number
  steps: SimulateAgentStepRecord[]
  final_agent: AgentMindState
}

function mixHash(agentId: string, steps: number, seed: number): string {
  const s = `${agentId}|${steps}|${seed}`
  let h = seed >>> 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(16)
}

function applyActionToAgent(
  agent: AgentMindState,
  action: AgentActionProposal,
  step: number
): AgentMindState {
  const note = `${action.label} (step ${step})`
  switch (action.action_kind) {
    case 'rest':
      return integrateAgentResult(agent, { energy_delta: 0.18, insight_note: note })
    case 'observe':
      return integrateAgentResult(agent, { energy_delta: 0.06, insight_note: note })
    case 'experiment':
      return integrateAgentResult(agent, {
        bar_id: `sim_bar_${step}`,
        insight_note: note,
        energy_delta: -0.08,
      })
    case 'integrate':
      return integrateAgentResult(agent, {
        bar_id: `sim_bar_${step}`,
        insight_note: note,
        energy_delta: 0.04,
      })
    default:
      return integrateAgentResult(agent, { insight_note: note })
  }
}

/**
 * Run bounded agent simulation for N steps (deterministic given agent + seed + drift flags).
 */
export function simulateAgentRun(
  initialAgent: AgentMindState,
  options: SimulateAgentOptions
): SimulateAgentRunResult {
  const steps = Math.max(0, Math.min(500, Math.floor(options.steps)))
  const baseSeed = options.seed ?? 0
  const run_id = `sim_agent_${baseSeed}_${mixHash(initialAgent.agent_id, steps, baseSeed)}`

  let agent: AgentMindState = {
    ...initialAgent,
    bars: [...initialAgent.bars],
  }
  const stepsOut: SimulateAgentStepRecord[] = []

  for (let s = 1; s <= steps; s++) {
    const events: string[] = []

    if (options.narrativeDrift && agent.energy < 0.35 && s % 2 === 0) {
      const drift = generateNarrativeLock(agent, 'low_energy')
      agent = updateAgentNarrative(agent, drift)
      events.push('narrative_drift:low_energy')
    }

    const questSeed =
      options.seed !== undefined ? baseSeed + s * 1009 : undefined
    const quest = simulateQuestForAgent(agent, questSeed)

    const action = selectAgentAction(agent)
    events.push(`action:${action.action_kind}`)

    agent = applyActionToAgent(agent, action, s)

    stepsOut.push({
      step: s,
      quest,
      action,
      agent_after: { ...agent, bars: [...agent.bars] },
      events,
    })
  }

  return {
    run_id,
    seed: options.seed,
    steps_requested: steps,
    steps: stepsOut,
    final_agent: agent,
  }
}
