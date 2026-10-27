/**
 * The council's weekly read of the unchosen lines (six-faces-council pass unchosen1, question uc-who-reads). Wendell
 * answered B on 2026-10-21: once a week a board read reads the pile here, in place, keeps no copy, and writes back at
 * most five patterns, each quoting his lines from two or more mornings with their dates.
 *
 * His steer on uc-pattern-returns, 2026-10-21: "And we should intelligently pitch a new action item based on the fact
 * it's coming back. Then compost the old one. this way these unchosen fragments get better and more aligned over time".
 * So each pattern carries one pitch, and when a pattern returns in a later week the new pitch takes the old one's place
 * and the old one is composted, kept muted beside it so he can see the pitch sharpen.
 *
 * A pitch is an offer, never a task (uc-no-duty): nothing here writes into his day, reminds him or converts a line to
 * qi, vibeulons or spirits (uc-links-by-hand). The checks mirror council/unchosen_read.py in six-faces-council.
 */

import { patternWords, type UnchosenLine } from './unchosen'

export const READ_MAX_PATTERNS = 5
export const PITCH_MAX_CHARS = 240
export const KERNEL_MAX_CHARS = 240
const MIN_DAYS = 2

export const READ_FACES = ['shaman', 'architect', 'challenger', 'regent', 'diplomat', 'sage'] as const
export type ReadFace = (typeof READ_FACES)[number]

export type Quote = { day: string; text: string }

/** One pattern as a face reads it: the returning word, what it reaches for, one action item, and his lines quoted. */
export type ReadPattern = { word: string; face: ReadFace; kernel: string; pitch: string; quotes: Quote[] }

export type LivePitch = { id: string; word: string; pitch: string; weekOf: string }

export type PitchView = {
  id: string
  word: string
  face: string
  kernel: string
  pitch: string
  quotes: Quote[]
  weekOf: string
  /** The pitches this one replaced, newest first, each composted the week its pattern returned. */
  composted: { pitch: string; weekOf: string }[]
}

export type ReadPlan = {
  weekOf: string
  create: ReadPattern[]
  /** Live pitches whose pattern returned this week: composted, and replaced by the new pitch for the same word. */
  compost: { id: string; word: string; replacedBy: string }[]
}

// tb-loss-not-avoidance: the read speaks about conditions, never about him (the same list as council/bar_read.py).
const ABOUT_HIM = /\b(avoid\w*|procrastinat\w*|resist\w*|lazy|excuse\w*|self-sabotag\w*|should have|failed to)\b/i
// uc-links-by-hand: a pitch never turns his lines into currency or creatures.
const CONVERTS = /\b(qi|vibeulons?|vibulons?|spirits?)\b/i

