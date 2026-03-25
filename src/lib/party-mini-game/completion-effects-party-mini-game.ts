import { PARTY_MINI_GAME_GRAMMAR_VERSION } from '@/lib/party-mini-game/definitions'

export type PartyMiniGameBarStampV1 = {
  grammar: typeof PARTY_MINI_GAME_GRAMMAR_VERSION
  miniGameId: string
  eventKey: string
  campaignRef: string
  squareId: string
  taggedPlayerId: string | null
  guestName: string | null
  capturedAt: string
}

export function buildPartyMiniGameCompletionEffects(stamp: PartyMiniGameBarStampV1): string {
  return JSON.stringify(stamp)
}
