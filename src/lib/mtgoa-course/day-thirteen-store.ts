'use client'

import type { DayThirteenTurn } from './day-thirteen'

/**
 * Day 13's in-progress draft, on this device only.
 *
 * Week 3's invariant is that nothing a reader composes leaves the browser. Day 13
 * keeps that invariant whole and bends only the session-only half of it, by the
 * founder's ruling: a 3-2-1 is long enough that losing it to a stray reload is a
 * real cost, so the pass is kept while it is in progress and cleared when the
 * receipt arrives.
 *
 * The keeping is `localStorage` and nothing else. There is no server write here and
 * no network call anywhere in Day 13 — the pass lives on the reader's own device,
 * on that device only, and only while the practice is open. That is the whole of
 * what "browser, not servers" means, and it is enforced by this module holding the
 * only writer.
 *
 * Scope: one key, one day, cleared at the receipt, read by this component.
 */

export const DAY_THIRTEEN_STORAGE_KEY = 'mtgoa-day13-resourcing-321'

export type DayThirteenDraft = {
  step: string
  field: 'work' | 'own' | null
  starter: string | null
  strainText: string
  they: string
  maskName: string
  thread: DayThirteenTurn[]
  i: string
  shift: string
  missingText: string
  insteadText: string
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
export function readDayThirteenDraft(): Partial<DayThirteenDraft> | null {
  try {
    const raw = window.localStorage.getItem(DAY_THIRTEEN_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const d = parsed as Record<string, unknown>

    const thread = Array.isArray(d.thread)
      ? d.thread
          .filter((t): t is DayThirteenTurn =>
            !!t && typeof t === 'object' &&
            ((t as DayThirteenTurn).from === 'me' || (t as DayThirteenTurn).from === 'it') &&
            typeof (t as DayThirteenTurn).text === 'string')
          .slice(0, 200)
      : []

    const drawn = Array.isArray(d.drawn) && d.drawn.length === 3 && d.drawn.every((n) => typeof n === 'string')
      ? (d.drawn as string[])
      : []

    return {
      step: str(d.step),
      field: d.field === 'work' || d.field === 'own' ? d.field : null,
      starter: typeof d.starter === 'string' ? d.starter : null,
      strainText: str(d.strainText),
      they: str(d.they),
      maskName: str(d.maskName),
      thread,
      i: str(d.i),
      shift: str(d.shift),
      missingText: str(d.missingText),
      insteadText: str(d.insteadText),
      drawn,
      chosen: typeof d.chosen === 'string' ? d.chosen : null,
    }
  } catch {
    return null
  }
}

export function writeDayThirteenDraft(draft: DayThirteenDraft): void {
  try {
    window.localStorage.setItem(DAY_THIRTEEN_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // A full or blocked store costs the reader a refresh. The pass survives in
    // component state either way.
  }
}

/** Called when the receipt opens, and available to the reader by hand. */
export function clearDayThirteenDraft(): void {
  try {
    window.localStorage.removeItem(DAY_THIRTEEN_STORAGE_KEY)
  } catch {
    // The next write overwrites it anyway.
  }
}
