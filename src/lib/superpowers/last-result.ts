'use client'

/**
 * Superpower quiz — last-result cache (client-only, best-effort).
 *
 * The superpower quiz is deterministic and store-less by design (no DB, no email
 * gate). To let *other* surfaces opportunistically carry a visitor's result
 * across a route change — e.g. the Kickstarter hub self-report enriching a
 * steward lead with the superpower the visitor just discovered — the reveal
 * writes a tiny record to localStorage and readers pick it up if present.
 *
 * Best-effort only: guarded for SSR and for storage that throws (private mode,
 * quota). A missing/expired record simply means "we don't know their superpower"
 * — never an error. Nothing sensitive is stored.
 */

export const SUPERPOWER_RESULT_KEY = 'bars:superpower-result'

/** How long a cached result is considered fresh (24h). */
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export interface CachedSuperpowerResult {
  superpower: string
  orientation: 'internal' | 'external' | null
  at: number
}

export function cacheSuperpowerResult(input: {
  superpower: string
  orientation: 'internal' | 'external' | null
}): void {
  if (typeof window === 'undefined') return
  try {
    const record: CachedSuperpowerResult = {
      superpower: input.superpower,
      orientation: input.orientation,
      at: Date.now(),
    }
    window.localStorage.setItem(SUPERPOWER_RESULT_KEY, JSON.stringify(record))
  } catch {
    /* private mode / quota — carrying the result is a nicety, never required */
  }
}

export function readCachedSuperpowerResult(): CachedSuperpowerResult | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SUPERPOWER_RESULT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CachedSuperpowerResult>
    if (typeof parsed?.superpower !== 'string' || typeof parsed?.at !== 'number') return null
    if (Date.now() - parsed.at > MAX_AGE_MS) return null
    const orientation =
      parsed.orientation === 'internal' || parsed.orientation === 'external'
        ? parsed.orientation
        : null
    return { superpower: parsed.superpower, orientation, at: parsed.at }
  } catch {
    return null
  }
}
