/**
 * Quest Grammar Compiler — Types
 *
 * Compiles 6 Unpacking Questions + Aligned Action into QuestPacket.
 * Part of bruised-banana-launch-specbar.
 */

export type EmotionalChannel = 'Fear' | 'Anger' | 'Sadness' | 'Joy' | 'Neutrality'
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
  /** Optional: target playbook ID for choice privileging (playbook WAVE). */
  targetPlaybookId?: string
  /** Internal: resolved by compileQuestWithPrivileging. Do not set directly. */
  privilegeContext?: { nationElement: 'metal' | 'water' | 'wood' | 'fire' | 'earth'; playbookWave: PersonalMoveType }
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

export interface QuestNode {
  id: string
  beatType: BeatType
  wordCountEstimate: number
  emotional: NodeEmotional
  text: string
  choices: Choice[]
  optionalLore?: LoreGate[]
  anchors: NodeAnchors
  isDonationNode?: boolean
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
}

/** Packet without telemetryHooks — safe to pass to server actions / client state */
export type SerializableQuestPacket = Omit<QuestPacket, 'telemetryHooks'>
