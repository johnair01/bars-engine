/**
 * Allyship Deck — canonical types (ADK Phase 1).
 * Spec: .specify/specs/allyship-deck/spec.md
 * Grammar: .specify/specs/allyship-deck/move-library-core-rules.md
 *
 * The move library = 5 Basic Moves × 6 Operations × 4 Domains = 120 move cards
 * (+ instruction cards). No DB — assembled to static JSON.
 */

export type BasicMove = 'wake_up' | 'open_up' | 'clean_up' | 'grow_up' | 'show_up'

export type Operation =
  | 'shaman'
  | 'challenger'
  | 'regent'
  | 'architect'
  | 'diplomat'
  | 'sage'

export type AllyshipDomain =
  | 'GATHERING_RESOURCES'
  | 'RAISE_AWARENESS'
  | 'DIRECT_ACTION'
  | 'SKILLFUL_ORGANIZING'

/** Capability restored when a channel resolves (the Capability Model). */
export type Capability = 'agency' | 'connection' | 'exploration' | 'rest' | 'participation'

export type Channel = 'fire' | 'water' | 'metal' | 'earth' | 'wood'

/** BAR produced by each Basic Move (the BAR flow). */
export type OutputBar = 'awareness' | 'experience' | 'insight' | 'wisdom' | 'artifact'

/** Consult lens for the subject toggle. */
export type Subject = 'self' | 'other' | 'collective'

/**
 * How a card raises awareness (the Witness Turn — inner/outer resolution):
 *  - 'point'   — an external truth made visible ("here is what's unseen / must change").
 *  - 'witness' — honest inner process expressed as content ("here is what this surfaced in me").
 * Both are OUTER (they raise awareness); the difference is the content. Derived deterministically
 * from the move (see `expression-register.ts`), not authored per card.
 * @see docs/ontology/2026-07-12-the-witness-turn-inner-outer-resolution.md
 */
export type ExpressionRegister = 'point' | 'witness'

/** 'generated' = grammar scaffold awaiting human polish; 'authored' = finished. */
export type CardStatus = 'authored' | 'generated'

export interface MoveCard {
  id: string // `${MOVE_ABBR}-${DOMAIN_ABBR}-${OPERATION}` e.g. "OPEN-GR-SHAMAN"
  num: string // zero-padded position in deck e.g. "001"
  kind: 'move'
  move: BasicMove
  operation: Operation
  domain: AllyshipDomain
  outputBar: OutputBar // fixed by move

  title: string
  submovePrompt: string // canonical submove line (core rules)

  // subject toggle — same card, two readings
  primaryQuestion: string // introspective ("what am I feeling?")
  campaignQuestion: string // for-others / milestone ("what does this campaign need?")
  defaultSubject: Subject

  // skill-stack anatomy (the "spell")
  optimizesFor: string
  forbiddenMoves: string[]
  failureModes: string[]
  remediation: string
  /** The one concrete next step ("Your move"). Defaults from the submove action; AUTHORED may override. */
  action?: string
  /** Authored real-life applications — how this move shows up in concrete situations. AUTHORED-only. */
  applications?: { context: string; example: string }[]

  flavor?: string
  capabilities: Capability[] // latent; selected at consult time (faces are channel-agnostic)
  artKey?: string

  status: CardStatus
}

export interface InstructionCard {
  id: string
  kind: 'instruction'
  topic: string
  title: string
  body: string
}

export type AllyshipCard = MoveCard | InstructionCard

export interface DeckProblem {
  id: string
  label: string
  cardIds: string[]
}

export interface AllyshipDeck {
  deck_slug: 'allyship-deck'
  deck_name: string
  version: string
  generatedAt: string
  theme: Record<string, string>
  counts: { move: number; instruction: number; authored: number; total: number }
  problems: DeckProblem[]
  cards: AllyshipCard[]
}
