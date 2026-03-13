/**
 * Creation Quest Bootstrap — Types
 *
 * API-first contracts for rules-first creation quest generation with AI fallback.
 * See .specify/specs/creation-quest-bootstrap/spec.md
 */

/** Personal = Epiphany Bridge (6 beats); Communal = Kotter (8 stages). Derived from keywords. */
export type QuestModel = 'personal' | 'communal'

export type CreationIntent = {
  creationType: string
  domain?: string
  targetState?: string
  constraints?: string[]
  confidence: number
  /** Derived: communal when coalition/campaign/fundraiser/urgency keywords present. */
  questModel?: QuestModel
  /** Derived from alignedAction when it matches a move. */
  moveType?: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
}

export type CreationContext = {
  segment?: string
  campaignId?: string
  [key: string]: unknown
}

export type CreationQuestNode = {
  id: string
  text: string
  choices?: Array<{ text: string; targetId: string }>
}

export type CreationQuestPacket = {
  nodes: CreationQuestNode[]
  signature?: string
  segmentVariant?: string
  heuristicVsAi: 'heuristic' | 'ai'
  templateMatched?: string
}

export type AssembleInputs = {
  nodes: CreationQuestNode[]
  metadata?: Record<string, unknown>
}

/** Passage-like output for DB; Twine export is string */
export type Artifact =
  | { type: 'passages'; passages: Array<{ nodeId: string; text: string; choices: unknown }> }
  | { type: 'twee'; content: string }
