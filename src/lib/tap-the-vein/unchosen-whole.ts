/**
 * The whole context the council reads each week (six-faces-council `.specify/specs/unchosen-gold`, FR-001, contract 1).
 *
 * Everything since the last read in one answer: each morning's free write, every unchosen brainstorm line with its fate,
 * each seed with what became of it, the old read's live pitches, and his Lens goals as context. Nothing here counts a
 * word or matches a keyword. Pure: the store loads the rows, this shapes them.
 *
 * Every item carries a stable `key` (`<day>:fw` for a free write, `<day>:b:<n>` for a line, `seed:<id>` for a seed,
 * `pitch:<id>` for an old pitch) so a read can name what it kept and what it composted, and the next read can leave out
 * what an earlier read already handled.
 */

import type { UnchosenLine } from './unchosen'
import type { VeinHistoryExport } from './vein-history'

export type WholeLine = { key: string; text: string; fate: UnchosenLine['fate'] }
export type WholeSeed = {
  key: string
  text: string
  status: string
  carries: number
  compostReason: string | null
  lensGoalId: string | null
}
export type WholeMorning = { day: string; freeWrite: string; sealed: boolean; lines: WholeLine[]; seeds: WholeSeed[] }
export type WholePitch = { id: string; word: string; pitch: string; weekOf: string }
export type WholeContext = {
  since: string
  lastRead: string | null
  mornings: WholeMorning[]
  pitches: WholePitch[]
  lensGoals: { id: string; title: string }[]
}

/** One thing the read can quote from or compost, flattened out of the whole context. */
export type ReadItem = {
  key: string
  day: string
  from: 'freeWrite' | 'line' | 'seed' | 'pitch'
  text: string
  lensGoalId: string | null
}

export const freeWriteKey = (day: string) => `${day}:fw`
export const seedKey = (taskId: string) => `seed:${taskId}`
export const pitchKey = (id: string) => `pitch:${id}`

/**
 * Join the unchosen pile with the vein history. `handled` holds the keys an earlier read already kept as gold or
 * composted; they are left out, and an item the read neither kept nor composted stays in and is read again.
 */
export function toWholeContext(input: {
  pile: UnchosenLine[]
  history: VeinHistoryExport
  pitches: WholePitch[]
  lensGoals: { id: string; title: string }[]
  today: string
  lastRead: string | null
  handled: Set<string>
}): WholeContext {
  const { history, today, handled } = input
  const byDay = new Map<string, WholeMorning>()
  const morning = (day: string): WholeMorning => {
    let m = byDay.get(day)
    if (!m) byDay.set(day, (m = { day, freeWrite: '', sealed: false, lines: [], seeds: [] }))
    return m
  }
  // A morning still in progress has not chosen yet (the same rule the Not chosen view keeps).
  for (const d of history.days) {
    if (d.date >= today) continue
    const m = morning(d.date)
    if (d.freewrite.trim() && !handled.has(freeWriteKey(d.date))) m.freeWrite = d.freewrite
    m.sealed = d.sealedAt !== null
    for (const s of d.seeds) {
      if (handled.has(seedKey(s.id))) continue
      m.seeds.push({ key: seedKey(s.id), text: s.text, status: s.status, carries: s.carryCount, compostReason: s.compostReason, lensGoalId: s.lensGoalId })
    }
  }
  for (const l of [...input.pile].reverse()) {
    if (handled.has(l.key)) continue
    morning(l.day).lines.push({ key: l.key, text: l.text, fate: l.fate })
  }
  const mornings = [...byDay.values()]
    .map((m) => ({ ...m, lines: m.lines.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true })) }))
    .filter((m) => m.freeWrite || m.lines.length || m.seeds.length)
    .sort((a, b) => (a.day < b.day ? -1 : 1))
  return { since: history.since, lastRead: input.lastRead, mornings, pitches: input.pitches, lensGoals: input.lensGoals }
}

/** Every quotable or compostable item of a whole context, keyed. */
export function itemsOf(whole: WholeContext): ReadItem[] {
  const items: ReadItem[] = []
  for (const m of whole.mornings) {
    if (m.freeWrite) items.push({ key: freeWriteKey(m.day), day: m.day, from: 'freeWrite', text: m.freeWrite, lensGoalId: null })
    for (const l of m.lines) items.push({ key: l.key, day: m.day, from: 'line', text: l.text, lensGoalId: null })
    for (const s of m.seeds) items.push({ key: s.key, day: m.day, from: 'seed', text: s.text, lensGoalId: s.lensGoalId })
  }
  for (const p of whole.pitches) items.push({ key: pitchKey(p.id), day: p.weekOf, from: 'pitch', text: p.pitch, lensGoalId: null })
  return items
}
