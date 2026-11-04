/**
 * The council's weekly read of the whole context (six-faces-council `.specify/specs/unchosen-gold`, contract 4).
 *
 * Wendell, 2026-11-03: "It's foolish to rely on repeated words when we can read the whole context. What's being
 * composted and acted on are the ideas not chosen and the gold buried in the lead." So a read keeps at most five
 * nuggets of gold, each a passage of his own writing quoted word for word, and composts the fragments it found nothing
 * in. This file checks a read before anything is written and says what it would write; a read with any problem writes
 * nothing. The checks mirror council/unchosen_read.py in six-faces-council.
 *
 * Retired with this file's rewrite (FR-015): the returning-word read (`planRead`, one pattern per word, two-morning
 * quotes) and the pitch view (`toPitchViews`). The `TapTheVeinUnchosenPitch` rows stay as the record; the first read composts the live ones.
 *
 * A move is an offer, never a task (uc-no-duty), and nothing here converts a line to qi, vibeulons or spirits
 * (uc-links-by-hand).
 */

import { pitchKey, type ReadItem } from './unchosen-whole'

export const READ_MAX_GOLD = 5
export const REASON_MAX_CHARS = 240
export const MOVE_MAX_CHARS = 240
export const TITLE_MAX_CHARS = 80
/** His words never sit in a council line: six or more words in a row from a quote is refused (FR-011). */
export const QUOTE_RUN_WORDS = 6
export const DEFAULT_STRAND = 'morning-menu'

export const READ_FACES = ['shaman', 'architect', 'challenger', 'regent', 'diplomat', 'sage'] as const
export type ReadFace = (typeof READ_FACES)[number]
export const GOLD_KINDS = ['idea', 'link', 'ask', 'returning'] as const
export type GoldKind = (typeof GOLD_KINDS)[number]
export type GoldFateName = 'carried' | 'offered' | 'kept'

export type LivePitch = { id: string; word: string; pitch: string; weekOf: string }

/** One nugget as a face reads it (contract 4). `move` is the next step for a carried nugget, the drafted move for an offered one. */
export type GoldIn = {
  itemKey: string
  quote: string
  kind: GoldKind
  face: ReadFace
  reason: string
  title: string
  fate: GoldFateName
  /** True when the gold names a person, touches money or is about his own practice: it can only be offered. */
  reserved?: boolean
  strand?: string
  strandTitle?: string
  move?: string
}
export type CompostIn = { itemKey: string; salvage: string[]; feeds: string; lesson: string }

export type PlannedGold = Omit<GoldIn, 'strand'> & { day: string; from: ReadItem['from']; strand: string | null; lensGoalId: string | null }
export type PlannedCompost = CompostIn & { day: string }

export type ReadPlan = {
  weekOf: string
  gold: PlannedGold[]
  compost: PlannedCompost[]
  /** The one line at the scroll's foot saying where the week's compost went: counts only, none of his words. */
  compostLine: string
  /** Live pitches of the old read, composted by this read. */
  pitchIds: string[]
}

// tb-loss-not-avoidance: the read speaks about conditions, never about him (the same list as council/bar_read.py).
const ABOUT_HIM = /\b(avoid\w*|procrastinat\w*|resist\w*|lazy|excuse\w*|self-sabotag\w*|should have|failed to)\b/i
// uc-links-by-hand: a move never turns his lines into currency or creatures.
const CONVERTS = /\b(qi|vibeulons?|vibulons?|spirits?)\b/i

