import type { MoveCard, Operation } from '@/lib/allyship-deck/types'

/**
 * Day 13 — Clean Up · The Resourcing 3-2-1 (pure content).
 *
 * Day 11 counts what you can reach. Day 12 holds one resource question long
 * enough to feel it. Day 13 takes the part of you that gets loud when a resource
 * actually has to move — the one that would rather cover it quietly than ask, or
 * that treats one more request as a debt — and lets it describe the job before
 * you try to fix how you resource anything.
 *
 * This is Day 8's 3-2-1 run against Week 3's field. Day 8 works the part that
 * carries an organization; this one works the part that carries the money, the
 * asking and the receiving. It shares Day 8's shape — a strain, a named part, a
 * two-voice thread, a first-person pass — and its own copy lives here, rendered
 * by `DayThirteenResourcingPart`. The `round-three.ts` row keeps the route
 * contract and the metadata.
 *
 * Clean Up asks "what move is missing?", so Day 13 ends in a missing move rather
 * than Day 8's organizing condition: the thing you could do the next time a
 * resource has to move, stated plainly and committing you to nothing.
 *
 * Authority: .specify/specs/mtgoa-day13-resourcing-321/design_handoff/
 */

/** Six canonical resourcing strains. Each is a toggle, and all of them are skippable. */
export const DAY_THIRTEEN_STARTERS: readonly string[] = [
  'I should be able to do this without help.',
  'Who am I to ask for that?',
  'It is easier to give than to receive.',
  'There is not enough to go around.',
  'If I ask, I will owe them.',
  'Something else.',
]

/**
 * The one starter that selects without asserting content.
 *
 * A reader who picks it has told us the strain is theirs to word, so the strain
 * line falls through to their free text and stays empty until they write one.
 */
export const DAY_THIRTEEN_OPEN_STARTER = 'Something else.'

/** Openers for the thread, offered only while it is empty. */
export const DAY_THIRTEEN_OPENERS: readonly string[] = [
  'What are you afraid runs out?',
  'Who taught you it was safer to give?',
  'What do you need me to understand?',
  'What happens if I ask for one thing?',
  'What are you protecting me from?',
]

/**
 * Day 13's reading of each Clean Up · Gathering Resources card.
 *
 * Keyed by operation, following Day 8: there is exactly one card per Face in
 * this pool, and the Face is the stable identity. The deck's own question still
 * shows in the card sheet.
 */
export const DAY_THIRTEEN_LENS: Record<Operation, string> = {
  shaman: 'Which feeling is actually running this — fear, anger, sadness, numbness, or reach?',
  challenger: 'Which story about deserving or scarcity are you treating as a fact?',
  regent: 'Which capability is offline — to ask, to receive, to rest, to let it be enough?',
  architect: 'If you moved this charge, would you transcend it, translate it, or set it down?',
  diplomat: 'Which feeling would the ask come from if it served the other person?',
  sage: 'What does this shortfall teach you that you get to keep?',
}

export function dayThirteenLens(card: MoveCard): string {
  return DAY_THIRTEEN_LENS[card.operation] ?? card.primaryQuestion
}

/** One turn in the 3-2-1 thread. `me` is the reader; `it` is the part. */
export type DayThirteenTurn = { from: 'me' | 'it'; text: string }

/** What the reader calls the part. Unnamed, it stays "the part" everywhere. */
export function dayThirteenPartName(name: string): string {
  return name.trim() || 'the part'
}

/**
 * The strain the 3-2-1 works.
 *
 * Free text wins over a starter when both are present, because the reader's own
 * words are always the more exact ones.
 */
export function dayThirteenStrainLine(starter: string | null, text: string): string {
  const written = text.trim()
  if (written) return written
  return starter && starter !== DAY_THIRTEEN_OPEN_STARTER ? starter : ''
}

/**
 * What Day 13 hands the reader: the missing move.
 *
 * Clean Up asks what move is missing. Day 8 produced an organizing condition;
 * this produces the small, repeatable thing the reader could do the next time a
 * resource has to move — stated plainly, committing them to nothing. Day 14 is
 * where a capacity gets a deliberate rep; Day 13 only names the move.
 *
 * Unfilled halves render as `___` so the gap stays visible.
 */
export const DAY_THIRTEEN_RECEIPT = {
  opening: 'When a resource has to move, the missing move is to',
  turn: 'instead of',
  missingPlaceholder: 'e.g. name the real ask in one plain sentence',
  insteadPlaceholder: 'e.g. quietly covering it so nobody has to say yes',
  headline: 'You let the part describe the job.',
} as const

export function dayThirteenMove(missing: string, instead: string): string {
  const a = missing.trim() || '___'
  const b = instead.trim() || '___'
  return `${DAY_THIRTEEN_RECEIPT.opening} ${a}, ${DAY_THIRTEEN_RECEIPT.turn} ${b}.`
}

export const DAY_THIRTEEN_BLANK = '— left blank'

/** The receipt record: what the reader actually did, with the gaps shown as gaps. */
export function dayThirteenReceiptRows(input: {
  strain: string
  they: string
  thread: DayThirteenTurn[]
  i: string
  shift: string
  partName: string
}): { label: string; value: string; filled: boolean }[] {
  const rows = [
    { label: 'the strain I named', raw: input.strain },
    { label: '3 · faced it as they', raw: input.they },
    {
      label: `2 · talked with ${input.partName}`,
      raw: input.thread.length
        ? `${input.thread.length} ${input.thread.length === 1 ? 'turn' : 'turns'} · last: “${input.thread[input.thread.length - 1].text}”`
        : '',
    },
    { label: '1 · spoke as I', raw: input.i },
  ]
  const out = rows.map((r) => ({
    label: r.label,
    value: r.raw.trim() || DAY_THIRTEEN_BLANK,
    filled: r.raw.trim().length > 0,
  }))
  // "What shifted" appears only when it was written — an empty row would read
  // as a question the reader failed rather than one they skipped.
  const shift = input.shift.trim()
  if (shift) out.push({ label: 'what shifted', value: shift, filled: true })
  return out
}
