/**
 * Content + config for the public /awaken guided funnel.
 *
 * Shared between the client flow, the server page, and the signup API so that
 * event keys validate consistently. Copy here is intentionally editable — the
 * non-profit owner (Wendell) can revise the narrative and event details without
 * touching component logic.
 */

export type AwakenEvent = {
  /** Stable key persisted on FunnelSignup.events — do not rename casually. */
  key: string
  title: string
  /** Human date, e.g. "Fri · Jul 17". */
  when: string
  /** ISO date for sorting / calendar wiring later. */
  date: string
  where: string
  blurb: string
  /** Partiful event page — the official RSVP destination. */
  partifulUrl: string
}

/**
 * The three events the weekend of July 18th, 2026 (Jul 17–19).
 * RSVPs are handled on Partiful (partifulUrl); /awaken links out to them.
 *
 * Titles + dates + Partiful URLs are confirmed. Two titles are still marked
 * pending by the organizer, and venues/times are TBA — update `where` (and add
 * times to the calendar links in calendar.ts) once finalized.
 */
export const AWAKEN_EVENTS: AwakenEvent[] = [
  {
    key: 'jul17-opening-circle',
    title: 'Mastering the Game of Allyship — Book Launch',
    when: 'Fri · Jul 17',
    date: '2026-07-17',
    where: 'Portland · TBA',
    blurb: 'The launch itself — the book steps into the world. Come be there for the beginning.',
    partifulUrl: 'https://partiful.com/e/JTEHEkp0YslfGplWK8vS',
  },
  {
    // Title pending — organizer to finalize.
    key: 'jul18-mainstage',
    title: 'Book Launch Booty Shake™',
    when: 'Sat · Jul 18',
    date: '2026-07-18',
    where: 'Portland · TBA',
    blurb: 'A dance party to shake the book into the world. Bring your whole body.',
    partifulUrl: 'https://partiful.com/e/de44COeykTCRP8qvGt3O',
  },
  {
    // Title pending — organizer to finalize.
    key: 'jul19-send-off',
    title: 'Mastering the Game of Allyship — Book Launch Game',
    when: 'Sun · Jul 19',
    date: '2026-07-19',
    where: 'Portland · TBA',
    blurb: 'Play the game the book is built on — live, together, to close the weekend.',
    partifulUrl: 'https://partiful.com/e/eY5MfJQg7CtjdimimSxO',
  },
]

export const AWAKEN_EVENT_KEYS = new Set(AWAKEN_EVENTS.map((e) => e.key))

/** Where the donate CTA points. The existing /event/donate page already works. */
export const AWAKEN_DONATE_HREF = '/event/donate'

/** Where "buy products / explore the offers" points. */
export const AWAKEN_PRODUCTS_HREF = '/launch'

/** Non-profit page (currently under construction). */
export const AWAKEN_NONPROFIT_HREF = '/nonprofit'

/**
 * Optional static asset for Chapter One. Drop a PDF at public/chapter-one.pdf
 * and this link goes live; until then we promise delivery by email.
 */
export const AWAKEN_CHAPTER_FILE_HREF = '/chapter-one.pdf'
