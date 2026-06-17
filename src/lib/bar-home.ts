/**
 * Maturity → home location.
 *
 * A BAR's home surface follows its maturity phase (location-follows-maturity,
 * per .specify/specs/home-vault-ia-redesign). This is the single source of
 * truth for "where does this BAR live" so the Now/Garden/Hand glances agree
 * instead of scattering the mapping across conditionals.
 *
 * Note: the `captured` phase resolves to Hand OR Vault depending on whether a
 * HandSlot binds it — that is membership state, not maturity, so this helper
 * returns `capture` for that phase. Callers that know HandSlot presence can
 * refine `capture` → `hand` | `vault`.
 */

import type { MaturityPhase } from '@/lib/bar-seed-metabolization/types'

export type BarHome = 'capture' | 'garden' | 'hand' | 'quests'

const MATURITY_HOME: Record<MaturityPhase, BarHome> = {
    captured: 'capture', // Hand or Vault, per capture choice / HandSlot presence
    context_named: 'garden', // planted in soil
    elaborated: 'garden', // mid-growth
    shared_or_acted: 'hand', // ready to play
    integrated: 'quests', // graduated out of the nursery
}

/** Default home when a BAR has no maturity stamp yet (treat as a raw capture). */
const DEFAULT_HOME: BarHome = 'capture'

/** Where a BAR of the given maturity lives. */
export function barHomeForMaturity(maturity: MaturityPhase | null | undefined): BarHome {
    if (!maturity) return DEFAULT_HOME
    return MATURITY_HOME[maturity] ?? DEFAULT_HOME
}

/**
 * Refine the `capture` home using HandSlot presence: a captured BAR bound to a
 * hand slot lives in the Hand; otherwise the Vault.
 */
export function resolveBarHome(
    maturity: MaturityPhase | null | undefined,
    inHand: boolean,
): Exclude<BarHome, 'capture'> | 'vault' {
    const home = barHomeForMaturity(maturity)
    if (home === 'capture') return inHand ? 'hand' : 'vault'
    return home
}

/** Route for a home surface (used by glances / "go to this BAR" links). */
export const BAR_HOME_ROUTE: Record<Exclude<BarHome, 'capture'> | 'vault', string> = {
    garden: '/bars/garden',
    hand: '/vault', // the Hand modal lives in the play space; Vault page is its out-of-world view
    vault: '/vault',
    quests: '/adventures',
}
