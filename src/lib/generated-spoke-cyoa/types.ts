import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { SpokeMoveBedMoveType } from '@/lib/spoke-move-beds'

/** Four-move focus for this spoke run (SMB / beds). */
export type GscpMoveFocus = SpokeMoveBedMoveType

/**
 * Wizard + generator inputs (v1).
 * Charge text parameterizes the achievement BAR and LLM middle passages.
 */
export type GeneratedSpokeInputs = {
  campaignRef: string
  spokeIndex: number
  kotterStage: number
  hexagramId?: number
  hexagramName?: string
  changingLines?: number[]
  /** Live copy — milestone strip / honest guidance */
  milestoneSummary?: string
  /** Fundraising — only when instance has real URLs */
  fundraisingNote?: string | null
  instanceName: string
  allyshipDomain?: string | null
  moveFocus: GscpMoveFocus
  chargeText: string
  gmFace: GameMasterFace
}

export type GscpProgressBundle = {
  campaignRef: string
  spokeIndex: number
  kotterStage: number
  moveType: GscpMoveFocus
  gmFace: GameMasterFace
  chargeText: string
  hexagramId?: number
  blueprintKey: string
  /** Passage node id with metadata.actionType gscp_terminal */
  terminalNodeId: string
  /** ISO — when this run was created */
  createdAt: string
}
