/**
 * Quest Grammar Compiler — Types
 *
 * Compiles 6 Unpacking Questions + Aligned Action into QuestPacket.
 * Part of bruised-banana-launch-specbar.
 */

import type { AlchemyAltitude } from '@/lib/alchemy/types'

export type EmotionalChannel = 'Fear' | 'Anger' | 'Sadness' | 'Joy' | 'Neutrality'

/** Move family: Transcend = altitude within channel; Translate = channel-to-channel. */
export type MoveFamily = 'Transcend' | 'Translate'

/** Emotional vector: channel:altitude -> channel:altitude. Same channel = Transcend; different = Translate. */
export interface EmotionalVector {
  channelFrom: EmotionalChannel
  altitudeFrom: AlchemyAltitude
  channelTo: EmotionalChannel
  altitudeTo: AlchemyAltitude
}

const CHANNEL_TO_LOWER: Record<EmotionalChannel, string> = {
  Fear: 'fear',
  Anger: 'anger',
  Sadness: 'sadness',
  Joy: 'joy',
  Neutrality: 'neutrality',
}

const LOWER_TO_CHANNEL: Record<string, EmotionalChannel> = {
  fear: 'Fear',
  anger: 'Anger',
  sadness: 'Sadness',
  joy: 'Joy',
  neutrality: 'Neutrality',
}

const VALID_ALTITUDES: AlchemyAltitude[] = ['dissatisfied', 'neutral', 'satisfied']

/** Serialize vector to string: channel:altitude->channel:altitude */
export function vectorToString(v: EmotionalVector): string {
  const cf = CHANNEL_TO_LOWER[v.channelFrom]
  const ct = CHANNEL_TO_LOWER[v.channelTo]
  return `${cf}:${v.altitudeFrom}->${ct}:${v.altitudeTo}`
}

/** Parse vector string; returns null if invalid. */
export function parseVectorString(s: string): EmotionalVector | null {
  const match = s.match(/^([a-z]+):(dissatisfied|neutral|satisfied)->([a-z]+):(dissatisfied|neutral|satisfied)$/)
  if (!match) return null
  const [, cf, af, ct, at] = match
  const channelFrom = LOWER_TO_CHANNEL[cf ?? '']
  const channelTo = LOWER_TO_CHANNEL[ct ?? '']
  if (!channelFrom || !channelTo) return null
  if (!VALID_ALTITUDES.includes(af as AlchemyAltitude) || !VALID_ALTITUDES.includes(at as AlchemyAltitude)) return null
  return {
    channelFrom,
    altitudeFrom: af as AlchemyAltitude,
    channelTo,
    altitudeTo: at as AlchemyAltitude,
  }
}
export type MovementType = 'translate' | 'transcend'
export type SegmentVariant = 'player' | 'sponsor'

/** Epiphany Bridge (personal, N=6) */
export type EpiphanyBeatType =
  | 'orientation'
  | 'rising_engagement'
  | 'tension'
  | 'integration'
  | 'transcendence'
  | 'consequence'

/** Kotter (communal, N=8) */
export type KotterBeatType =
  | 'urgency'
  | 'coalition'
  | 'vision'
  | 'communicate'
  | 'obstacles'
  | 'wins'
  | 'build_on'
  | 'anchor'

export type BeatType = EpiphanyBeatType | KotterBeatType

/** Action type for the commitment moment (transcendence/wins). Campaign-agnostic. */
export type ActionType = 'donation' | 'signup' | 'complete' | 'generic' | 'cast_iching'

/** I Ching draw context for quest generation. Injected into buildQuestPromptContext when present. */
export interface IChingContext {
  hexagramId: number
  hexagramName: string
  hexagramTone: string
  hexagramText: string
  upperTrigram: string
  lowerTrigram: string
  kotterStage?: number | null
  kotterStageName?: string | null
  nationName?: string | null
  activeFace?: string | null
  playbookTrigram?: string | null
}

export interface UnpackingAnswers {
  q1: string
  /** Satisfaction (Q2). Multi-select: string[] of selected labels. Single: string. */
  q2: string | string[]
  /** Life state (Q3). Allyship: "LifeState | distance" or plain string for backward compat. */
  q3: string
  /** Dissatisfaction (Q4). Multi-select: string[] of selected labels. Single: string. */
  q4: string | string[]
  q5: string
  /** Self-sabotage (Q6). Multi-select: string[] of selected labels. Single: string. */
  q6: string | string[]
  /** Optional: short text for Q6 reservations context (allyship unpacking). */
  q6Context?: string
}

/** 4 moves (personal throughput). Used for mastery: Wake Up = choice-based; Show Up = action-based. */
export type PersonalMoveType = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'

export type QuestModel = 'personal' | 'communal'

export interface QuestCompileInput {
  unpackingAnswers: UnpackingAnswers
  alignedAction: string
  segment: SegmentVariant
  campaignId?: string
  /** Personal = Epiphany Bridge (6 beats); Communal = Kotter (8 stages). Default: personal. */
  questModel?: QuestModel
  /** Optional: overrides derivation from alignedAction. Used for mastery rules. */
  moveType?: PersonalMoveType
  /** Optional: target archetype IDs (Playbook) for tailoring output. */
  targetArchetypeIds?: string[]
  /** Optional: developmental lens (Game Master face) for tailoring output. */
  developmentalLens?: string
  /** Optional: target nation ID for choice privileging (nation element). */
  targetNationId?: string
  /** Optional: target archetype ID for choice privileging (archetype WAVE). */
  targetArchetypeId?: string
  /** Optional: I Ching draw context. Injected into AI prompt when present. */
  ichingContext?: IChingContext
  /** Internal: resolved by compileQuestWithPrivileging. Do not set directly. */
  privilegeContext?: { nationElement: 'metal' | 'water' | 'wood' | 'fire' | 'earth'; archetypeWave: PersonalMoveType }
  /** Short intro: 4 beats only (orientation, rising, tension, integration). Terminal last node for chaining. */
  spineLength?: 'short' | 'full'
  /** Altitude Map order: gapIndex -> ordered depth node ids. Overrides default face order. */
  depthBranchOrder?: Record<number, string[]>
  /** Per-node choice overrides (choiceType, enabledFaces, enabledHorizontal, obstacleActions). Merged into generated nodes. */
  nodeOverrides?: Record<string, NodeChoiceOverride>
}

