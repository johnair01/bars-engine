/**
 * How many books, coaching sessions, or events repay each amount in the family room.
 *
 * Unit figures were confirmed by Wendell on 2026-09-24 and match the approved snapshot
 * (2026-09-23-v1): $40 signed book, $5.60 print cost, $10.40 packing and shipping absorbed by
 * Wendell, $150 per coaching session. The event figure is a planned estimate: 20 people on a
 * $25-$50 sliding scale, before venue and materials costs. Nothing here changes what is asked.
 */

export const PAYBACK_INPUTS = {
  bookPriceCents: 4_000,
  bookPrintCostCents: 560,
  bookShipCostCents: 1_040,
  coachingSessionCents: 15_000,
  coachingSessionsPerWeek: { min: 4, max: 5 },
  coachingSessionsPerMonthAtOneClient: 4,
  event: { attendees: 20, ticketLowCents: 2_500, ticketHighCents: 5_000 },
} as const

export type PaybackChannel = {
  key: 'books-hand' | 'books-mailed' | 'coaching' | 'events'
  label: string
  unit: { one: string; many: string }
  /** Money returned per unit; equal for fixed prices, a range for the sliding scale. */
  lowCents: number
  highCents: number
  basis: string
  estimate: boolean
}

const { bookPriceCents, bookPrintCostCents, bookShipCostCents, coachingSessionCents, event } = PAYBACK_INPUTS

export const PAYBACK_CHANNELS: readonly PaybackChannel[] = [
  {
    key: 'books-hand', label: 'Books sold by hand', unit: { one: 'book', many: 'books' },
    lowCents: bookPriceCents - bookPrintCostCents, highCents: bookPriceCents - bookPrintCostCents,
    basis: '$40 signed price, minus $5.60 print cost.', estimate: false,
  },
  {
    key: 'books-mailed', label: 'Books mailed to readers', unit: { one: 'book', many: 'books' },
    lowCents: bookPriceCents - bookPrintCostCents - bookShipCostCents,
    highCents: bookPriceCents - bookPrintCostCents - bookShipCostCents,
    basis: '$40 signed price, minus $5.60 print cost and $10.40 packing and shipping, which I cover.', estimate: false,
  },
  {
    key: 'coaching', label: 'Coaching', unit: { one: 'session', many: 'sessions' },
    lowCents: coachingSessionCents, highCents: coachingSessionCents,
    basis: 'One session, at the rate in the approved budget.', estimate: false,
  },
  {
    key: 'events', label: 'Events', unit: { one: 'event', many: 'events' },
    lowCents: event.attendees * event.ticketLowCents, highCents: event.attendees * event.ticketHighCents,
    basis: '20 people on a $25 to $50 sliding scale, before the venue cost. Digital events have no venue and need ads instead.', estimate: true,
  },
]

export type UnitRange = { min: number; max: number }

/** Units needed to repay `amountCents`. The range comes from a sliding scale: best case to worst case. */
export function unitsToRepay(amountCents: number, channel: Pick<PaybackChannel, 'lowCents' | 'highCents'>): UnitRange {
  if (amountCents <= 0 || channel.lowCents <= 0) return { min: 0, max: 0 }
  return { min: Math.ceil(amountCents / channel.highCents), max: Math.ceil(amountCents / channel.lowCents) }
}

export function formatRange({ min, max }: UnitRange): string {
  return min === max ? String(min) : `${min}–${max}`
}

/** One third of the amount from books sold by hand, one third from coaching, one third from events. */
export function evenMix(amountCents: number) {
  const third = amountCents / 3
  const [books, , coaching, events] = [PAYBACK_CHANNELS[0], PAYBACK_CHANNELS[1], PAYBACK_CHANNELS[2], PAYBACK_CHANNELS[3]]
  return { books: unitsToRepay(third, books), coaching: unitsToRepay(third, coaching), events: unitsToRepay(third, events) }
}

/** How long a number of coaching sessions takes at one client, and at the 4-5 a week the schedule allows. */
export function coachingPace(sessions: number) {
  const { coachingSessionsPerWeek: w, coachingSessionsPerMonthAtOneClient: m } = PAYBACK_INPUTS
  return {
    monthsAtOneClient: Math.ceil(sessions / m),
    weeksAtCapacity: { min: Math.ceil(sessions / w.max), max: Math.ceil(sessions / w.min) } satisfies UnitRange,
  }
}
