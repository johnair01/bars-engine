import type { MoveCard } from '@/lib/allyship-deck/types'

import { roundTwoDay } from './round-two'

/**
 * Day 10 — Show Up · The Campaign Handoff (pure content).
 *
 * Days 6 through 9 are private: see the field, feel the load, clear the story,
 * grow the capacity. Day 10 is the act — put one small structure where another
 * person, or future you, can actually use it.
 *
 * The day outgrew the `round-two.ts` table the way Days 6, 8 and 9 did, so its
 * copy lives here and `DayTenCampaignHandoff` renders it. The table row stays:
 * it still owns the route contract, the metadata, and this day's reading of the
 * six Show Up · Skillful Organizing cards.
 *
 * Authority: .specify/specs/mtgoa-day10-campaign-handoff/design_handoff/
 *
 * Privacy invariant: nothing here leaves the browser. Both artifacts are
 * assembled from the reader's own text for them to copy, and neither is sent.
 */

const DAY_TEN = roundTwoDay(10)

/**
 * The two lanes.
 *
 * The wire keys stay `personal` / `local_team` because the Week 2 analytics
 * validator already accepts exactly those two and nothing a reader typed may
 * widen it. The label is the design's — "shared work I already hold" is the
 * honest description of what lane B builds, and it does not require a team.
 */
export type DayTenLane = 'personal' | 'local_team'

export type DayTenLaneDef = {
  key: DayTenLane
  eyebrow: string
  headline: string
  builds: string
  whoCanUse: string
  whatHappens: string
  /** Shown under lane B only: standing is the thing that makes a handoff real. */
  caution?: string
}

export const DAY_TEN_LANES: readonly DayTenLaneDef[] = [
  {
    key: 'personal',
    eyebrow: 'lane a · my allyship life',
    headline:
      'I want a rhythm that lets me take a useful action without asking my future self to remember everything from scratch.',
    builds: 'An Allyship Rhythm',
    whoCanUse: 'Future you.',
    whatHappens: 'You place it in your own system.',
  },
  {
    key: 'local_team',
    eyebrow: 'lane b · shared work I already hold',
    headline:
      'I have a real piece of work and a person, group, or place that has agreed to receive a clear handoff.',
    builds: 'A Shared Work Handoff',
    whoCanUse: 'A person, group, or place that has agreed to receive it.',
    whatHappens: 'You place it with that recipient. This page sends it nowhere.',
    caution:
      'Choose this only when you have standing to place the handoff. “Owner: me” is a real answer. A collaborator needs to have separately agreed to receive work from you.',
  },
]

export function dayTenLane(key: DayTenLane | null): DayTenLaneDef | null {
  return DAY_TEN_LANES.find((l) => l.key === key) ?? null
}

/**
 * Book-promotion starters.
 *
 * Ways to structure work on the book campaign, offered as a shape rather than
 * as an open route. Which routes are actually open, who owns them, and how to
 * reach a steward all come from the published organization state.
 */
export type DayTenStarter = { key: string; label: string; lane: DayTenLane; blurb: string }

export const DAY_TEN_STARTERS: readonly DayTenStarter[] = [
  {
    key: 'rhythm',
    label: 'Book Handoff Rhythm',
    lane: 'personal',
    blurb:
      'One thoughtful recommendation at a sustainable rhythm, with a clear reason, recipient fit, and room for the recipient to decline. Lands in a personal calendar, note, or reminder system.',
  },
  {
    key: 'intro',
    label: 'Organization Introduction',
    lane: 'local_team',
    blurb:
      'A member of an organization introduces the book to the person or group that can assess whether it belongs in their work. Lands in a consented email, meeting agenda, or internal shared document.',
  },
  {
    key: 'podcast',
    label: 'Podcast / Speaking Outreach',
    lane: 'local_team',
    blurb:
      'A person who knows a host or producer makes a warm introduction, or a host invites Wendell with enough context to act. Lands in the existing podcast route or a consented direct introduction.',
  },
  {
    key: 'message',
    label: 'Campaign Message & Response Rhythm',
    lane: 'local_team',
    blurb:
      'A steward keeps public book material, next-step links, and incoming interest available after a post or a conversation. Lands in a campaign brief, shared document, or current workstream card.',
  },
  {
    key: 'tour',
    label: 'Book Tour Lead Handoff',
    lane: 'local_team',
    blurb:
      'A venue, host, or connector lead reaches the person responsible for the next reply with enough context to respond clearly. Lands in the Book Tour Help route or an approved steward handoff.',
  },
]

