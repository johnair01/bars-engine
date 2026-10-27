/**
 * Unchosen: the brainstorm lines he named on a past morning and did not choose (six-faces-council pass unchosen1,
 * positions uc-*). Wendell, 2026-10-21: "we need something to do with the ideas that aren't taken during the intake
 * so we can see emergent patterns around what's NOT been chosen".
 *
 * A line is unchosen when it stayed raw, was composted, or was marked play but never became a task or a sealed menu
 * line. Today is left out, because a morning still in progress has not chosen yet. Nothing here writes: the view
 * carries no pressure and never brings a line back unasked. A pattern is a word that returns on at least two
 * mornings, the rule ttv-lens-emerge uses, counted by mornings rather than by mentions.
 */

import { parseBrainstormCandidates } from './charge'

export type UnchosenFate = 'raw' | 'composted' | 'unpicked'

export type UnchosenLine = { day: string; text: string; fate: UnchosenFate }

export type UnchosenPattern = { word: string; days: string[]; lines: UnchosenLine[] }

export type UnchosenSessionRow = {
  sessionDate: Date | string
  brainstormCandidates: unknown
  morningMenu: unknown
  tasks: { originalText: string }[]
}

/** How far back the view reads, so the pile stays a few weeks of mornings. */
export const UNCHOSEN_WINDOW_DAYS = 60
export const UNCHOSEN_MAX_PATTERNS = 5

const MIN_PATTERN_DAYS = 2

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
    for (const c of parseBrainstormCandidates(row.brainstormCandidates)) {
      const key = norm(c.text)
      if (chosen.has(key) || seen.has(key)) continue
      seen.add(key)
      out.push({ day, text: c.text, fate: c.fate === 'play' ? 'unpicked' : c.fate })
    }
  }
  return out.sort((a, b) => (a.day === b.day ? 0 : a.day < b.day ? 1 : -1))
}

// Words too common to be a pattern. Short words (under four letters) are skipped before this list is read.
const STOP = new Set(
  (
    'about after again also back been before being both could didn does doing done down each even every from have ' +
    'here just know like make more most much need only other over really should some still such than that their ' +
    'them then there these they thing things this those through today very want what when where which while will ' +
    'with would your into onto maybe something start get going gonna'
  ).split(' '),
)

/** The words of a line that can carry a pattern, lowercased, with a plural s folded. */
export function patternWords(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z][a-z']+/g) ?? []
  const out = new Set<string>()
  for (let w of words) {
    w = w.replace(/'s$/, '').replace(/'/g, '')
    if (w.length < 4 || STOP.has(w)) continue
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 4) w = w.slice(0, -1)
    out.add(w)
  }
  return [...out]
}

/** Words that come back on two or more mornings, the most mornings first, at most `max`. */
export function unchosenPatterns(lines: UnchosenLine[], max = UNCHOSEN_MAX_PATTERNS): UnchosenPattern[] {
  const byWord = new Map<string, { days: Set<string>; lines: UnchosenLine[] }>()
  for (const line of lines) {
    for (const word of patternWords(line.text)) {
      const entry = byWord.get(word) ?? { days: new Set<string>(), lines: [] }
      entry.days.add(line.day)
      entry.lines.push(line)
      byWord.set(word, entry)
    }
  }
  return [...byWord.entries()]
    .filter(([, e]) => e.days.size >= MIN_PATTERN_DAYS)
    .map(([word, e]) => ({ word, days: [...e.days].sort().reverse(), lines: e.lines }))
    .sort((a, b) => b.days.length - a.days.length || b.lines.length - a.lines.length || a.word.localeCompare(b.word))
    .slice(0, max)
}
