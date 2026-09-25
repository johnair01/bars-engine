/**
 * The append-only party game record and the projections over it.
 *
 * One primitive (`PartyGameEvent`) carries the whole runtime game: hand, personal
 * cycle, board, achievements, GM feature/unlock history. The pure projection
 * functions live here so they can be tested without a database.
 */

import { HAND_SIZE } from './config'

export const PARTY_EVENT_TYPES = [
  'party_started',
  'hand_dealt',
  'card_drawn',
  'card_discarded',
  'card_played',
  'card_completed',
  'gm_card_unlocked',
  'gm_card_featured',
  'achievement_unlocked',
  'bar_donated',
  'bar_capture_pending',
  'spicy_unlocked',
  'host_override',
] as const

export type PartyEventType = (typeof PARTY_EVENT_TYPES)[number]

/** The shape the projections need — a subset of the Prisma row. */
export type GameEvent = {
  id: string
  playerId: string | null
  type: string
  cardId: string | null
  payloadJson: unknown
  createdAt: Date
}

export type HandState = {
  /** Base Oracle card ids currently held, in draw order. */
  hand: string[]
  /** 1-indexed personal cycle. */
  cycle: number
  /** Card ids already encountered (drawn or resolved) in the current cycle. */
  encountered: string[]
  /** Number of cards resolved across all cycles — for progress copy. */
  resolvedCount: number
}

function payload(event: GameEvent): Record<string, unknown> {
  return (event.payloadJson && typeof event.payloadJson === 'object'
    ? (event.payloadJson as Record<string, unknown>)
    : {}) as Record<string, unknown>
}

/**
 * Derive one player's hand and cycle from their event stream.
 *
 * Events must be chronological. `cycle` is stamped on every `card_drawn`
 * payload, so no inference is needed: when a draw arrives stamped with a new
 * cycle, the encountered set resets to whatever is still being held (so a card
 * kept across the boundary can never be dealt to the same player twice).
 */
export function deriveHandState(events: GameEvent[]): HandState {
  const hand: string[] = []
  let cycle = 1
  let encountered = new Set<string>()
  let resolvedCount = 0

  for (const event of events) {
    const cardId = event.cardId
    if (!cardId) continue

    if (event.type === 'card_drawn') {
      const eventCycle = Number(payload(event).cycle) || 1
      if (eventCycle !== cycle) {
        cycle = eventCycle
        encountered = new Set(hand)
      }
      encountered.add(cardId)
      if (!hand.includes(cardId)) hand.push(cardId)
      continue
    }

    if (event.type === 'card_played' || event.type === 'card_discarded') {
      const index = hand.indexOf(cardId)
      if (index >= 0) {
        hand.splice(index, 1)
        resolvedCount += 1
      }
    }
  }

  return { hand, cycle, encountered: Array.from(encountered), resolvedCount }
}

/**
 * Cards this player may still be dealt in their current cycle. Empty means the
 * corpus is exhausted and the cycle should advance.
 */
export function drawablePool(state: HandState, corpusIds: string[]): string[] {
  const encountered = new Set(state.encountered)
  return corpusIds.filter((id) => !encountered.has(id))
}

/**
 * Pick the cards needed to bring a hand back to size. Returns the draws plus the
 * cycle each should be stamped with — advancing the cycle when the corpus runs
 * out, at which point the whole corpus (minus what is still held) opens again.
 */
export function planDraws(
  state: HandState,
  corpusIds: string[],
  pick: (pool: string[]) => string,
  handSize = HAND_SIZE,
): { cardId: string; cycle: number }[] {
  const draws: { cardId: string; cycle: number }[] = []
  const held = new Set(state.hand)
  let cycle = state.cycle
  let pool = drawablePool(state, corpusIds)

  while (held.size < handSize) {
    if (!pool.length) {
      // Corpus exhausted for this cycle — reset and let the deck come around.
      const nextPool = corpusIds.filter((id) => !held.has(id))
      if (!nextPool.length) break
      cycle += 1
      pool = nextPool
    }
    const cardId = pick(pool)
    pool = pool.filter((id) => id !== cardId)
    held.add(cardId)
    draws.push({ cardId, cycle })
  }

  return draws
}

export type BoardPlay = {
  playEventId: string
  playerId: string | null
  playerName: string
  cardId: string
  lens: string
  depth: string
  prompt: string
  cardTitle: string
  playedAt: string
  completedAt: string | null
  achievement: { id: string; family: string; title: string; affordance: string } | null
}

/**
 * Board projection: every `card_played` is Active until a `card_completed`
 * names its play event. Host hides are `host_override` rows and drop the play
 * from both lists. Plays of the same base card by different players stay
 * distinct — identity is the play event, not the card.
 */
export function deriveBoardPlays(events: GameEvent[]): {
  active: string[]
  completed: Map<string, Date>
  hidden: Set<string>
} {
  const played: string[] = []
  const completed = new Map<string, Date>()
  const hidden = new Set<string>()

  for (const event of events) {
    const data = payload(event)
    if (event.type === 'card_played') {
      played.push(event.id)
    } else if (event.type === 'card_completed') {
      const playEventId = typeof data.playEventId === 'string' ? data.playEventId : null
      if (playEventId) completed.set(playEventId, event.createdAt)
    } else if (event.type === 'host_override' && data.action === 'hide_play') {
      const playEventId = typeof data.playEventId === 'string' ? data.playEventId : null
      if (playEventId) hidden.add(playEventId)
    }
  }

  return {
    active: played.filter((id) => !completed.has(id) && !hidden.has(id)),
    completed,
    hidden,
  }
}

/**
 * Game Master deck state. The wall clock does the normal work; host moves are
 * the only persisted exceptions and can only ever open things further.
 */
export function deriveGmState(
  events: GameEvent[],
  unlockedByClock: number,
  slotCount: number,
): { unlockedCount: number; featuredSlot: number | null } {
  let hostUnlocked = 0
  let featuredSlot: number | null = null

  for (const event of events) {
    const data = payload(event)
    if (event.type === 'gm_card_unlocked') {
      const slot = Number(data.slot) || 0
      if (slot > hostUnlocked) hostUnlocked = slot
    } else if (event.type === 'gm_card_featured') {
      const slot = Number(data.slot) || 0
      if (slot > 0) featuredSlot = slot
    }
  }

  const unlockedCount = Math.min(Math.max(unlockedByClock, hostUnlocked), slotCount)
  // A featured card can never point past what is unlocked; fall back to newest.
  const featured =
    featuredSlot && featuredSlot <= unlockedCount ? featuredSlot : unlockedCount > 0 ? unlockedCount : null

  return { unlockedCount, featuredSlot: featured }
}

/** Achievements a player has unlocked, newest last, deduped by achievement id. */
export function deriveAchievements(events: GameEvent[]): {
  id: string
  family: string
  title: string
  description: string
  affordance: string
  unlockedAt: string
}[] {
  const byId = new Map<string, ReturnType<typeof deriveAchievements>[number]>()
  for (const event of events) {
    if (event.type !== 'achievement_unlocked') continue
    const data = payload(event)
    const achievement = (data.achievement || {}) as Record<string, unknown>
    const id = typeof achievement.id === 'string' ? achievement.id : ''
    if (!id) continue
    byId.set(id, {
      id,
      family: String(achievement.family || ''),
      title: String(achievement.title || ''),
      description: String(achievement.description || ''),
      affordance: String(achievement.affordance || ''),
      unlockedAt: event.createdAt.toISOString(),
    })
  }
  return Array.from(byId.values())
}
