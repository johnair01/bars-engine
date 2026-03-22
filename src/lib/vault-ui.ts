/**
 * Vault (`/hand`) UI constants — align with [.specify/specs/vault-page-experience/spec.md](../../.specify/specs/vault-page-experience/spec.md)
 * and [UI Style Guide](/wiki/ui-style-guide): progressive disclosure, calm lists.
 */

/** When any section has more than this many items, default to collapsed. */
export const VAULT_COLLAPSE_THRESHOLD = 5

/** Initial visible rows before "Load more" (dense action lists). */
export const VAULT_LIST_PAGE_SIZE = 5

/** Max items fetched server-side per vault list (avoids unbounded payloads). */
export const VAULT_SERVER_LIST_CAP = 50

/** Nested room pages (`/hand/charges`, etc.) fetch more rows than the lobby snapshot. */
export const VAULT_ROOM_LIST_CAP = 200

/** Staleness: "idle" if created before this many days ago (CustomBar has no updatedAt). */
export const VAULT_STALE_DAYS = 30

export function daysAgoDate(days: number): Date {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d
}
