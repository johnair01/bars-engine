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

// ── The ally's own view (accountless, capability-scoped) ────────────────────

export interface AllyTask {
  id: string
  title: string
  detail: string
  workstream: string
  domain: string
  unit: string
  value: number
  bountyVibeulons: number
  /** 'claimed' | 'done' for held tasks; always 'open' for available ones. */
  status: string
  /** True when this task matches the ally's revealed superpower. */
  matchesSuperpower: boolean
}

export interface AllyProgress {
  leadId: string
  name: string | null
  superpower: string | null
  orientation: string | null
  domain: string | null
  workstream: string | null
  /** Bounties banked from completed work. Pledged work is not counted here. */
  vibeulonsEarned: number
  /** Bounty energy riding on work they hold but have not finished. */
  vibeulonsPledged: number
  /** What they're holding right now. */
  held: AllyTask[]
  /** Still-open work, their superpower first — so returning has a point. */
  available: AllyTask[]
  /** What they offered the collective, and where the steward took it. */
  offers: { id: string; body: string; status: string; createdAt: string }[]
  joinedAt: string
}

export type AllyProgressResult =
  | { ok: true; progress: AllyProgress }
  | { ok: false; error: string }
