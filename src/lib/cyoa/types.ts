/**
 * CYOA blueprint → BAR metabolism — shared contracts.
 * @see .specify/specs/cyoa-blueprint-bar-metabolism/spec.md
 */

export type AuthContext = {
  isAuthenticated: boolean
  playerId?: string
}

/** One BAR spawned during a CYOA run (stored in PlayerAdventureProgress.stateData). */
export type CyoaArtifactLedgerEntry = {
  kind: 'bar'
  barId: string
  passageNodeId: string
  /** Prompt library / blueprint key when available */
  blueprintKey?: string
  source: 'passage_emit' | 'move_choice' | 'manual'
  createdAt: string
}

export type CyoaHexagramState = {
  hexagramId: number
  transformedHexagramId?: number
  changingLines: number[]
  savedAt: string
}

export const SIGNUP_CHOICE_TARGET_IDS = new Set(['signup', 'Game_Login'])
