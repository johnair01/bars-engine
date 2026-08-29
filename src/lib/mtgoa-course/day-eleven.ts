import { roundThreeDay } from './round-three'

/**
 * Day 11 — Wake Up · What Is Already in Your Hand (pure content).
 *
 * Week 3 opens Gather Resources. The day builds a Resource Ledger in three
 * passes: list the hand, tell the truth about access to each line, then read the
 * three columns the ledger sorts itself into.
 *
 * The copy outgrew the `round-three.ts` table the way Days 6, 8, 9 and 10 did.
 * The table row stays: it owns the route contract, the metadata, and this day's
 * reading of its six Wake Up · Gathering Resources cards.
 *
 * Authority: .specify/specs/mtgoa-day11-starting-hand/design_handoff/ — the
 * carousel is public, so its three vocabularies are fixed: the five starting
 * hand prompts, the four access labels, and the three columns.
 *
 * Privacy invariant: nothing here leaves the browser. The ledger is assembled
 * from the reader's own text for them to copy, and a refresh clears it.
 */

const DAY_ELEVEN = roundThreeDay(11)

/** The five lines of the starting hand, in the carousel's order. */
export type DayElevenLine = {
  key: string
  /** The carousel's own prompt, verbatim. */
  prompt: string
  label: string
  placeholder: string
}

export const DAY_ELEVEN_LINES: readonly DayElevenLine[] = [
  {
    key: 'people',
    prompt: 'people who trust your judgment.',
    label: 'People who trust your judgment',
    placeholder: 'Who asks you what you think before they decide something?',
  },
  {
    key: 'groups',
    prompt: 'groups you belong to.',
    label: 'Groups you belong to',
    placeholder: 'Teams, congregations, guilds, group chats, neighbours, alumni.',
  },
  {
    key: 'skills',
    prompt: 'skills and tools you can offer.',
    label: 'Skills and tools you can offer',
    placeholder: 'What can you do, lend, or operate that took you time to learn?',
  },
  {
    key: 'rooms',
    prompt: 'rooms you can convene.',
    label: 'Rooms you can convene',
    placeholder: 'Where can you put a meeting on the calendar and have people come?',
  },
  {
    key: 'problems',
    prompt: 'problems you already understand.',
    label: 'Problems you already understand',
    placeholder: 'What do you recognise on sight that other people find confusing?',
  },
]

/**
 * The four access labels, verbatim from the carousel.
 *
 * The reader labels each line they wrote. This is the honest half of the day:
 * reaching something says nothing about whether it is yours to offer.
 *
 * `no-ai-slop/scan.py` flags the fourth label and the standard below as plain
 * negations. Both are already published on the Day 11 carousel, and
 * `day-eleven.test.ts` pins them verbatim, so they stay as the design shipped
 * them. Reword them in the design first.
 */
export type DayElevenAccess = 'offer' | 'ask' | 'connection' | 'not_mine'

export type DayElevenAccessDef = {
  key: DayElevenAccess
  label: string
  /** Which column this access lands the line in. */
  column: DayElevenColumn
}

export const DAY_ELEVEN_ACCESS: readonly DayElevenAccessDef[] = [
  { key: 'offer', label: 'I can offer this.', column: 'move_now' },
  { key: 'ask', label: 'I can ask whether it is available.', column: 'ask_first' },
  { key: 'connection', label: 'I have a possible connection.', column: 'ask_first' },
  { key: 'not_mine', label: 'This is not mine to offer.', column: 'keep_visible' },
]

/** The carousel's standard, verbatim. It sits under the access labels on slide 6. */
export const DAY_ELEVEN_ACCESS_STANDARD = 'A resource is not owed because you can reach it.'

/** The three columns, verbatim from the carousel. */
export type DayElevenColumn = 'move_now' | 'ask_first' | 'keep_visible'

export type DayElevenColumnDef = {
  key: DayElevenColumn
  label: string
  blurb: string
}

