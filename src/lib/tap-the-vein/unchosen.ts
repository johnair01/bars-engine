/**
 * Unchosen: the brainstorm lines he named on a past morning and did not choose (six-faces-council pass unchosen1,
 * positions uc-*). Wendell, 2026-10-21: "we need something to do with the ideas that aren't taken during the intake
 * so we can see emergent patterns around what's NOT been chosen".
 *
 * A line is unchosen when it stayed raw, was composted, or was marked play but never became a task or a sealed menu
 * line. Today is left out, because a morning still in progress has not chosen yet. Nothing here writes: the view
 * carries no pressure and never brings a line back unasked.
 *
 * Retired 2026-11-04 (six-faces-council `.specify/specs/unchosen-gold`, FR-015): `patternWords` and `unchosenPatterns`
 * counted words that return across mornings. Wendell, 2026-11-03: "It's foolish to rely on repeated words when we can
 * read the whole context". The council now reads the whole context (`unchosen-whole.ts`) and the view shows no patterns.
 */

import { parseBrainstormCandidates } from './charge'

export type UnchosenFate = 'raw' | 'composted' | 'unpicked'

export type UnchosenLine = {
  /** `<day>:b:<index>`: the day, the brainstorm field and the line's place in it, stable across reads. */
  key: string
  day: string
  text: string
  fate: UnchosenFate
  /** The council's read composted this line; the view shows it muted as residue (FR-013). Set by the action, not here. */
  residue?: boolean
}

export type UnchosenSessionRow = {
  sessionDate: Date | string
  brainstormCandidates: unknown
  morningMenu: unknown
  tasks: { originalText: string }[]
}

/** How far back the view reads, so the pile stays a few weeks of mornings. */
export const UNCHOSEN_WINDOW_DAYS = 60

function dayOf(d: Date | string): string {
  return (typeof d === 'string' ? d : d.toISOString()).slice(0, 10)
}

function norm(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function sealedTexts(menu: unknown): string[] {
  if (!menu || typeof menu !== 'object') return []
  const sealed = (menu as { sealed?: unknown }).sealed
  if (!Array.isArray(sealed)) return []
  return sealed.flatMap((item) =>
    item && typeof item === 'object' && typeof (item as { text?: unknown }).text === 'string'
      ? [(item as { text: string }).text]
      : [],
  )
}

/** Every unchosen line before `today`, newest morning first, in the order he wrote them within a morning. */
export function toUnchosen(rows: UnchosenSessionRow[], today: string): UnchosenLine[] {
  const out: UnchosenLine[] = []
  for (const row of rows) {
    const day = dayOf(row.sessionDate)
    if (day >= today) continue
    const chosen = new Set([...row.tasks.map((t) => norm(t.originalText)), ...sealedTexts(row.morningMenu).map(norm)])
    const seen = new Set<string>()
    parseBrainstormCandidates(row.brainstormCandidates).forEach((c, index) => {
      const text = norm(c.text)
      if (chosen.has(text) || seen.has(text)) return
      seen.add(text)
      out.push({ key: `${day}:b:${index}`, day, text: c.text, fate: c.fate === 'play' ? 'unpicked' : c.fate })
    })
  }
  return out.sort((a, b) => (a.day === b.day ? 0 : a.day < b.day ? 1 : -1))
}
