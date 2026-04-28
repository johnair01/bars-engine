/**
 * DAOE Phase 2 — Shared types
 * All TypeScript interfaces for the state-delta API, cast-fortune, and NPC tone weights.
 * Single source of truth for DAOE type contracts.
 */

import type { NpcToneWeights, PlayerPersonalityProfile } from './personality-mapper'

export { type NpcToneWeights, type PlayerPersonalityProfile } from './personality-mapper'

// ---------------------------------------------------------------------------
// Delta Update (Phase 2 FR2.1)
// ---------------------------------------------------------------------------

export type ResolutionRegister = 'fortune' | 'drama' | 'karma' | 'none'

export interface FortuneState {
  lastHexagram: string
  lastCastAt: string
  castHistory: string[]
}

export interface DramaState {
  currentNode: string
  availableChoices: string[]
  narrativeContext: string
}

export interface KarmaState {
  maturityPhase: string
  bsmProgress: number
  alchemyStreak: number
}

/**
 * DeltaUpdate — the output of every DAOE state computation.
 * Used by client-side prediction protocol (FR2.1).
 *
 * Register discrimination: only the field matching `register` is populated.
 * All other state fields are undefined — this is intentional.
 * Clients must switch on `register` to extract the correct state blob.
 */
export interface DeltaUpdate {
  campaignId: string
  frame: number
  register: ResolutionRegister
  fortuneState?: FortuneState
  dramaState?: DramaState
  karmaState?: KarmaState
  predictionMismatch?: boolean  // true = client should rollback
  suspended?: boolean           // true = campaign is paused
  serverTime: number
}

// ---------------------------------------------------------------------------
// Cast Fortune (Phase 2 FR2.2)
// ---------------------------------------------------------------------------

export interface CastFortuneInput {
  campaignId: string
  intent?: string  // Optional player intent appended to cast context
}

export interface HexagramResult {
  hexagramId: string
  changingLines: number[]
  resultingHexagramId: string
  narrativeGuidance: string
  registeredAt: string
}

export interface CastFortuneOutput {
  hexagram: HexagramResult
  delta: DeltaUpdate
}

// ---------------------------------------------------------------------------
// Phase 3 — Player Personality Intake
// ---------------------------------------------------------------------------

export type JourneyStage = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
export type AllyshipDomain = 'gathering_resources' | 'direct_action' | 'raise_awareness' | 'skillful_organizing'
export type GameMasterFace = 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'

export interface PersonalityIntakeAnswers {
  currentStage: JourneyStage
  primaryAllyshipDomain: AllyshipDomain
  developmentalItch: string  // Free text, 50-200 chars
  preferredGMFace: GameMasterFace
}

export interface PlayerIntakeOutput {
  personalityProfile: PlayerPersonalityProfile
  npcToneWeights: NpcToneWeights
}

// ---------------------------------------------------------------------------
// Campaign Suspension (Phase 4)
// ---------------------------------------------------------------------------

export interface CampaignSuspendInput {
  campaignId: string
  revokedToken?: string  // Optional — used by subscription service webhook
}

export interface CampaignSuspendOutput {
  suspended: true
  suspendedAt: string
  gracePeriodEnded: boolean
}

export interface CampaignRestoreInput {
  campaignId: string
}

export interface CampaignRestoreOutput {
  restored: true
  suspendedAt: string | null  // null = no suspension ever
}