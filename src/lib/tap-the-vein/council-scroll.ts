/**
 * The council's scroll on his shelf (six-faces-council `.specify/specs/unchosen-gold`, FR-007 to FR-010, contract 5).
 *
 * A weekly read writes one `council_scroll` BAR and up to five `unchosen_gold` BARs (contracts 2 and 4). This file turns
 * those rows into what the nook's shelf draws, and checks the two writes the shelf may make: opening a scroll writes
 * `openedAt` once, and a ribbon on an offered nugget writes its answer once. Pure functions; the route does the reads.
 */

export const SCROLL_TYPE = 'council_scroll'
export const GOLD_TYPE = 'unchosen_gold'
export const GOLD_FATES = ['carried', 'offered', 'kept'] as const
export type GoldFate = (typeof GOLD_FATES)[number]
export const SCROLL_ANSWERS = ['yes', 'later', 'no'] as const
export type ScrollAnswer = (typeof SCROLL_ANSWERS)[number]

/** A nugget's kind in plain words, as the paper says it (FR-010). */
const KIND_WORDS: Record<string, string> = {
  idea: 'an idea',
  link: 'a link between two things',
  ask: 'an ask',
  returning: 'something that came back',
}
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export type BarRow = { id: string; title: string; description: string; status: string; strandMetadata: string | null }

export type ShelfNugget = {
  id: string
  kind: GoldFate
  day: string
  what: string
  quote: string
  why: string
  went?: string
  move?: string
  answer: ScrollAnswer | null
}
export type ShelfScroll = { id: string; week: string; opened: boolean; gold: ShelfNugget[]; compost: string }

export function parseMeta(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {}
  try {
    const v = JSON.parse(raw)
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const isoDay = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

/** "2026-11-03" is a Tuesday; the paper names the weekday, never the date string. */
export function dayWord(day: unknown): string {
  const d = isoDay(day)
  if (!d) return ''
  return DAYS[new Date(d + 'T12:00:00Z').getUTCDay()]
}
/** The week a scroll covers, in words: "the week of 27 October". */
export function weekWords(weekOf: unknown): string {
  const d = isoDay(weekOf)
  if (!d) return 'this week'
  const t = new Date(d + 'T12:00:00Z')
  return `the week of ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`
}
/** A strand's id in words, for when the read left no title ("money-block" -> "Money block"). No id reaches the paper. */
export function strandWords(meta: Record<string, unknown>): string {
  const title = str(meta.strandTitle).trim()
  if (title) return title
  const id = str(meta.strand).trim().replace(/[-_]+/g, ' ')
  return id ? id[0].toUpperCase() + id.slice(1) : 'the council'
}

export function toNugget(bar: BarRow): ShelfNugget | null {
  const m = parseMeta(bar.strandMetadata)
  const fate = str(m.fate) as GoldFate
  if (!GOLD_FATES.includes(fate)) return null
  const answer = SCROLL_ANSWERS.includes(m.answer as ScrollAnswer) ? (m.answer as ScrollAnswer) : null
  const n: ShelfNugget = {
    id: bar.id,
    kind: fate,
    day: dayWord(m.day),
    what: KIND_WORDS[str(m.kind)] || 'an idea',
    quote: bar.description,
    why: str(m.reason).slice(0, 240),
    answer,
  }
  if (fate === 'carried') n.went = `Taken into ${strandWords(m)}`
  if (fate === 'offered') n.move = str(m.move).slice(0, 240)
  return n
}

/** One scroll as the shelf draws it, its nuggets in the order the read wrote them (contract 4, FR-008). */
export function toShelfScroll(scroll: BarRow, gold: BarRow[]): ShelfScroll {
  const m = parseMeta(scroll.strandMetadata)
  const ids = Array.isArray(m.goldIds) ? (m.goldIds as unknown[]).filter((x): x is string => typeof x === 'string') : []
  const byId = new Map(gold.map(g => [g.id, g]))
  const nuggets = ids.map(id => byId.get(id)).filter((g): g is BarRow => !!g).map(toNugget).filter((n): n is ShelfNugget => !!n)
  return {
    id: scroll.id,
    week: weekWords(m.weekOf),
    opened: typeof m.openedAt === 'string',
    gold: nuggets.slice(0, 5),
    compost: str(m.compostLine),
  }
}

export type ScrollWrite = { scrollId: string; open: true } | { goldId: string; answer: ScrollAnswer }
export function parseScrollWrite(body: unknown): ScrollWrite | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (typeof b.scrollId === 'string' && b.open === true) return { scrollId: b.scrollId, open: true }
  if (typeof b.goldId === 'string' && SCROLL_ANSWERS.includes(b.answer as ScrollAnswer)) {
    return { goldId: b.goldId, answer: b.answer as ScrollAnswer }
  }
  return null
}

/** Opening writes `openedAt` once and nothing else (FR-009). Null when it is already open. */
export function openedMeta(meta: Record<string, unknown>, now: Date): Record<string, unknown> | null {
  if (typeof meta.openedAt === 'string') return null
  return { ...meta, openedAt: now.toISOString() }
}

/**
 * A ribbon on an offered nugget (FR-007): writes the answer once. Yes waits for the next read to carry the move; Another
 * time keeps the nugget; No composts the BAR with no reason asked. Anything but an unanswered offered nugget is refused.
 */
export function answeredGold(
  meta: Record<string, unknown>,
  answer: ScrollAnswer,
  now: Date,
): { meta: Record<string, unknown>; status?: string } | { error: string } {
  if (meta.fate !== 'offered') return { error: 'Only an offered nugget takes a ribbon' }
  if (meta.answer) return { error: 'This one is already answered' }
  const next = { ...meta, answer, answeredAt: now.toISOString() }
  return answer === 'no' ? { meta: next, status: 'composted' } : { meta: next }
}
