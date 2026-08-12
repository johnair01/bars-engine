/**
 * Ally Campaign — shared constants and board shapes.
 *
 * These live here rather than in `src/actions/ally-campaign.ts` because a
 * `'use server'` module may only export async functions. Exporting a plain const
 * from it makes Next drop the module's exports entirely ("The module has no
 * exports at all") — so every non-function export the actions need is defined
 * here and imported by both the actions and the surfaces that render them.
 */

import { ALL_NEEDS } from './workstreams'

/** The parent campaign every workstream sub-campaign hangs off. */
export const PARENT_REF = 'mobility-quest'

/** Catalogue size, for the dashboard's "of N" denominators. */
export const TOTAL_AUTHORED_NEEDS = ALL_NEEDS.length

// ── Board row shapes (returned by `allyBoard`) ──────────────────────────────

export interface AllyBoardNeed {
  id: string
  title: string
  workstream: string
  domain: string
  superpower: string
  orientation: string
  unit: string
  value: number
  bountyVibeulons: number
  status: string
  claimedByLeadId: string | null
  claimantName: string | null
  needsHelp: boolean
}

export interface AllyBoardLead {
  id: string
  name: string | null
  contact: string | null
  campaignRef: string
  workstream: string | null
  domain: string | null
  superpower: string | null
  orientation: string | null
  status: string
  notes: string | null
  vibeulonsEarned: number
  commitments: string[]
  createdAt: string
}

export interface AllyBoardOffer {
  id: string
  body: string
  unit: string
  value: number
  domain: string | null
  status: string
  leadName: string | null
  createdAt: string
}

export interface AllyBoard {
  leads: AllyBoardLead[]
  needs: AllyBoardNeed[]
  offers: AllyBoardOffer[]
  /** Needs claimed by nobody, or explicitly flagged — the "who needs help" column. */
  unclaimed: AllyBoardNeed[]
  totals: {
    leads: number
    claimedNeeds: number
    openNeeds: number
    doneNeeds: number
    pledgedVibeulons: number
    bankedVibeulons: number
    currencyPledged: number
    hoursPledged: number
  }
}

export type AllyBoardResult = { ok: true; board: AllyBoard } | { ok: false; error: string }
