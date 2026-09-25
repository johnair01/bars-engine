import type { MoveCard, Operation } from '@/lib/allyship-deck/types'

/**
 * Day 8 — Clean Up · The Organization Bottleneck 3-2-1 (pure content).
 *
 * Day 7 notices what getting involved brings up. Day 8 takes the part of that
 * response carrying the most charge and lets it describe the job, before anyone
 * designs a system around it.
 *
 * The day outgrew the `round-two.ts` table the way Days 6, 9 and 10 did, so its
 * copy lives here and `DayEightBottleneck321` renders it. The table row keeps
 * the route contract and the metadata.
 *
 * Authority: .specify/specs/mtgoa-day8-bottleneck-321/design_handoff/
 * Founder decisions of 2026-08-27 are recorded in DAY_EIGHT_RECEIPT below.
 */

/** Six canonical strain starters. Each is a toggle, and all of them are skippable. */
export const DAY_EIGHT_STARTERS: readonly string[] = [
  'Only I can do this.',
  'Nobody will care.',
  'It is faster if I carry it.',
  'If I take this on, I will disappoint someone.',
  'I do not know what I am allowed to ask for.',
  'Something else.',
]

/**
 * The one starter that selects without asserting content.
 *
 * A reader who picks it has told us the strain is theirs to word, so the strain
 * line falls through to their free text and stays empty until they write one.
 */
export const DAY_EIGHT_OPEN_STARTER = 'Something else.'

/** Openers for the thread, offered only while it is empty. */
export const DAY_EIGHT_OPENERS: readonly string[] = [
  'What are you protecting?',
  'What do you need me to understand?',
  'What happens if I hand one thing off?',
  'Who taught you this job?',
  'What would you need to let go?',
]

/**
 * Day 8's reading of each Clean Up · Skillful Organizing card.
 *
 * Keyed by operation, following Day 9: there is exactly one card per Face in
 * this pool, and the Face is the stable identity. The prototype keyed these by
 * deck number and `round-two.ts` keys its own by card id; one key, used
 * consistently, is what the handoff asked for. The deck's own question still
 * shows in the card sheet.
 */
export const DAY_EIGHT_LENS: Record<Operation, string> = {
  shaman: 'What channel is running before you redesign anything?',
  challenger: 'What would you learn by testing the bottleneck story with one real handoff?',
  regent: 'What capability or care is missing that another rule will not supply?',
  architect: 'What becomes possible when the charge is worked before the system is designed?',
  diplomat: 'What would real ownership look like here?',
  sage: 'What lesson needs to change the next arrangement?',
}

export function dayEightLens(card: MoveCard): string {
  return DAY_EIGHT_LENS[card.operation] ?? card.primaryQuestion
}

/** One turn in the 3-2-1 thread. `me` is the reader; `it` is the part. */
export type DayEightTurn = { from: 'me' | 'it'; text: string }

/** What the reader calls the part. Unnamed, it stays "the part" everywhere. */
export function dayEightPartName(name: string): string {
  return name.trim() || 'the part'
}

/**
 * The strain the 3-2-1 works.
 *
 * Free text wins over a starter when both are present, because the reader's own
 * words are always the more exact ones.
 */
export function dayEightStrainLine(starter: string | null, text: string): string {
  const written = text.trim()
  if (written) return written
  return starter && starter !== DAY_EIGHT_OPEN_STARTER ? starter : ''
}

/**
 * What Day 8 hands the reader.
 *
 * Founder decision, 2026-08-27: a condition rather than a design principle. The
 * shipped stem produced a structural plan for the campaign, which is Day 10's
 * job. This one describes what a clean arrangement would require and commits
 * the reader to nothing — the carousel says the same thing on slide 7.
 *
 * Unfilled halves render as `___` so the gap stays visible.
 */
export const DAY_EIGHT_RECEIPT = {
  opening: 'This work needs a way of organizing that',
  turn: 'because the current pattern keeps',
  needsPlaceholder: 'e.g. lets one piece be handed off without a rescue',
  becausePlaceholder: 'e.g. putting everything through one person',
  headline: 'You let the part describe the job.',
} as const

export function dayEightCondition(needs: string, because: string): string {
  const a = needs.trim() || '___'
  const b = because.trim() || '___'
  return `${DAY_EIGHT_RECEIPT.opening} ${a}, ${DAY_EIGHT_RECEIPT.turn} ${b}.`
}

export const DAY_EIGHT_BLANK = '— left blank'

/** The receipt record: what the reader actually did, with the gaps shown as gaps. */
export function dayEightReceiptRows(input: {
  strain: string
  they: string
  thread: DayEightTurn[]
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
    value: r.raw.trim() || DAY_EIGHT_BLANK,
    filled: r.raw.trim().length > 0,
  }))
  // "What shifted" appears only when it was written — an empty row would read
  // as a question the reader failed rather than one they skipped.
  const shift = input.shift.trim()
  if (shift) out.push({ label: 'what shifted', value: shift, filled: true })
  return out
}
