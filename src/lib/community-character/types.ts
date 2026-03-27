/**
 * Community Character Corpus — types
 *
 * A campaign owner authors their corpus once through the onboarding quest.
 * Every EventBingoCard generated for events in that campaign draws from it.
 *
 * @see src/lib/community-character/quest-passages.ts — the quest that produces answers
 * @see src/lib/community-character/build-corpus.ts   — answers → corpus
 * @see src/lib/community-character/select-prompts.ts — corpus × event → 9 squares
 */

/** Who this person is in the community ecosystem. */
export type CommunityType =
  | 'multiplier'   // spreads the invite; their yes brings other yeses
  | 'anchor'       // holds the room; makes new people feel safe
  | 'newcomer'     // needs a door — curious but hasn't crossed over yet
  | 'bridge'       // connects worlds; knows people you don't
  | 'wildcard'     // surprising fit; wouldn't obviously come but belongs here
  | 'stretch'      // hardest invite; most transformative if they show up
  | 'collaborator' // builds with you; turns conversations into plans

/** How this person functions in the relational web of the event. */
export type RelationalRole = 'multiplier' | 'bridge' | 'anchor' | 'newcomer' | 'wildcard'

/** Event types as used in EventArtifact.eventType. */
export type BingoEventType =
  | 'dance'
  | 'fundraiser'
  | 'gathering'
  | 'workshop'
  | 'scheming'
  | 'any'

export type MoveType = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'

// ─── Prompt Template ─────────────────────────────────────────────────────────

/** A single tagged invite prompt — lives in the corpus and on bingo squares. */
export interface PromptTemplate {
  id: string
  /** The actual text shown on the bingo square. */
  text: string
  communityType: CommunityType
  relationalRole: RelationalRole
  /** 1 = easy reach, 2 = some effort, 3 = real stretch */
  stretchLevel: 1 | 2 | 3
  /** Which Kotter move types this prompt fits. */
  moveTypes: MoveType[]
  /** Which event types this prompt is relevant for. 'any' matches all. */
  eventTypes: BingoEventType[]
}

// ─── Quest Types ─────────────────────────────────────────────────────────────

export interface QuestChoice {
  id: string
  label: string
  /** Prompt template IDs this choice contributes to the corpus. */
  promptIds: string[]
}

export interface QuestPassage {
  id: string
  communityType: CommunityType
  /** Question text. Receives archetype + nation context for register tuning. */
  questionText: (ctx: PassageContext) => string
  subtext?: (ctx: PassageContext) => string
  choices: QuestChoice[]
}

export interface PassageContext {
  archetypeKey: string
  archetypeLabel: string
  nationKey: string
  /** Wuxing element for the nation. */
  element: 'wood' | 'fire' | 'water' | 'metal' | 'earth'
}

// ─── Corpus ──────────────────────────────────────────────────────────────────

export interface QuestAnswer {
  questionId: string
  choiceId: string
  choiceLabel: string
  /** Prompt template IDs contributed by this answer. */
  promptIds: string[]
}

export interface CommunityCharacterCorpus {
  v: 1
  archetypeKey: string
  nationKey: string
  questCompletedAt: string // ISO 8601
  answers: QuestAnswer[]
  /** Deduplicated, fully resolved prompts — source of truth for bingo generation. */
  prompts: PromptTemplate[]
}

// ─── Bingo Card ──────────────────────────────────────────────────────────────

export interface BingoCardSquare {
  /** Unique within the card — matches PromptTemplate.id */
  promptId: string
  text: string
  communityType: CommunityType
  relationalRole: RelationalRole
  stretchLevel: 1 | 2 | 3
  // Player-filled state (mutable on the client, persisted to EventBingoCard.squares)
  assignedName: string | null
  inviteNote: string | null
  inviteSentAt: string | null  // ISO 8601
  completedAt: string | null   // ISO 8601 — "this person came"
}

// ─── Prize Config (stored on EventArtifact.bingoConfig) ─────────────────────

export type BingoPrizeConfig =
  | { prizeType: 'vibeulon'; vibeulonAmount: number }
  | { prizeType: 'custom'; description: string }