function norm(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** The Monday of the week holding `day` (YYYY-MM-DD), so a read is keyed by the week it ran in. */
export function weekOf(day: string): string {
  const d = new Date(`${day}T00:00:00.000Z`)
  const back = (d.getUTCDay() + 6) % 7
  return new Date(d.getTime() - back * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Check a weekly read against the pile and the live pitches, and say what it would write. Returns every problem found,
 * so a face can fix the read in one go; a read with any problem writes nothing.
 */
export function planRead(
  pile: UnchosenLine[],
  live: LivePitch[],
  patterns: unknown,
  today: string,
  readThisWeek = false,
): { plan: ReadPlan } | { problems: string[] } {
  const problems: string[] = []
  const week = weekOf(today)
  if (readThisWeek) problems.push(`the week of ${week} has been read already`)
  if (!Array.isArray(patterns)) return { problems: [...problems, 'patterns must be a list'] }
  if (patterns.length > READ_MAX_PATTERNS) problems.push(`at most ${READ_MAX_PATTERNS} patterns, got ${patterns.length}`)

  const inPile = new Set(pile.map((l) => `${l.day}|${norm(l.text)}`))
  const liveByWord = new Map(live.map((p) => [norm(p.word), p]))
  const words = new Set<string>()
  const create: ReadPattern[] = []
  const compost: ReadPlan['compost'] = []

  patterns.forEach((raw, i) => {
    const at = `pattern ${i + 1}`
    const p = (raw ?? {}) as Partial<ReadPattern>
    const word = typeof p.word === 'string' ? patternWords(p.word)[0] ?? '' : ''
    if (!word) return problems.push(`${at}: needs a word that can carry a pattern (four letters or more, not filler)`)
    if (words.has(word)) problems.push(`${at}: "${word}" is read twice`)
    words.add(word)
    if (!READ_FACES.includes(p.face as ReadFace)) problems.push(`${at}: face must be one of ${READ_FACES.join(', ')}`)
    const kernel = typeof p.kernel === 'string' ? p.kernel.trim() : ''
    const pitch = typeof p.pitch === 'string' ? p.pitch.trim() : ''
    if (!kernel || kernel.length > KERNEL_MAX_CHARS) problems.push(`${at}: kernel is one sentence, 1 to ${KERNEL_MAX_CHARS} characters`)
    if (!pitch || pitch.length > PITCH_MAX_CHARS) problems.push(`${at}: pitch is one action item, 1 to ${PITCH_MAX_CHARS} characters`)
    for (const [name, text] of [['kernel', kernel], ['pitch', pitch]] as const) {
      if (ABOUT_HIM.test(text)) problems.push(`${at}: the ${name} speaks about him, not the conditions ("${text.match(ABOUT_HIM)![0]}")`)
    }
    if (CONVERTS.test(pitch)) problems.push(`${at}: a pitch does not turn lines into qi, vibeulons or spirits (uc-links-by-hand)`)

    const quotes = Array.isArray(p.quotes) ? p.quotes : []
    const days = new Set<string>()
    quotes.forEach((q, j) => {
      const day = typeof q?.day === 'string' ? q.day : ''
      const text = typeof q?.text === 'string' ? q.text : ''
      if (!inPile.has(`${day}|${norm(text)}`)) problems.push(`${at}, quote ${j + 1}: not an unchosen line of ${day || 'that day'}, word for word`)
      else if (!patternWords(text).includes(word)) problems.push(`${at}, quote ${j + 1}: does not hold the word "${word}"`)
      else days.add(day)
    })
    if (days.size < MIN_DAYS) problems.push(`${at}: quotes his lines from ${days.size} morning(s); a pattern needs ${MIN_DAYS}`)

    const old = liveByWord.get(word)
    if (old) {
      if (norm(old.pitch) === norm(pitch)) problems.push(`${at}: "${word}" came back, so it needs a new pitch, not the one from ${old.weekOf}`)
      compost.push({ id: old.id, word, replacedBy: pitch })
    }
    create.push({ word, face: p.face as ReadFace, kernel, pitch, quotes: quotes.map((q) => ({ day: q.day, text: q.text })) })
  })

  return problems.length ? { problems } : { plan: { weekOf: week, create, compost } }
}

type PitchRow = {
  id: string
  word: string
  face: string
  kernel: string
  pitch: string
  quotes: unknown
  weekOf: Date | string
  status: string
  replacedById: string | null
}

const dayOf = (d: Date | string) => (typeof d === 'string' ? d : d.toISOString()).slice(0, 10)

/** Live pitches for the view, newest week first, each with the chain of pitches it composted. */
export function toPitchViews(rows: PitchRow[]): PitchView[] {
  const byReplacer = new Map<string, PitchRow>()
  for (const r of rows) if (r.replacedById) byReplacer.set(r.replacedById, r)
  return rows
    .filter((r) => r.status === 'live')
    .map((r) => {
      const composted: PitchView['composted'] = []
      for (let prev = byReplacer.get(r.id); prev && composted.length < 10; prev = byReplacer.get(prev.id)) {
        composted.push({ pitch: prev.pitch, weekOf: dayOf(prev.weekOf) })
      }
      const quotes = Array.isArray(r.quotes) ? (r.quotes as Quote[]) : []
      return { id: r.id, word: r.word, face: r.face, kernel: r.kernel, pitch: r.pitch, quotes, weekOf: dayOf(r.weekOf), composted }
    })
    .sort((a, b) => (a.weekOf === b.weekOf ? a.word.localeCompare(b.word) : a.weekOf < b.weekOf ? 1 : -1))
}
