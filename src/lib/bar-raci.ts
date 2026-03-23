/**
 * BAR Response + Threading Model v0 (RACI)
 *
 * Formal intent vocabulary mapped to RACI roles for BarResponse records.
 * Consumed by: bar-responses actions, future GB/GC/GH specs.
 */

export type BarIntent =
  | 'take_quest'   // Responsible: I will do this
  | 'accountable'  // Accountable: I own the outcome
  | 'consult'      // Consulted: include me in decisions
  | 'witness'      // Informed: keep me in the loop
  | 'observe'      // Informed: passive acknowledgment
  | 'offer_help'   // Consulted: I can help if needed
  | 'join'         // Responsible: I'm participating actively
  | 'decline'      // No RACI: explicit opt-out

export type RaciRole = 'Responsible' | 'Accountable' | 'Consulted' | 'Informed'

/** All valid intents that carry a RACI role. */
export const RACI_INTENTS = [
  'take_quest',
  'accountable',
  'consult',
  'witness',
  'observe',
  'offer_help',
  'join',
  'decline',
] as const satisfies readonly BarIntent[]

const INTENT_RACI_MAP: Partial<Record<BarIntent, RaciRole>> = {
  take_quest: 'Responsible',
  join: 'Responsible',
  accountable: 'Accountable',
  consult: 'Consulted',
  offer_help: 'Consulted',
  witness: 'Informed',
  observe: 'Informed',
  // decline → no RACI role
}

/** Maps a response intent to its RACI role (null for decline or unknown). */
export function intentToRaciRole(intent: BarIntent | string | null | undefined): RaciRole | null {
  if (!intent) return null
  return INTENT_RACI_MAP[intent as BarIntent] ?? null
}

/** A single response node in the BAR thread tree. */
export interface BarResponseNode {
  id: string
  barId: string
  responderId: string
  responseType: string
  intent: string | null
  raciRole: string | null
  depth: number
  message: string | null
  createdAt: Date
  responder: {
    id: string
    name: string
  }
  replies: BarResponseNode[]
}

/** Full thread for a BAR: the bar context + nested response tree. */
export interface BarThread {
  barId: string
  barTitle: string
  barType: string
  creatorId: string
  responses: BarResponseNode[]
}

/** RACI-grouped participant map for a BAR. */
export interface BarRoles {
  Responsible: Array<{ playerId: string; name: string; intent: string }>
  Accountable: Array<{ playerId: string; name: string; intent: string }>
  Consulted: Array<{ playerId: string; name: string; intent: string }>
  Informed: Array<{ playerId: string; name: string; intent: string }>
}

export const MAX_RESPONSE_DEPTH = 1 // max depth index (0-indexed); i.e., 2 levels total
