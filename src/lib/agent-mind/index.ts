/**
 * Minimal Agent Mind Model (FO) — deterministic heuristics for simulated actors.
 * @see .specify/specs/minimal-agent-mind-model/spec.md
 */

export type {
  AgentActionProposal,
  AgentEmotionalState,
  AgentMindState,
  CreateAgentInput,
  NarrativeTrigger,
  QuestStageHint,
} from './types'
export { createAgent } from './createAgent'
export {
  integrateAgentResult,
  selectAgentAction,
  updateAgentNarrative,
  type IntegrateResultInput,
} from './actions'
export { generateNarrativeLock } from './narrativeTriggers'
export { resolveAgentIdentity, resolveNationOrThrow, resolveArchetypeOrThrow } from './validation'
export { simulateQuestForAgent } from './simulationBridge'