export const DAY_ELEVEN_COLUMNS: readonly DayElevenColumnDef[] = [
  {
    key: 'move_now',
    label: 'Move now',
    blurb: 'I have the authority and enough information.',
  },
  {
    key: 'ask_first',
    label: 'Ask first',
    blurb: 'Permission or a fact comes before the offer.',
  },
  {
    key: 'keep_visible',
    label: 'Keep visible',
    blurb: 'Real, with no current fit. Not a failure.',
  },
]

export function dayElevenAccess(key: DayElevenAccess | null): DayElevenAccessDef | null {
  return DAY_ELEVEN_ACCESS.find((a) => a.key === key) ?? null
}

export function dayElevenColumn(key: DayElevenColumn): DayElevenColumnDef {
  const found = DAY_ELEVEN_COLUMNS.find((c) => c.key === key)
  if (!found) throw new Error(`Unknown Day 11 column: ${key}`)
  return found
}

/**
 * One line of a reader's ledger.
 *
 * `access` is null until the reader labels it, which is what lets the flow tell
 * an unlabelled line from a line the reader has decided is out of reach.
 */
export type DayElevenEntry = {
  key: string
  text: string
  access: DayElevenAccess | null
}

/** Lines the reader actually wrote. Blank prompts never reach the ledger. */
export function dayElevenWritten(entries: readonly DayElevenEntry[]): DayElevenEntry[] {
  return entries.filter((entry) => entry.text.trim().length > 0)
}

/** Written lines still waiting for an access label. */
export function dayElevenUnlabelled(entries: readonly DayElevenEntry[]): DayElevenEntry[] {
  return dayElevenWritten(entries).filter((entry) => entry.access === null)
}

/** The ledger, sorted. Every written and labelled line lands in exactly one column. */
export function dayElevenLedger(
  entries: readonly DayElevenEntry[],
): Record<DayElevenColumn, DayElevenEntry[]> {
  const ledger: Record<DayElevenColumn, DayElevenEntry[]> = {
    move_now: [],
    ask_first: [],
    keep_visible: [],
  }
  for (const entry of dayElevenWritten(entries)) {
    const access = dayElevenAccess(entry.access)
    if (access) ledger[access.column].push(entry)
  }
  return ledger
}

export function dayElevenLineLabel(key: string): string {
  return DAY_ELEVEN_LINES.find((line) => line.key === key)?.label ?? key
}

/**
 * The ledger as text the reader can copy.
 *
 * Built in the browser from the reader's own words. Columns with nothing in them
 * are left out, so a short ledger reads as a short ledger.
 */
export function dayElevenLedgerText(entries: readonly DayElevenEntry[]): string {
  const ledger = dayElevenLedger(entries)
  const blocks: string[] = []
  for (const column of DAY_ELEVEN_COLUMNS) {
    const lines = ledger[column.key]
    if (lines.length === 0) continue
    blocks.push(
      [
        `${column.label.toUpperCase()} — ${column.blurb}`,
        ...lines.map((line) => `• ${dayElevenLineLabel(line.key)}: ${line.text.trim()}`),
      ].join('\n'),
    )
  }
  return blocks.join('\n\n')
}

/** The receipt headline. It reports the count and claims nothing else. */
export function dayElevenReceiptHeadline(entries: readonly DayElevenEntry[]): string {
  const written = dayElevenWritten(entries).length
  if (written === 0) return 'You read the ledger through.'
  const ready = dayElevenLedger(entries).move_now.length
  if (ready === 0) return `${written} in hand. None of it is yours to offer today.`
  return `${written} in hand. ${ready} you can move on now.`
}

export const DAY_ELEVEN_COPY_LABEL = 'copy my ledger'

export const DAY_ELEVEN_PRIVACY = 'this ledger stays in your browser · a refresh clears it'

/** The day's own promise, quoted from the carousel's opening slide. */
export const DAY_ELEVEN_PROMISE =
  'You are waiting to feel influential. You are already holding something.'

export const DAY_ELEVEN_TITLE = DAY_ELEVEN?.title ?? 'What is already in your hand?'

export const DAY_ELEVEN_CORE_QUESTION = DAY_ELEVEN?.coreQuestion ?? 'What can I actually reach?'
