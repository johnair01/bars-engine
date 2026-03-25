/**
 * Party mini-game definitions (event bingo, invite priming).
 * Canonical spec: .specify/specs/party-mini-game-event-layer/spec.md
 *
 * Organizers: edit copy in this file (or split to JSON later). Rebuild not required for
 * markdown-only doc changes elsewhere — this is the in-app source of truth for grid text.
 *
 * BAR capture (logged-in): `createPartyMiniGameMomentBar` in `src/actions/party-mini-game-bar.ts`;
 * stamp shape in `src/lib/party-mini-game/completion-effects-party-mini-game.ts`.
 */

import type { ElementKey } from '@/lib/ui/card-tokens'

export const PARTY_MINI_GAME_GRAMMAR_VERSION = 'party-mini-game-v1' as const

/**
 * Event store key for Bruised Banana Apr 2026 grids (invite + Apr 4 + Apr 5).
 * Used as the `eventKey` prop on `PartyMiniGameGridInteractive` (scopes browser storage).
 * New residency years: add a distinct key and pass it as `eventKey`.
 */
export const BB_APR2026_EVENT_STORE_KEY = 'bruised-banana-apr2026' as const

export type PartyMiniGameFlavor = 'invite' | 'live_dance' | 'live_scheming'

export interface PartyMiniGameSquare {
  id: string
  text: string
}

export interface PartyMiniGameDefinition {
  id: string
  campaignRef: 'bruised-banana'
  title: string
  /** Short intent line under the title (matches stakeholder “Goal:” lines). */
  goalLine: string | null
  flavor: PartyMiniGameFlavor
  /** Outer card Wuxing frame (card-tokens element). */
  element: ElementKey
  squares: readonly PartyMiniGameSquare[]
}

/** Pre-event invite bingo — optional priming (no tracking required). */
export const BB_INVITE_PRIMING: PartyMiniGameDefinition = {
  id: 'bb-invite-priming',
  campaignRef: 'bruised-banana',
  title: 'Invite bingo',
  goalLine: 'Shift mindset from “RSVP” to “Who belongs here?”',
  flavor: 'invite',
  element: 'wood',
  squares: [
    { id: 'bb-invite-1', text: 'brings good energy to a room' },
    { id: 'bb-invite-2', text: 'introduces people naturally' },
    { id: 'bb-invite-3', text: 'you’ve been meaning to see' },
    { id: 'bb-invite-4', text: 'would love this but wouldn’t expect it' },
    { id: 'bb-invite-5', text: 'has something they’re building' },
    { id: 'bb-invite-6', text: 'dances or wants to' },
    { id: 'bb-invite-7', text: 'knows people you don’t' },
    { id: 'bb-invite-8', text: 'says yes to interesting things' },
    { id: 'bb-invite-9', text: 'makes the vibe better' },
  ],
}

/** April 4 — dance night live bingo. */
export const BB_APR4_DANCE_BINGO: PartyMiniGameDefinition = {
  id: 'bb-apr4-dance-bingo',
  campaignRef: 'bruised-banana',
  title: 'Dance bingo',
  goalLine: 'More connection, boldness, embodiment',
  flavor: 'live_dance',
  element: 'fire',
  squares: [
    { id: 'bb-apr4-dance-1', text: 'Dance with someone you just met' },
    { id: 'bb-apr4-dance-2', text: 'Make eye contact → follow it' },
    { id: 'bb-apr4-dance-3', text: 'Dance outside your usual style' },
    { id: 'bb-apr4-dance-4', text: 'Lose track of time for a song' },
    { id: 'bb-apr4-dance-5', text: 'Make someone laugh mid-dance' },
    { id: 'bb-apr4-dance-6', text: 'Say yes faster than usual' },
    { id: 'bb-apr4-dance-7', text: 'Introduce two people' },
    { id: 'bb-apr4-dance-8', text: 'Dance with someone unexpected' },
    { id: 'bb-apr4-dance-9', text: 'Forget your phone exists' },
  ],
}

/** April 5 — collaborators / scheming day live bingo. */
export const BB_APR5_SCHEMING_BINGO: PartyMiniGameDefinition = {
  id: 'bb-apr5-scheming-bingo',
  campaignRef: 'bruised-banana',
  title: 'Scheming bingo',
  goalLine: 'More momentum, collaboration, creation',
  flavor: 'live_scheming',
  element: 'water',
  squares: [
    { id: 'bb-apr5-scheme-1', text: 'Turn a convo into an idea' },
    { id: 'bb-apr5-scheme-2', text: 'Say “we should…” and mean it' },
    { id: 'bb-apr5-scheme-3', text: 'Find someone building something adjacent' },
    { id: 'bb-apr5-scheme-4', text: 'Write down a real next step' },
    { id: 'bb-apr5-scheme-5', text: 'Loop in a third person' },
    { id: 'bb-apr5-scheme-6', text: 'Make something feel simpler' },
    { id: 'bb-apr5-scheme-7', text: 'Get a “text me tomorrow”' },
    { id: 'bb-apr5-scheme-8', text: 'Start something small' },
    { id: 'bb-apr5-scheme-9', text: 'Leave with momentum' },
  ],
}

const BY_ID: Record<string, PartyMiniGameDefinition> = {
  [BB_INVITE_PRIMING.id]: BB_INVITE_PRIMING,
  [BB_APR4_DANCE_BINGO.id]: BB_APR4_DANCE_BINGO,
  [BB_APR5_SCHEMING_BINGO.id]: BB_APR5_SCHEMING_BINGO,
}

export function getPartyMiniGameDefinition(id: string): PartyMiniGameDefinition | undefined {
  return BY_ID[id]
}
