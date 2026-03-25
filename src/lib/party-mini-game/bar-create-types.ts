/** Payload for `createPartyMiniGameMomentBar` — import from client; do not import from `use server` files. */

export type PartyMiniGameMomentBarInput = {
  miniGameId: string
  eventKey: string
  squareId: string
  /** Resolved in-game player (from search). */
  taggedPlayerId: string | null
  /** Display name when they are not in the game. */
  guestName: string | null
}