export interface NodeChoiceOverride {
  choiceType?: 'altitudinal' | 'horizontal'
  enabledFaces?: GameMasterFace[]
  enabledHorizontal?: PersonalMoveType[]
  obstacleActions?: Record<string, string>
}

export interface LoreGate {
  id: string
  text: string
  returnTargetId: string
}

export interface NodeAnchors {
  goal?: string
  identityCue?: string
  consequenceCue?: string
}

export type WaveStage = 'Wake' | 'Clean' | 'Grow' | 'Show'
export type TranslateCategory = 'Generative' | 'Control'

export interface NodeEmotional {
  channel: EmotionalChannel
  movement: MovementType
  fromState?: string
  toState?: string
  /** Optional: element for 15-move engine */
  element?: string
  /** Optional: WAVE stage */
  waveStage?: WaveStage
  /** Optional: for translate moves */
  translateCategory?: TranslateCategory
  /** Optional: energy delta (+2 transcend, +1 generative, -1 control) */
  energyDelta?: number
}

export interface Choice {
  text: string
  targetId: string
  /** Canonical move ID for choice privileging (nation element, playbook WAVE) */
  moveId?: string
}

export type GameMasterFace = 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'

export const GAME_MASTER_FACES: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

export const FACE_META: Record<GameMasterFace, { label: string; role: string; mission: string; color: string }> = {
  shaman: { label: 'Shaman', role: 'Mythic threshold', mission: 'Belonging, ritual space, bridge between worlds', color: 'text-fuchsia-400' },
  challenger: { label: 'Challenger', role: 'Proving ground', mission: 'Action, edge, lever', color: 'text-red-400' },
  regent: { label: 'Regent', role: 'Order, structure', mission: 'Roles, rules, collective tool', color: 'text-amber-400' },
  architect: { label: 'Architect', role: 'Blueprint', mission: 'Strategy, project, advantage', color: 'text-blue-400' },
  diplomat: { label: 'Diplomat', role: 'Weave', mission: 'Relational field, care, connector', color: 'text-teal-400' },
  sage: { label: 'Sage', role: 'Whole', mission: 'Integration, emergence, flow', color: 'text-purple-400' },
}

export interface QuestNode {
  id: string
  beatType: BeatType
  wordCountEstimate: number
  emotional: NodeEmotional
  text: string
  choices: Choice[]
  optionalLore?: LoreGate[]
  anchors: NodeAnchors
  /** True for transcendence (Epiphany) or wins (Kotter) — the commitment moment. */
  isActionNode?: boolean
  /** Action type when isActionNode. Campaign-agnostic. Default: donation for fundraiser. */
  actionType?: ActionType
  /** 0 = spine (default), 1+ = depth branch */
  depth?: number
  /** For depth nodes: which spine node this converges back to */
  convergesTo?: string
  /** For depth nodes: the canonical move this branch represents */
  depthMoveId?: string
  /** For depth nodes: which Game Master face guides this path */
  gameMasterFace?: GameMasterFace
  /** When actionType is cast_iching: target node after casting */
  castIChingTargetId?: string
  /** Per-node choice type: altitudinal (6 faces) or horizontal (4 WAVE moves) */
  choiceType?: 'altitudinal' | 'horizontal'
  /** When choiceType altitudinal: which faces are enabled (subset of 6) */
  enabledFaces?: GameMasterFace[]
  /** When choiceType horizontal: which WAVE moves are enabled (subset of 4) */
  enabledHorizontal?: PersonalMoveType[]
  /** Per choice: action to overcome obstacle. Key = targetId or choice index. */
  obstacleActions?: Record<string, string>
  /** Branch depth: 0 = spine, 1–3 = branch layers. Max 3. */
  branchDepth?: number
}

export interface EmotionalAlchemySignature {
  primaryChannel: EmotionalChannel
  dissatisfiedLabels: string[]
  satisfiedLabels: string[]
  movementPerNode: MovementType[]
  shadowVoices: string[]
  /** Personal move type for mastery: Wake Up = choice-based; Show Up = action-based. */
  moveType?: PersonalMoveType
}

export interface TelemetryHooks {
  questStarted: () => void
  nodeViewed: (nodeId: string) => void
  choiceSelected: (fromNodeId: string, toNodeId: string) => void
  donationClicked: () => void
  donationCompleted: () => void
}

/** Maps nodeId -> choiceIndex -> moveId for runtime filtering. Emitted with Twee. */
export type MoveMap = Record<string, Record<number, string>>

export interface QuestPacket {
  signature: EmotionalAlchemySignature
  nodes: QuestNode[]
  segmentVariant: SegmentVariant
  telemetryHooks: TelemetryHooks
  startNodeId: string
  /** Choice privileging: nodeId -> choiceIndex -> moveId. Present when privilegeContext used. */
  moveMap?: MoveMap
  /** Altitude Map: gapIndex -> ordered face ids. Ephemeral until publish. */
  depthBranchOrder?: Record<number, string[]>
}

/** Packet without telemetryHooks — safe to pass to server actions / client state */
export type SerializableQuestPacket = Omit<QuestPacket, 'telemetryHooks'>
