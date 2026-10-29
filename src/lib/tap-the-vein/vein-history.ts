/**
 * The vein history: past Tap the Vein days with their free writes and the seeds
 * committed from them, for the six-faces council (Six-faces-council pass
 * ttv-loop 1, 2026-10-16).
 *
 * Wendell, 2026-10-16: "I need a way for lenses to emerge through a council
 * analysis of saved tap the vein (with the idea that my freewrites would have the
 * seeds of my long term goals)". The free write already lives here, on the private
 * server (TapTheVeinDailySession.rawEntry); this export is the one read path for
 * that purpose. Each seed carries its BAR's maturity, so the council can also see
 * which tasks grew and which were composted.
 *
 * Pure: the route loads rows, this shapes them, so the shape is testable without a
 * database.
 */

import { effectiveMaturity, parseSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import type { MaturityPhase } from '@/lib/bar-seed-metabolization/types'

export const VEIN_HISTORY_VERSION = 1
export const VEIN_HISTORY_DEFAULT_DAYS = 90
export const VEIN_HISTORY_MAX_DAYS = 366

export type VeinSessionRow = {
  sessionDate: Date
  status: string
  sealedAt: Date | null
  rawEntry: string
  wordCount: number
  lensCategory: string | null
  tasks: VeinTaskRow[]
}

export type VeinTaskRow = {
  id: string
  originalText: string
  status: string
  lensGoalId: string | null
  barId: string | null
  questId: string | null
  chargeLevel: string | null
  blockedAt: Date | null
  carryCount: number
  completedAt: Date | null
  compostReason: string | null
  /** How many notes he has written on the task; the route counts them, their text never leaves. */
  _count?: { notes: number }
}

export type VeinBarRow = { id: string; seedMetabolization: string | null; archivedAt: Date | null }

export type VeinSeed = {
  id: string
  text: string
  status: string
  lensGoalId: string | null
  barId: string | null
  /** The BAR's maturity when the task projects into one; null when it has no BAR yet. */
  maturity: MaturityPhase | 'composted' | null
  questId: string | null
  chargeLevel: string | null
  blocked: boolean
  /** When he marked it blocked, or null. */
  blockedAt: string | null
  /** How many notes he has written on it (context, blocker, unblock, charge). Only the count; the notes stay his. */
  notes: number
  carryCount: number
  completedAt: string | null
  compostReason: string | null
}

export type VeinDay = {
  date: string
  status: string
  sealedAt: string | null
  /** The free write, verbatim. Empty when the day had none. */
  freewrite: string
  wordCount: number
  lensDomain: string | null
  seeds: VeinSeed[]
}

export type VeinHistoryExport = {
  version: typeof VEIN_HISTORY_VERSION
  readAt: string
  since: string
  days: VeinDay[]
}

const iso = (d: Date | null) => (d ? d.toISOString() : null)
const day = (d: Date) => d.toISOString().slice(0, 10)

/** `since` as YYYY-MM-DD, or the default window back from `now`. Returns null for a malformed date. */
export function parseSince(raw: string | null, now: Date): Date | null {
  if (!raw) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - VEIN_HISTORY_DEFAULT_DAYS)
    return new Date(`${day(d)}T00:00:00.000Z`)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const d = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return null
  const floor = new Date(now)
  floor.setUTCDate(floor.getUTCDate() - VEIN_HISTORY_MAX_DAYS)
  return d < floor ? new Date(`${day(floor)}T00:00:00.000Z`) : d
}

export function seedMaturity(bar: VeinBarRow | undefined): VeinSeed['maturity'] {
  if (!bar) return null
  if (bar.archivedAt) return 'composted'
  return effectiveMaturity(parseSeedMetabolization(bar.seedMetabolization))
}

/** Oldest day first, so a reader meets the free writes in the order he wrote them. */
export function toVeinHistory(
  sessions: VeinSessionRow[],
  bars: VeinBarRow[],
  since: Date,
  now: Date,
): VeinHistoryExport {
  const byId = new Map(bars.map((b) => [b.id, b]))
  const days = [...sessions]
    .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime())
    .map<VeinDay>((s) => ({
      date: day(s.sessionDate),
      status: s.status,
      sealedAt: iso(s.sealedAt),
      freewrite: s.rawEntry ?? '',
      wordCount: s.wordCount,
      lensDomain: s.lensCategory,
      seeds: s.tasks.map((t) => ({
        id: t.id,
        text: t.originalText,
        status: t.status,
        lensGoalId: t.lensGoalId,
        barId: t.barId,
        maturity: t.barId ? seedMaturity(byId.get(t.barId)) : null,
        questId: t.questId,
        chargeLevel: t.chargeLevel,
        blocked: t.blockedAt !== null,
        blockedAt: iso(t.blockedAt),
        notes: t._count?.notes ?? 0,
        carryCount: t.carryCount,
        completedAt: iso(t.completedAt),
        compostReason: t.compostReason,
      })),
    }))
    // A day with neither a free write nor a seed has nothing for the council to read.
    .filter((d) => d.freewrite.trim() !== '' || d.seeds.length > 0)
  return { version: VEIN_HISTORY_VERSION, readAt: now.toISOString(), since: day(since), days }
}
