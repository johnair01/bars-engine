/**
 * Game Master Face Move BAR creation.
 * Every face move produces a BAR (CustomBar). See .specify/specs/game-master-face-moves/spec.md
 */


export const FACE_MOVE_TYPES = {
  shaman: ['create_ritual', 'name_shadow_belief'] as const,
  challenger: ['issue_challenge', 'propose_move'] as const,
  regent: ['declare_period', 'grant_role'] as const,
  architect: ['offer_blueprint', 'design_layout'] as const,
  diplomat: ['offer_connection', 'host_event'] as const,
  sage: ['witness', 'cast_hexagram'] as const,
} as const

export type FaceMoveType =
  | (typeof FACE_MOVE_TYPES.shaman)[number]
  | (typeof FACE_MOVE_TYPES.challenger)[number]
  | (typeof FACE_MOVE_TYPES.regent)[number]
  | (typeof FACE_MOVE_TYPES.architect)[number]
  | (typeof FACE_MOVE_TYPES.diplomat)[number]
  | (typeof FACE_MOVE_TYPES.sage)[number]

export interface FaceMoveBarInput {
  title: string
  description: string
  /** vibe (default) or insight for Shaman shadow belief, Sage witness */
  barType?: 'vibe' | 'insight'
  questId?: string
  playerId?: string
  instanceId?: string
  /** Additional metadata for the move */
  metadata?: Record<string, unknown>
  /** GP-CLB: Next smallest honest action (stored in agentMetadata) */
  nextAction?: string
}

export interface FaceMoveBarResult {
  success: true
  barId: string
}

export interface FaceMoveBarError {
  error: string
}
