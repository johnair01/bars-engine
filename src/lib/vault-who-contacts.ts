/**
 * Vault "Who" ledger — private BARs keyed by completionEffects.grammar
 * (party moments, future who-contact captures). Wake Up → relational field.
 *
 * @see .specify/specs/party-mini-game-event-layer/spec.md
 */

import { PARTY_MINI_GAME_GRAMMAR_VERSION } from '@/lib/party-mini-game/definitions'

/** JSON substring matches for Prisma `completionEffects: { contains }` (compact JSON.stringify). */
export function whoVaultCompletionSnippets(): string[] {
  return [`"grammar":"${PARTY_MINI_GAME_GRAMMAR_VERSION}"`, '"grammar":"who-contact-v1"']
}

export function whoContactGrammarOrFilter() {
  return whoVaultCompletionSnippets().map((snippet) => ({
    completionEffects: { contains: snippet },
  }))
}

export type WhoVaultStamp = {
  grammar?: string
  guestName?: string | null
  taggedPlayerId?: string | null
  miniGameId?: string
  squareId?: string
}

export function parseWhoVaultStamp(completionEffects: string | null): WhoVaultStamp | null {
  if (!completionEffects) return null
  try {
    const o = JSON.parse(completionEffects) as WhoVaultStamp
    const g = o.grammar
    if (g !== PARTY_MINI_GAME_GRAMMAR_VERSION && g !== 'who-contact-v1') return null
    return o
  } catch {
    return null
  }
}