const words = (text: string) => text.toLowerCase().match(/[a-z0-9][a-z0-9'’-]*/g) ?? []

/** Whitespace-collapsed text, the form a quote is looked up in. */
function squash(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/** True when `b` holds `n` or more words in a row from `a`. */
export function sharesRun(a: string, b: string, n = QUOTE_RUN_WORDS): boolean {
  const wa = words(a)
  const wb = words(b).join(' ')
  for (let i = 0; i + n <= wa.length; i++) if (wb.includes(wa.slice(i, i + n).join(' '))) return true
  return false
}

/** The Monday of the week holding `day` (YYYY-MM-DD), so a read is keyed by the week it ran in. */
export function weekOf(day: string): string {
  const d = new Date(`${day}T00:00:00.000Z`)
  const back = (d.getUTCDay() + 6) % 7
  return new Date(d.getTime() - back * 86_400_000).toISOString().slice(0, 10)
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** What a compost entry's `feeds` names: `lens:<id>` or `strand:<id>`. */
export function feedOf(feeds: string): { kind: 'lens' | 'strand'; id: string } | null {
  const m = /^(lens|strand):(\S.*)$/.exec(feeds.trim())
  return m ? { kind: m[1] as 'lens' | 'strand', id: m[2].trim() } : null
}

export function compostLineFor(compost: { feeds: string }[]): string {
  const n = compost.length
  if (n === 0) return 'Nothing was composted this week.'
  const lens = compost.filter((c) => feedOf(c.feeds)?.kind === 'lens').length
  const strand = n - lens
  const parts = [lens ? `${lens} feeding his lenses` : '', strand ? `${strand} feeding the strands` : ''].filter(Boolean)
  return `${n} ${n === 1 ? 'fragment' : 'fragments'} composted, ${parts.join(' and ')}.`
}

/**
 * Check a weekly read against the whole context and the live pitches, and say what it would write. Returns every
 * problem found, so a face can fix the read in one go.
 */
export function planGoldRead(
  items: ReadItem[],
  live: LivePitch[],
  body: { weekOf?: unknown; gold?: unknown; compost?: unknown },
  today: string,
  readThisWeek = false,
): { plan: ReadPlan } | { problems: string[] } {
  const problems: string[] = []
  const week = weekOf(today)
  if (readThisWeek) problems.push(`the week of ${week} has been read already`)
  if (body.weekOf !== undefined && body.weekOf !== week) problems.push(`weekOf must be ${week}, the week of today`)
  if (!Array.isArray(body.gold)) return { problems: [...problems, 'gold must be a list'] }
  if (body.compost !== undefined && !Array.isArray(body.compost)) return { problems: [...problems, 'compost must be a list'] }
  const goldIn = body.gold as unknown[]
  const compostIn = (body.compost ?? []) as unknown[]
  if (goldIn.length > READ_MAX_GOLD) problems.push(`at most ${READ_MAX_GOLD} nuggets of gold, got ${goldIn.length}`)

  const byKey = new Map(items.map((i) => [i.key, i]))
  const used = new Set<string>()
  const gold: PlannedGold[] = []
  const compost: PlannedCompost[] = []

  goldIn.forEach((raw, i) => {
    const at = `gold ${i + 1}`
    const g = (raw ?? {}) as Partial<GoldIn>
    const itemKey = text(g.itemKey)
    const item = byKey.get(itemKey)
    if (!item) return problems.push(`${at}: "${itemKey}" is not an item of the whole context`)
    if (item.from === 'pitch') problems.push(`${at}: gold is a passage of his own writing, not an old pitch`)
    if (used.has(itemKey)) problems.push(`${at}: "${itemKey}" is read twice`)
    used.add(itemKey)

    const quote = squash(typeof g.quote === 'string' ? g.quote : '')
    if (!quote) problems.push(`${at}: needs the quote`)
    else if (!squash(item.text).includes(quote)) problems.push(`${at}: the quote is not in ${itemKey}, word for word`)

    if (!GOLD_KINDS.includes(g.kind as GoldKind)) problems.push(`${at}: kind must be one of ${GOLD_KINDS.join(', ')}`)
    if (!READ_FACES.includes(g.face as ReadFace)) problems.push(`${at}: face must be one of ${READ_FACES.join(', ')}`)
    const reason = text(g.reason)
    if (!reason || reason.length > REASON_MAX_CHARS) problems.push(`${at}: reason is one sentence, 1 to ${REASON_MAX_CHARS} characters`)
    const title = text(g.title)
    if (!title || title.length > TITLE_MAX_CHARS) problems.push(`${at}: title is a council title, 1 to ${TITLE_MAX_CHARS} characters`)
    // The title and the move reach callsheets when carried (FR-005, FR-011); the reason stays on his shelf.
    if (quote && sharesRun(quote, title)) problems.push(`${at}: the title holds ${QUOTE_RUN_WORDS} words in a row from the quote`)
    if (quote && sharesRun(quote, text(g.move))) problems.push(`${at}: the move holds ${QUOTE_RUN_WORDS} words in a row from the quote`)
    for (const [name, t] of [['reason', reason], ['move', text(g.move)]] as const) {
      if (ABOUT_HIM.test(t)) problems.push(`${at}: the ${name} speaks about him, not the work ("${t.match(ABOUT_HIM)![0]}")`)
      if (CONVERTS.test(t)) problems.push(`${at}: a ${name} does not turn lines into qi, vibeulons or spirits (uc-links-by-hand)`)
    }

    // FR-004, FR-006: what may move on its own and what is only offered.
    const reserved = g.reserved === true
    let strand = text(g.strand) || null
    const move = text(g.move)
    if (g.fate === 'carried') {
      if (reserved) problems.push(`${at}: reserved gold (a person, money or his practice) is offered, never carried`)
      if (!strand) {
        if (g.kind === 'ask') strand = DEFAULT_STRAND
        else problems.push(`${at}: a carried nugget needs a live strand, or kind "ask" to go to ${DEFAULT_STRAND}`)
      }
      if (!move || move.length > MOVE_MAX_CHARS) problems.push(`${at}: a carried nugget names its next step as the move, 1 to ${MOVE_MAX_CHARS} characters`)
    } else if (g.fate === 'offered') {
      if (!reserved) problems.push(`${at}: only reserved gold is offered; gold with a live strand is carried, without one it is kept`)
      if (!move || move.length > MOVE_MAX_CHARS) problems.push(`${at}: an offered nugget carries one move, 1 to ${MOVE_MAX_CHARS} characters`)
      if (!strand) problems.push(`${at}: an offered nugget names the strand that would take its move`)
    } else if (g.fate === 'kept') {
      if (reserved) problems.push(`${at}: reserved gold is offered, not kept`)
      if (strand) problems.push(`${at}: kept gold has no live strand behind it; with one it is carried`)
      strand = null
    } else problems.push(`${at}: fate must be carried, offered or kept`)

    gold.push({
      itemKey,
      quote,
      kind: g.kind as GoldKind,
      face: g.face as ReadFace,
      reason,
      title,
      fate: g.fate as GoldFateName,
      reserved,
      strand,
      strandTitle: text(g.strandTitle) || undefined,
      move: g.fate === 'kept' ? undefined : move,
      day: item.day,
      from: item.from,
      lensGoalId: item.lensGoalId,
    })
  })

  compostIn.forEach((raw, i) => {
    const at = `compost ${i + 1}`
    const c = (raw ?? {}) as Partial<CompostIn>
    const itemKey = text(c.itemKey)
    const item = byKey.get(itemKey)
    if (!item) return problems.push(`${at}: "${itemKey}" is not an item of the whole context`)
    if (used.has(itemKey)) problems.push(`${at}: "${itemKey}" is read twice`)
    used.add(itemKey)
    const salvage = Array.isArray(c.salvage) ? c.salvage.map(text).filter(Boolean) : []
    if (salvage.length < 1 || salvage.length > 3 || salvage.some((s) => s.length > REASON_MAX_CHARS)) {
      problems.push(`${at}: names one to three salvage lines, each up to ${REASON_MAX_CHARS} characters`)
    }
    if (!feedOf(text(c.feeds))) problems.push(`${at}: feeds names a lens or a strand ("lens:<id>" or "strand:<id>")`)
    const lesson = text(c.lesson)
    if (!lesson || lesson.length > REASON_MAX_CHARS) problems.push(`${at}: the lesson is one sentence, 1 to ${REASON_MAX_CHARS} characters`)
    if (ABOUT_HIM.test(lesson)) problems.push(`${at}: the lesson speaks about him, not the conditions ("${lesson.match(ABOUT_HIM)![0]}")`)
    compost.push({ itemKey, salvage, feeds: text(c.feeds), lesson, day: item.day })
  })

  // The old read's live pitches are composted in the first read (FR-012): each needs its compost record.
  for (const p of live) {
    if (!compost.some((c) => c.itemKey === pitchKey(p.id))) problems.push(`the live pitch "${p.word}" (${pitchKey(p.id)}) needs a compost entry`)
  }

  if (problems.length) return { problems }
  return { plan: { weekOf: week, gold, compost, compostLine: compostLineFor(compost), pitchIds: live.map((p) => p.id) } }
}
