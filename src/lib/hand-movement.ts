/**
 * Shared copy + eligibility for Hand ↔ Vault movement.
 *
 * Plain module (no 'use server') — safe to import from server components and
 * client components alike. The two labels live here so the pending
 * `hand-vault-rename` can repoint the vocabulary in one place.
 *
 * See .specify/specs/hand-vault-capture-movement/spec.md
 */

import type { MaturityPhase } from '@/lib/bar-seed-metabolization'

/** Vault → Hand. */
export const HOLD_IN_HAND = 'Hold in Hand'

/** Hand → Vault (a gentle "file away" — does NOT archive/compost the BAR). */
export const RETURN_TO_VAULT = 'Return to Vault'

/** Shown when a Vault → Hand move is refused because the Hand is full. */
export const HAND_FULL_HINT = 'Hand is full (6/6) — return one first'

/**
 * Fork B (v1): the Hand ↔ Vault toggle is offered only on non-planted BARs.
 * `context_named` / `elaborated` are *planted* and home in the Garden;
 * `integrated` has graduated to Quests. Garden ↔ Hand movement is a separate
 * follow-up, so we restrict the toggle to the two phases the IA homes in the
 * Hand/Vault: `captured` and `shared_or_acted`.
 */
const MOVABLE_MATURITIES: ReadonlySet<MaturityPhase> = new Set<MaturityPhase>([
    'captured',
    'shared_or_acted',
])

export function isHandVaultMovable(maturity: MaturityPhase | null | undefined): boolean {
    // A freshly captured BAR with no metabolization record reads as `captured`.
    if (!maturity) return true
    return MOVABLE_MATURITIES.has(maturity)
}
