/**
 * Sandbox isolation for agent runs.
 * Flow simulator is inherently sandboxed (no DB, no network).
 * This module documents the contract and provides guards for agent integration.
 *
 * Rules:
 * - Agents must never mutate production database or environment
 * - All agent-created content must have creatorType traceability
 * - Flow simulation uses in-memory state only; no external calls
 *
 * @see .specify/specs/flow-simulator-cli/spec.md — Agent Testing & Content Creation
 */

/** When true, simulation runs in agent sandbox mode (no external calls). */
export const SANDBOX_MODE = process.env.BARS_SIMULATOR_SANDBOX === '1'

/**
 * Asserts that we are in sandbox mode when running from agents.
 * Flow simulator does not touch DB; this is a future guard for extensions.
 */
export function assertSandbox(): void {
  if (!SANDBOX_MODE && process.env.BARS_AGENT_RUN === '1') {
    throw new Error(
      'Agent runs must use BARS_SIMULATOR_SANDBOX=1. Flow simulator does not mutate DB; this guard ensures future extensions respect sandbox.'
    )
  }
}

/**
 * Returns true if the current run is in sandbox/agent mode.
 */
export function isSandboxMode(): boolean {
  return SANDBOX_MODE || process.env.BARS_AGENT_RUN === '1'
}
