/**
 * Day 14 — Grow Up · The Resourcing Rep (pure content).
 *
 * Day 13 named the move you keep skipping around resources. Day 14 does not try
 * to fix all of it. Grow Up asks which capacity you are willing to practise, so
 * this day picks one resourcing capacity and gives it a single rep — one notch
 * bigger than today — plus the signal that will tell you it grew.
 *
 * It is the Week 3 run of Day 9's Grow Up: a capacity, a rep, and a return.
 * Deliberately light — session-only, no thread, no 3-2-1 — because a rep is a
 * commitment to one small repetition, not a transformation. The copy the reader
 * reads lives on the Day 14 row in `round-three.ts`; this module holds the
 * starters and the composers, and `DayFourteenResourcingRep` renders them.
 *
 * Authority: .specify/specs/mtgoa-day14-resourcing-rep/design_handoff/
 */

/** Six resourcing capacities worth a rep. Each is a toggle, and all are skippable. */
export const DAY_FOURTEEN_CAPACITIES: readonly string[] = [
  'Making a clear ask, without softening it',
  'Receiving without rushing to repay',
  'Stewarding what I already have',
  'Letting someone else carry part of it',
  'Resting before I resource anything',
  'Something else.',
]

/**
 * The one starter that selects without asserting content.
 *
 * A reader who picks it has told us the capacity is theirs to word, so the line
 * falls through to their free text and stays empty until they write one.
 */
export const DAY_FOURTEEN_OPEN_STARTER = 'Something else.'

/**
 * The capacity the rep grows.
 *
 * Free text wins over a starter when both are present — the reader's own words
 * are the more exact ones.
 */
export function dayFourteenCapacityLine(starter: string | null, text: string): string {
  const written = text.trim()
  if (written) return written
  return starter && starter !== DAY_FOURTEEN_OPEN_STARTER ? starter : ''
}

/**
 * What Day 14 hands the reader: one rep, and the signal it grew.
 *
 * Grow Up produces a practised capacity, not a plan or a system — so the artifact
 * is a single repeatable action one notch bigger than today, with a return the
 * reader can actually notice. Unfilled halves render as `___` so the gap stays
 * visible.
 */
export const DAY_FOURTEEN_RECEIPT = {
  opening: 'One notch bigger than today, I will',
  turn: 'and I will know it grew when',
  repPlaceholder: 'e.g. make one real ask, out loud, without softening it',
  knowPlaceholder: 'e.g. I asked, and I did not take it back',
  headline: 'You chose one capacity to grow.',
} as const

export function dayFourteenRep(rep: string, know: string): string {
  const a = rep.trim() || '___'
  const b = know.trim() || '___'
  return `${DAY_FOURTEEN_RECEIPT.opening} ${a}, ${DAY_FOURTEEN_RECEIPT.turn} ${b}.`
}

export const DAY_FOURTEEN_BLANK = '— left blank'

/** The receipt record: the capacity, the rep, and the return, gaps shown as gaps. */
export function dayFourteenReceiptRows(input: {
  capacity: string
  rep: string
  know: string
}): { label: string; value: string; filled: boolean }[] {
  const rows = [
    { label: 'the capacity I am growing', raw: input.capacity },
    { label: 'the rep, one notch bigger', raw: input.rep },
    { label: 'how I will know it grew', raw: input.know },
  ]
  return rows.map((r) => ({
    label: r.label,
    value: r.raw.trim() || DAY_FOURTEEN_BLANK,
    filled: r.raw.trim().length > 0,
  }))
}
