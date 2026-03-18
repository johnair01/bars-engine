/**
 * Integration contract for flow-simulator-cli, transformation-simulation-harness,
 * and npc-agent-game-loop. Shared protocol for cross-tool interoperability.
 *
 * @see .specify/specs/flow-simulator-cli/spec.md — Integration Path
 * @see .specify/specs/transformation-simulation-harness/spec.md
 * @see .specify/specs/npc-agent-game-loop-simulation/spec.md
 */

import type { SimulationResult } from './types'

/** Shared SimulationResult shape — flow simulator output. */
export type FlowSimulationResult = SimulationResult

/** Subcommands for unified `bars simulate` CLI. */
export const SIMULATE_SUBCOMMANDS = [
  'flow', // flow-simulator-cli: simulate flow JSON
  'validate', // validate flow schema
  'quest', // transformation-simulation-harness: quest simulation
  'agent', // npc-agent-game-loop: agent game loop
  'campaign', // transformation-simulation-harness: campaign simulation
  'onboarding', // transformation-simulation-harness: onboarding simulation
] as const

export type SimulateSubcommand = (typeof SIMULATE_SUBCOMMANDS)[number]

/** Config passed between tools. */
export interface SimulationSharedConfig {
  seed?: number
  sandbox?: boolean
  verbose?: boolean
  json?: boolean
}
