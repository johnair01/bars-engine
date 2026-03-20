/**
 * Minimal Agent Mind Model — types (FO).
 * @see .specify/specs/minimal-agent-mind-model/spec.md
 */

export type AgentEmotionalState = 'fear' | 'anger' | 'sadness' | 'neutrality' | 'joy'

export type NarrativeTrigger =
  | 'goal_conflict'
  | 'low_energy'
  | 'failed_experiment'
  | 'social_interaction'

/** Inspectable agent state for simulation + quest pipeline. */
export interface AgentMindState {
  agent_id: string
  /** Nation display name (e.g. Argyra) */
  nation: string
  /** Playbook slug (e.g. bold-heart) — matches transformation / overlay IDs */
  archetype: string
  goal: string
  narrative_lock: string
  emotional_state: AgentEmotionalState
  /** 0.0–1.0 */
  energy: number
  /** BAR ids or lightweight records from integration */
  bars: unknown[]
}

export type CreateAgentInput = {
  agent_id?: string
  /** Nation id (argyra) or display name (Argyra) */
  nation: string
  /** Playbook slug (bold-heart), signal key (truth_seer), or display heuristic */
  archetype: string
  goal: string
  narrative_lock: string
  emotional_state?: AgentEmotionalState
  /** 0–1; default 0.7 */
  energy?: number
}

export type QuestStageHint = 'reflection' | 'cleanup' | 'growth' | 'action' | 'completion'

export type AgentActionProposal = {
  allowed: boolean
  action_kind: 'observe' | 'experiment' | 'integrate' | 'rest'
  reason: string
  /** Simple label for harness / logging */
  label: string
}
