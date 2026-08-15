/**
 * Party metadata + the 12-card Game Master deck for Goodbye Yellow Brick Road.
 *
 * Partiful remains the source of truth for RSVPs and ordinary event logistics.
 * What lives here is only what the game needs at runtime.
 */

import type { Depth, Lens } from '../config'

export const PARTY_META = {
  slug: 'goodbye-yellow-brick-road',
  title: 'Goodbye Yellow Brick Road',
  subtitle: 'One night. One Oracle. Cross from "I wish" to "we\'re doing".',
  dateLabel: 'Saturday, August 15, 2026 — 8:00 PM',
  location: 'Portland',
  hostNote:
    'Cards are invitations, not assignments. Play one, discard one, or hold all three all night. The room is the game; the phone just lowers the activation energy.',
  schedule: [
    { time: '8:00 PM', title: 'Doors, grill, first hands dealt', details: 'Upstairs: kitchen and dance floor. Everyone gets three cards.' },
    { time: '9:00 PM', title: 'Karaoke downstairs', details: 'Runs until midnight.' },
    { time: '11:40 PM', title: 'Last Game Master card', details: 'The twelfth possibility unlocks.' },
    { time: '12:00 AM', title: 'The crossing', details: 'Karaoke out, hot tub in. Spicy play opens.' },
  ],
} as const

export type GmSlot = {
  /** 1-indexed; slot N unlocks at 8:00 PM + (N-1) × 20 minutes. */
  slot: number
  /** Label for the schedule, in PDT. */
  timeLabel: string
  /** Base Oracle card this shared possibility is built on. */
  cardId: string
  lens: Lens
  depth: Depth
  title: string
  prompt: string
}

/**
 * 12 curated shared possibilities, 8:00 PM through 11:40 PM at a 20-minute
 * cadence. These accumulate — nothing expires or re-locks. Multiple people may
 * animate the same one independently.
 */
export const GM_SLOTS: GmSlot[] = [
  {
    slot: 1,
    timeLabel: '8:00 PM',
    cardId: 'WU-A',
    lens: 'goodbye',
    depth: 'easy',
    title: 'Arrive Out Loud',
    prompt:
      'Find someone you have not seen in a while and tell them one specific thing you noticed about them in the last ten minutes. Not a greeting — a noticing.',
  },
  {
    slot: 2,
    timeLabel: '8:20 PM',
    cardId: 'SU-Q',
    lens: 'goodbye',
    depth: 'easy',
    title: 'Open the Door',
    prompt:
      'Introduce two people who should know each other and stay long enough to say why. Then leave them to it.',
  },
  {
    slot: 3,
    timeLabel: '8:40 PM',
    cardId: 'WU-4',
    lens: 'goodbye',
    depth: 'medium',
    title: 'The Unsaid Thing',
    prompt:
      'Tell Wendell the thing you were saving for a text after he moved. He is right here. The window closes.',
  },
  {
    slot: 4,
    timeLabel: '9:00 PM',
    cardId: 'SU-3',
    lens: 'spicy',
    depth: 'easy',
    title: 'First on the Floor',
    prompt:
      'Karaoke is open downstairs. Somebody has to go first, and the first three songs set the ceiling for the night. Take one of them.',
  },
  {
    slot: 5,
    timeLabel: '9:20 PM',
    cardId: 'CU-7',
    lens: 'goodbye',
    depth: 'medium',
    title: 'Give It Back',
    prompt:
      'Name one specific thing Wendell gave you — a night, a nudge, an introduction, a rescue — and tell him what it did. Specifics only.',
  },
  {
    slot: 6,
    timeLabel: '9:40 PM',
    cardId: 'WU-5',
    lens: 'goodbye',
    depth: 'easy',
    title: 'Work the Edges',
    prompt:
      'Somebody here came alone or came anyway. Go stand with them for five minutes and bring them into something.',
  },
  {
    slot: 7,
    timeLabel: '10:00 PM',
    cardId: 'GU-3',
    lens: 'goodbye',
    depth: 'medium',
    title: 'Ask the Saved Question',
    prompt:
      'Ask the question you have been keeping for the right moment. This is the last night the right moment is in the same building as you.',
  },
  {
    slot: 8,
    timeLabel: '10:20 PM',
    cardId: 'SU-6',
    lens: 'goodbye',
    depth: 'hard',
    title: 'Put It On a Calendar',
    prompt:
      'Turn one "we should" into a date. Phone out, month picked, both people looking at it. Vibes do not survive a move; calendars do.',
  },
  {
    slot: 9,
    timeLabel: '10:40 PM',
    cardId: 'SU-K',
    lens: 'goodbye',
    depth: 'medium',
    title: 'The Toast Nobody Made',
    prompt:
      'Get the room quiet and say the thing that proves this house has been paying attention. Short is better. Say it anyway.',
  },
  {
    slot: 10,
    timeLabel: '11:00 PM',
    cardId: 'GU-9',
    lens: 'goodbye',
    depth: 'medium',
    title: 'Name the Threshold',
    prompt:
      'Ask someone what they are crossing into right now. Listen for the fear under the answer and do not fix it.',
  },
  {
    slot: 11,
    timeLabel: '11:20 PM',
    cardId: 'CU-10',
    lens: 'goodbye',
    depth: 'medium',
    title: 'Make Him Receive It',
    prompt:
      'Wendell will deflect. Watch him do it, then put the good thing back in front of him until it lands. Take as many tries as it needs.',
  },
  {
    slot: 12,
    timeLabel: '11:40 PM',
    cardId: 'SU-6',
    lens: 'spicy',
    depth: 'hard',
    title: 'Run the Crossing',
    prompt:
      'Twenty minutes to midnight. Karaoke out, hot tub in. Somebody needs to handle towels, music, water, and who is driving. Take the job out loud so people know who to ask.',
  },
]

export function gmSlot(slot: number): GmSlot | null {
  return GM_SLOTS.find((entry) => entry.slot === slot) || null
}
