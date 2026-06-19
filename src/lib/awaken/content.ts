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
}

/**
 * The three events the weekend of July 18th, 2026.
 * July 18, 2026 is a Saturday, so the weekend spans Jul 17–19.
 * Titles/venues are placeholders — edit to match the real lineup.
 */
export const AWAKEN_EVENTS: AwakenEvent[] = [
  {
    key: 'jul17-opening-circle',
    title: 'Opening Circle',
    when: 'Fri · Jul 17',
    date: '2026-07-17',
    where: 'Portland · TBA',
    blurb:
      'We open the weekend together — name what we are waking up to and set the intention for the work ahead.',
  },
  {
    key: 'jul18-mainstage',
    title: 'The Main Event',
    when: 'Sat · Jul 18',
    date: '2026-07-18',
    where: 'Portland · TBA',
    blurb:
      'The centerpiece gathering. Story, music, and the live unveiling of where the car fund stands.',
  },
  {
    key: 'jul19-send-off',
    title: 'Send-Off Brunch',
    when: 'Sun · Jul 19',
    date: '2026-07-19',
    where: 'Portland · TBA',
    blurb:
      'A slower close — coffee, debrief, and the first steps each of us takes back into the world.',
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
