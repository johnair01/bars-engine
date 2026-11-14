/**
 * The closing ritual's record (six-faces-council .specify/specs/closing-ritual, FR-001). One `close` document per
 * date, kept in the board store (collection `close`, docId `close-<YYYY-MM-DD>`). The board page and the chat both
 * read and write this one record, so either door can resume the other.
 */
export const MOVES = ['glass', 'unpacking', 'pushback', 'plan', 'lever'] as const
export type Move = (typeof MOVES)[number]
export type CloseStatus = 'open' | 'closed' | 'skipped'

/** What FR-005 asks of any work Zo may run overnight. Every flag is a plain fact about the work. */
export interface Safety {
  reversible: boolean
  oneLane: boolean
  endsInPrOrRow: boolean
  merges: boolean
  spend: boolean
  outreach: boolean
  touchesFaces: boolean
  /** The brief carries "Next owner + wake:". */
  nextOwner: boolean
}

export type Stage = 'done' | 'doing' | 'next'

/** One piece of the day's work. `proof` is its seal (a pull request, a store record, a board row); no proof, no show. */
export interface Item extends Safety {
  id: string
  title: string
  stage: Stage
  proof?: string
  check?: 'green' | 'red' | 'none'
}

export interface Rating { n: number; about: string }
export type RatingKey = 'peace' | 'triumph' | 'wonder'
export type Ratings = Partial<Record<RatingKey, Rating>>

export type FaceName = 'Shaman' | 'Architect' | 'Challenger' | 'Regent' | 'Diplomat' | 'Sage'
export interface Pick extends Safety {
  face: FaceName
  text: string
  minutes: number
  /** 'kept' or 'pushed' once he has acted on it. */
  state?: 'kept' | 'pushed'
  reason?: string
  /** True for the pick that would be tomorrow's one lantern. */
  lantern?: boolean
}

export interface Ticket {
  id: string
  title: string
  hull: 'yours' | 'zo' | 'waits'
  /** The unpacking line or face pick it came from (provenance, FR-007). */
  source: string
  minutes: number
  lane: 'zo' | 'claude'
  released: boolean
}

export interface CloseRecord {
  date: string
  status: CloseStatus
  /** The move the close is on. */
  move: Move
  sentence?: string
  /** 'yes' | 'partly' | 'no': did this morning's alchemy turn hold. */
  held?: 'yes' | 'partly' | 'no'
  before?: Ratings
  after: Ratings
  /** Wins he tapped (item id to 1..5). Each lights a lantern that stays lit. */
  wins: Record<string, number>
  items: Item[]
  /** Set once the Challenger has asked "what would show this false?" about the Triumph rating. */
  challenged?: boolean
  unpacking: string[]
  picks: Pick[]
  pushback: { from: 'wendell' | 'face'; text: string }[]
  plan: { lantern?: { title: string; source: string }; tickets: Ticket[] }
  sent: string[]
  skipped: Move[]
  costPerAsset?: { dollars: number; assets: number; source: string }
  startedAt?: string
}

export const MAX_TICKETS = 5
export const MAX_MINUTES = 120
export const CAP_MINUTES = 20

export function dayId(date: string): string { return `close-${date}` }

export function newClose(date: string, items: Item[] = [], now = new Date().toISOString()): CloseRecord {
  return { date, status: 'open', move: 'glass', after: {}, wins: {}, items, unpacking: [], picks: [], pushback: [],
    plan: { tickets: [] }, sent: [], skipped: [], startedAt: now }
}
