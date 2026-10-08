/**
 * Tap the Vein charge/blocker helpers. Kept out of the "use server" actions file —
 * a server-action module may only export async functions (same reason as
 * commit-policy.ts).
 */

import { TTV_CHARGE_LEVELS, type TtvBrainstormCandidate, type TtvChargeLevel } from './types'

/**
 * Never trust a stored charge string. Rows predate the column, and the value is
 * a free TEXT field in Postgres — an unknown level reads as "not yet assessed"
 * rather than crashing a render.
 */
export function normalizeChargeLevel(raw: string | null | undefined): TtvChargeLevel | null {
  return raw && (TTV_CHARGE_LEVELS as readonly string[]).includes(raw)
    ? (raw as TtvChargeLevel)
    : null
}

/**
 * Coerce a persisted brainstorm blob into candidates. The column is JSONB and
 * nullable, so this has to survive null, a non-array, and rows with junk shapes;
 * anything unrecognizable is dropped rather than surfaced half-formed.
 */
export function parseBrainstormCandidates(raw: unknown): TtvBrainstormCandidate[] {
  if (!Array.isArray(raw)) return []
  const out: TtvBrainstormCandidate[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const text = typeof rec.text === 'string' ? rec.text.trim() : ''
    if (!text) continue
    const fate = rec.fate
    out.push({ text, fate: fate === 'play' || fate === 'composted' ? fate : 'raw' })
  }
  return out
}

/**
 * Whole days a commitment has been blocked. Used for the "Blocked 3d" badge —
 * the number is the point: a blocker nobody sees aging is a blocker nobody clears.
 */
export function blockedDays(blockedAt: string | Date | null | undefined, now = new Date()): number {
  if (!blockedAt) return 0
  const started = blockedAt instanceof Date ? blockedAt : new Date(blockedAt)
  if (Number.isNaN(started.getTime())) return 0
  return Math.max(0, Math.floor((now.getTime() - started.getTime()) / 86_400_000))
}