export const DAY_TEN_STARTER_CAVEAT =
  'These are ways to structure book-promotion work. The open routes, owners, terms, and contact links come from the campaign’s published state.'

export type DayTenField = { key: string; label: string; prompt: string; placeholder: string }

/** Lane A's artifact. Five fields, all optional. */
export const DAY_TEN_RHYTHM_FIELDS: readonly DayTenField[] = [
  { key: 'practice', label: 'The practice', prompt: 'what kind of useful handoff do you want to make repeatable?', placeholder: 'Once a week, I will…' },
  { key: 'place', label: 'The place', prompt: 'where does this fit in your actual life?', placeholder: 'After ___ on ___, I will spend ___ minutes…' },
  { key: 'support', label: 'The support', prompt: 'what makes beginning easier?', placeholder: 'I will keep ___ ready / ask ___ / use ___ as my cue…' },
  { key: 'boundary', label: 'The boundary', prompt: 'what keeps this practice renewable?', placeholder: 'I will stop after ___ / I will hold this rhythm clear of…' },
  { key: 'return', label: 'The return', prompt: 'how will you know whether it is still useful?', placeholder: 'On ___, I will ask whether this helped ___ and whether it still fits…' },
]

/** Lane B's artifact. Six fields, all optional. */
export const DAY_TEN_HANDOFF_FIELDS: readonly DayTenField[] = [
  { key: 'purpose', label: 'Purpose', prompt: 'what is this handoff trying to make more possible?', placeholder: 'This exists so that…' },
  { key: 'whom', label: 'For whom', prompt: 'who can use this handoff? a role, group, or relationship', placeholder: 'This is for…' },
  { key: 'action', label: 'One next action', prompt: 'what is the smallest useful thing to do?', placeholder: 'The next action is…' },
  { key: 'owner', label: 'Owner', prompt: 'who owns that action?', placeholder: 'The owner is…' },
  { key: 'terms', label: 'Terms', prompt: 'what is optional, what needs permission, what sits outside the ask?', placeholder: 'Optional… / ask first before… / this handoff leaves out…' },
  { key: 'return', label: 'Return', prompt: 'when and how will the work be reviewed?', placeholder: 'We will come back on… and look for…' },
]

export const DAY_TEN_THIRD_PARTY_NOTE =
  'Keep another person’s contact details, private story, or identifying information out of this unless you have permission to share it. Frame For whom as a role, group, or relationship.'

/**
 * The four honest states.
 *
 * `prepared` stays distinct from `placed` for the reason Day 5 keeps them
 * apart: a built thing nobody can reach yet is a real thing to have made, and
 * it is not a finished structure. No state earns a score, a reward, or a role.
 */
export type DayTenPlacement = 'placed' | 'prepared' | 'returned' | 'put_down'

export type DayTenPlacementDef = {
  key: DayTenPlacement
  tag: string
  label: string
  body: string
  /** Status hue, taken from the deck face colours. */
  color: string
}

export const DAY_TEN_PLACEMENTS: readonly DayTenPlacementDef[] = [
  {
    key: 'placed',
    tag: 'placed',
    label: 'It is in a place someone can use.',
    body: 'Future me can encounter the rhythm, or a person who agreed to receive the handoff can take the next action.',
    color: '#6fc795',
  },
  {
    key: 'prepared',
    tag: 'prepared',
    label: 'I built it. It still needs a placement.',
    body: 'You have something concrete. Decide where it will land before calling it a finished structure.',
    color: '#e0c25a',
  },
  {
    key: 'returned',
    tag: 'returned',
    label: 'An earlier move is still live.',
    body: 'The handoff showed you a question that belongs in Days 6 to 9.',
    color: '#9fb2c8',
  },
  {
    key: 'put_down',
    tag: 'put down',
    label: 'This moment needs one personal action.',
    body: 'A larger structure would add weight while the useful thing stays undone. One handoff is the whole move today.',
    color: '#a99ae0',
  },
]

export function dayTenPlacement(key: DayTenPlacement | null): DayTenPlacementDef | null {
  return DAY_TEN_PLACEMENTS.find((p) => p.key === key) ?? null
}

/** What a reader attests to when they say the structure is placed. Their word is the whole evidence. */
export function dayTenAttestation(lane: DayTenLane | null): string {
  return lane === 'local_team'
    ? 'I put this where a person or group that agreed to receive it can use it.'
    : 'I created the first instance in a calendar, reminder, note, or system I actually use.'
}

