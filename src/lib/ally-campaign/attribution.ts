/**
 * Ally attribution for a Gumroad sale — the part that runs on the payment path.
 *
 * Split out of the webhook route rather than inlined there, for one reason: the
 * claim this code makes about itself has to be *testable*.
 *
 * The claim: **an attribution problem never fails, delays or retries a sale.** A
 * missing credit is a wrong number on a steward's dashboard. A failed webhook is
 * a buyer without their book. Those are not comparable, so attribution is
 * strictly subordinate — it gets a budget, it swallows its own errors, and it
 * returns a result nobody downstream is required to read.
 *
 * Two failure modes, and they need different defences:
 *
 *   - a THROW (bad data, constraint violation, dropped connection) — caught here
 *   - a STALL (a slow query on a loaded database) — a `try/catch` does nothing
 *     about this, and it is the likelier of the two. Gumroad retries on timeout,
 *     so a stall presents as duplicate pings rather than as an attribution bug,
 *     which is exactly the sort of failure nobody diagnoses correctly. Hence the
 *     budget.
 *
 * Dependencies are injected so both can be exercised without a database, a
 * webhook, or a network.
 */

import { allyFromGumroadPing, mergeReferralMetadata } from './referral'

/** How long attribution may occupy the payment path before it is abandoned. */
export const ATTRIBUTION_BUDGET_MS = 1_500

export interface AttributionDeps {
  /** Field accessor over the Gumroad ping payload. */
  get: (key: string) => string | null
  /** The redemption code row this sale minted. */
  codeId: string
  /** Its current metadata column. */
  currentMetadata: string | null
  /** Returns the lead id if it names a real lead, else null. */
  findLead: (id: string) => Promise<string | null>
  /** Writes the merged metadata back. */
  writeMetadata: (codeId: string, metadata: string) => Promise<void>
  /** Overridable for tests. */
  budgetMs?: number
  now?: () => Date
}

export type AttributionOutcome =
  | { credited: true; allyLeadId: string }
  | { credited: false; reason: 'no-ally-param' | 'unknown-lead' | 'error' | 'timed-out' }

/**
 * Resolve `{{ally}}` off the ping and credit the sale to that lead.
 *
 * Never throws and never exceeds its budget. The worst outcome is
 * `{ credited: false }`, which callers are free to ignore entirely.
 */
export async function attributeSale(deps: AttributionDeps): Promise<AttributionOutcome> {
  const budgetMs = deps.budgetMs ?? ATTRIBUTION_BUDGET_MS

  let timer: ReturnType<typeof setTimeout> | undefined
  const budget = new Promise<AttributionOutcome>((resolve) => {
    timer = setTimeout(() => resolve({ credited: false, reason: 'timed-out' }), budgetMs)
  })

  try {
    return await Promise.race([run(deps), budget])
  } catch {
    // Belt and braces: `run` already catches, so reaching here means something
    // truly unexpected. Still not the sale's problem.
    return { credited: false, reason: 'error' }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function run(deps: AttributionDeps): Promise<AttributionOutcome> {
  try {
    const allyLeadId = allyFromGumroadPing(deps.get)
    if (!allyLeadId) return { credited: false, reason: 'no-ally-param' }

    // Only credit ids that resolve to a real lead — otherwise a forged or stale
    // query string puts a fictional ally on the steward's board, and a number
    // nobody can trace is worse than no number.
    const lead = await deps.findLead(allyLeadId)
    if (!lead) return { credited: false, reason: 'unknown-lead' }

    const now = deps.now ?? (() => new Date())
    await deps.writeMetadata(
      deps.codeId,
      mergeReferralMetadata(deps.currentMetadata, {
        allyLeadId: lead,
        attributedAt: now().toISOString(),
      }),
    )

    return { credited: true, allyLeadId: lead }
  } catch {
    return { credited: false, reason: 'error' }
  }
}
