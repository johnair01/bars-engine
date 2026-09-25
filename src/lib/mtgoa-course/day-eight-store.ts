'use client'

import type { DayEightTurn } from './day-eight'

/**
 * Day 8's in-progress draft, on this device only.
 *
 * Week 2's invariant is that nothing a reader writes survives a refresh, and
 * every other day holds it. Day 8 is the exception, decided by the founder on
 * 2026-08-27: a 3-2-1 is long enough that losing it to a stray reload is a real
 * cost, so the pass is kept while it is in progress.
 *
 * The second half of that decision: reaching the receipt clears the storage.
 * The 3-2-1 is the most private thing the course asks for, so it lives on the
 * device only while the practice is open.
 *
 * Scope: one key, one day, cleared at the receipt, read by this component.
 */

export const DAY_EIGHT_STORAGE_KEY = 'mtgoa-day8-bottleneck-321'

export type DayEightDraft = {
  step: string
  field: 'org' | 'own' | null
  starter: string | null
  strainText: string
  they: string
  maskName: string
  thread: DayEightTurn[]
  i: string
  shift: string
  needsText: string
  becauseText: string
  /** Card numbers, so a restored hand is the hand the reader was dealt. */
  drawn: string[]
  chosen: string | null
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

/**
 * Read a draft back.
 *
 * Every field is re-checked on the way in. Browser storage is writable by
 * anything on the device, and a malformed draft costs the reader their pass
 * while the page keeps rendering.
 */
export function readDayEightDraft(): Partial<DayEightDraft> | null {
  try {
    const raw = window.localStorage.getItem(DAY_EIGHT_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const d = parsed as Record<string, unknown>

    const thread = Array.isArray(d.thread)
      ? d.thread
          .filter((t): t is DayEightTurn =>
            !!t && typeof t === 'object' &&
            ((t as DayEightTurn).from === 'me' || (t as DayEightTurn).from === 'it') &&
            typeof (t as DayEightTurn).text === 'string')
          .slice(0, 200)
      : []

    const drawn = Array.isArray(d.drawn) && d.drawn.length === 3 && d.drawn.every((n) => typeof n === 'string')
      ? (d.drawn as string[])
      : []

    return {
      step: str(d.step),
      field: d.field === 'org' || d.field === 'own' ? d.field : null,
      starter: typeof d.starter === 'string' ? d.starter : null,
      strainText: str(d.strainText),
      they: str(d.they),
      maskName: str(d.maskName),
      thread,
      i: str(d.i),
      shift: str(d.shift),
      needsText: str(d.needsText),
      becauseText: str(d.becauseText),
      drawn,
      chosen: typeof d.chosen === 'string' ? d.chosen : null,
    }
  } catch {
    return null
  }
}

export function writeDayEightDraft(draft: DayEightDraft): void {
  try {
    window.localStorage.setItem(DAY_EIGHT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // A full or blocked store costs the reader a refresh. The pass survives in
    // component state either way.
  }
}

/** Called when the receipt opens, and available to the reader by hand. */
export function clearDayEightDraft(): void {
  try {
    window.localStorage.removeItem(DAY_EIGHT_STORAGE_KEY)
  } catch {
    // The next write overwrites it anyway.
  }
}
