/**
 * Day 15 — Show Up · The Resourcing Move (pure content).
 *
 * The last day of Week 3. Day 11 counted what is in reach; Day 12 held one
 * resource question; Day 13 cleaned the charge; Day 14 grew one capacity. Day 15
 * turns all of it into a single real move: one concrete offer or ask, addressed
 * to one specific person, in words they can act on — with consent named and no
 * strings attached. Show Up asks what another person can actually act on, so the
 * artifact is a message a reader could send today, not a plan.
 *
 * Light and session-only, like Days 11, 12 and 14. The reader-facing copy lives
 * on the Day 15 row in `round-three.ts`; this module holds the shapes and the
 * composer, and `DayFifteenResourcingMove` renders them.
 *
 * Authority: .specify/specs/mtgoa-day15-resourcing-move/design_handoff/
 */

export type DayFifteenShape = 'offer' | 'ask'

export type DayFifteenShapeDef = {
  key: DayFifteenShape
  label: string
  prompt: string
  /** The recipient field's placeholder — a private label, never a full name. */
  recipientPlaceholder: string
  /** The move sentence, as `${start} <first> ${joiner} <second>${end}`. */
  start: string
  firstBlank: string
  joiner: string
  secondBlank: string
  end: string
}

export const DAY_FIFTEEN_SHAPES: readonly DayFifteenShapeDef[] = [
  {
    key: 'offer',
    label: 'I am offering a resource I hold.',
    prompt: 'What could you put where it is actually needed?',
    recipientPlaceholder: 'Who it is for — a name only you need.',
    start: 'I have',
    firstBlank: 'the resource',
    joiner: 'and I would like you to have it for',
    secondBlank: 'what it is for',
    end: '.',
  },
  {
    key: 'ask',
    label: 'I am asking for a resource I need.',
    prompt: 'What is the one concrete ask?',
    recipientPlaceholder: 'Who you are asking — a name only you need.',
    start: 'Could you',
    firstBlank: 'the specific ask',
    joiner: 'so that',
    secondBlank: 'what it makes possible',
    end: '?',
  },
]

/** The line that keeps the move an invitation rather than an extraction. */
export const DAY_FIFTEEN_CONSENT = 'You can say no, and it changes nothing between us.'

export const DAY_FIFTEEN_RECEIPT = {
  headline: 'You made one real move.',
  weekClose: 'That closes Week 3 · Gather Resources.',
} as const

export function dayFifteenShape(key: DayFifteenShape | null): DayFifteenShapeDef | null {
  return DAY_FIFTEEN_SHAPES.find((shape) => shape.key === key) ?? null
}

/**
 * The move sentence. Unfilled halves render as `___` so the gap stays visible.
 */
export function dayFifteenMove(shape: DayFifteenShape | null, first: string, second: string): string {
  const def = dayFifteenShape(shape)
  if (!def) return ''
  const a = first.trim() || '___'
  const b = second.trim() || '___'
  return `${def.start} ${a} ${def.joiner} ${b}${def.end}`
}

/**
 * The full message a reader could send: the move, then the consent line. Empty
 * until a shape is chosen, so the receipt shows nothing rather than a bare
 * consent line with no ask in front of it.
 */
export function dayFifteenMessage(shape: DayFifteenShape | null, first: string, second: string): string {
  const move = dayFifteenMove(shape, first, second)
  return move ? `${move} ${DAY_FIFTEEN_CONSENT}` : ''
}

export const DAY_FIFTEEN_BLANK = '— left blank'

/** The receipt record: the shape, who it is for, and the move, gaps shown as gaps. */
export function dayFifteenReceiptRows(input: {
  shape: DayFifteenShape | null
  recipient: string
  first: string
  second: string
}): { label: string; value: string; filled: boolean }[] {
  const def = dayFifteenShape(input.shape)
  const rows = [
    { label: 'the move', raw: def ? def.label : '' },
    { label: 'who it is for', raw: input.recipient },
    { label: 'the resource', raw: input.first },
    { label: 'what it is for', raw: input.second },
  ]
  return rows.map((r) => ({
    label: r.label,
    value: r.raw.trim() || DAY_FIFTEEN_BLANK,
    filled: r.raw.trim().length > 0,
  }))
}