export const DAY_TEN_ATTESTATION_NOTE =
  'The page takes this as your word. It asks for no screenshots, no recipient names, no proof of purchase, and no proof of reply.'

/** Come Back. The learning a reader carries out of Week 2. */
export const DAY_TEN_LEARNINGS: readonly { key: string; label: string; body: string }[] = [
  { key: 'easier', label: 'Easier or clearer.', body: 'Carry the learning into the next five-day loop.' },
  { key: 'harder', label: 'Harder, or nobody could use it.', body: 'The placement revealed a missing move. The four earlier days are named on your receipt.' },
  { key: 'no', label: 'This should not become a structure.', body: 'Put it down cleanly. One personal handoff is a complete game.' },
]

export const DAY_TEN_COME_BACK_QUESTION =
  'Did this structure make the next useful handoff easier, harder, or clearer?'

export function dayTenReminderLine(dateLabel: string): string {
  return `On ${dateLabel || '[date]'}, I will ask: Did this make the next useful handoff easier, harder, or clearer?`
}

/**
 * The four precise return doors.
 *
 * Named by the move that is still live, so a reader who finds a missing piece
 * during placement knows which day answers it.
 */
export const DAY_TEN_RETURN_DOORS: readonly { day: number; label: string }[] = [
  { day: 6, label: 'I need to see the work more clearly → Day 6' },
  { day: 7, label: 'I need room around getting involved → Day 7' },
  { day: 8, label: 'A story is designing this → Day 8' },
  { day: 9, label: 'I need a capacity or Face to grow → Day 9' },
]

/** The receipt headline. Switches on the state, and stays neutral when none was chosen. */
export function dayTenReceiptHeadline(placement: DayTenPlacement | null): string {
  switch (placement) {
    case 'placed': return 'You put a structure in the world.'
    case 'prepared': return 'You built something that needs a landing place.'
    case 'returned': return 'You found the move that comes before structure.'
    case 'put_down': return 'You kept the work small enough to be useful.'
    default: return 'You moved through the practice.'
  }
}

/** The receipt's truth chip. `placed` says who can use it, because that is the whole distinction. */
export function dayTenStateChip(placement: DayTenPlacement | null, lane: DayTenLane | null): string {
  const def = dayTenPlacement(placement)
  if (!def) return 'No state chosen'
  if (def.key === 'placed') return lane === 'local_team' ? 'Placed with others' : 'Placed for future me'
  return def.tag.charAt(0).toUpperCase() + def.tag.slice(1)
}

/**
 * This day's reading of a Show Up · Skillful Organizing card.
 *
 * Read from the `round-two.ts` row rather than restated here — that table is
 * where every Week 2 day's per-card translation is authored and tested, and one
 * authority is the point. The deck's own question still shows in the sheet.
 */
export function dayTenLens(card: MoveCard): string {
  return DAY_TEN?.cardPrompts[card.id] ?? card.action ?? ''
}

const trim = (value: string) => value.trim()
const em = '—'

/** Lane A's artifact, assembled from the reader's own words for them to copy. */
export function dayTenRhythmText(
  values: Record<string, string>,
  book: { who: string; why: string; line: string },
): string {
  const lines = [
    'MY ALLYSHIP RHYTHM',
    ...DAY_TEN_RHYTHM_FIELDS.map((f) => `${f.label}: ${trim(values[f.key] ?? '') || em}`),
  ]
  if (trim(book.who) || trim(book.why) || trim(book.line)) {
    lines.push(
      '',
      'BOOK HANDOFF RHYTHM',
      `Who I will consider: ${trim(book.who) || em}`,
      `Why the book could be useful: ${trim(book.why) || em}`,
      `The sentence that leaves their choice intact: ${trim(book.line) || em}`,
      'Boundary: I will follow up only when they invite more conversation.',
    )
  }
  lines.push('', 'Made as a Day 10 practice in Mastering the Game of Allyship.')
  return lines.join('\n')
}

/** Lane B's artifact. A proposal a recipient can act on, and never a claim on their time. */
export function dayTenHandoffText(values: Record<string, string>): string {
  return [
    'SHARED WORK HANDOFF',
    ...DAY_TEN_HANDOFF_FIELDS.map((f) => `${f.label}: ${trim(values[f.key] ?? '') || em}`),
    '',
    'Made as a Day 10 practice in Mastering the Game of Allyship. A proposal, and a claim on nobody’s time.',
  ].join('\n')
}
