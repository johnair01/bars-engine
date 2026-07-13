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

export type AwakenStat = {
  key: string
  label: string
  value: string
}

export type AwakenMoveContent = {
  badge: string
  title: string
  body: string
  cta: string
  /** Optional link target for the card's primary button (internal path or external URL). */
  href?: string
}

export type AwakenSecondaryLinkContent = {
  title: string
  body: string
  href: string
}

export type AwakenPageContent = {
  steps: { wake: string; show: string }
  wake: {
    eyebrow: string
    title: string
    paragraphs: string[]
    stats: AwakenStat[]
    cta: string
  }
  show: {
    eyebrow: string
    title: string
    subtitle: string
  }
  moves: {
    donate: AwakenMoveContent
    events: AwakenMoveContent
    deck: AwakenMoveContent
    book: AwakenMoveContent
    chapter: AwakenMoveContent
  }
  events: AwakenEvent[]
  secondary: {
    eyebrow: string
    products: AwakenSecondaryLinkContent
    nonprofit: AwakenSecondaryLinkContent
  }
}

/**
 * The two events the weekend of July 18th, 2026 (Jul 17–18).
 * RSVPs are handled on Partiful (partifulUrl); /awaken links out to them.
 *
 * Titles + dates + Partiful URLs are confirmed. One title is still marked
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
]

export const AWAKEN_EVENT_KEYS = new Set(AWAKEN_EVENTS.map((e) => e.key))

/** Legacy donate page. The car-fund CTA now points at the Crossing campaign instead. */
export const AWAKEN_DONATE_HREF = '/event/donate'

/** The Crossing car-fund campaign — where "fuel the car fund" now sends people. */
export const AWAKEN_CROSSING_HREF = '/campaign/the-crossing'

/** The Allyship Deck sales page. */
export const AWAKEN_DECK_SALES_HREF = '/deck/sales'

/** The Mastering the Game of Allyship book sales page (external). */
export const AWAKEN_BOOK_SALES_HREF = 'https://wendellbritt.gumroad.com/l/MTGOAbook'

/** Where "buy products / explore the offers" points. */
export const AWAKEN_PRODUCTS_HREF = '/launch'

/** Non-profit page (currently under construction). */
export const AWAKEN_NONPROFIT_HREF = '/nonprofit'

/**
 * Canonical Chapter One delivery URL.
 */
export const AWAKEN_CHAPTER_FILE_HREF = '/mastering-allyship-chapter-1.pdf'

export const AWAKEN_DEFAULT_CONTENT: AwakenPageContent = {
  steps: {
    wake: 'Wake up',
    show: 'Show up',
  },
  wake: {
    eyebrow: 'Act I · The current state of things',
    title: 'Wake up.',
    paragraphs: [
      'For a long time, allyship felt like a test you could fail in public — something you were supposed to already be good at. So a lot of us stayed quiet, waited to feel qualified, and did nothing while the work waited too.',
      "Here's the shift: allyship isn't a verdict on who you are. It's a game you learn by playing — a handful of moves you can practice, miss, and try again. And right now that game is real and local: a person, a community, and a car that has to keep running so the work can keep showing up.",
      "That's the Crossing. You don't need to be an expert to step in — you need one honest move. Here's where things stand, and the moves you can make today. Read it, then choose how you want to show up.",
    ],
    stats: [
      { key: 'weekend', label: 'Weekend', value: 'Jul 17–18' },
      { key: 'events', label: 'Events', value: '2 nights' },
      { key: 'ask', label: 'The ask', value: 'Show up' },
    ],
    cta: "I'm awake — show me how to help ↓",
  },
  show: {
    eyebrow: 'Act II · Show up',
    title: 'Pick your move.',
    subtitle: 'Any one of these moves the needle. Do one. Do all three.',
  },
  moves: {
    donate: {
      badge: 'Move 1',
      title: 'Fuel the car fund',
      body: 'A reliable car is what keeps the work showing up — to the events, the community, the next chapter. Chip in and join the Crossing campaign.',
      cta: 'Donate & join the Crossing →',
      href: AWAKEN_CROSSING_HREF,
    },
    events: {
      badge: 'Move 2',
      title: 'Be there · Jul 17–18',
      body: "Two gatherings the weekend of July 18th. RSVP on Partiful for the ones you'll make.",
      cta: 'RSVP on Partiful →',
    },
    deck: {
      badge: 'Move 3',
      title: 'Get the Allyship Deck',
      body: '120 moves for doing the work. Draw a card, sit with the practice, and turn it into a real quest.',
      cta: 'See the deck →',
      href: AWAKEN_DECK_SALES_HREF,
    },
    book: {
      badge: 'Move 4',
      title: 'Pre-order the book',
      body: 'Mastering the Game of Allyship — the book the whole weekend is built around. Pre-order your copy now.',
      cta: 'Pre-order the book →',
      href: AWAKEN_BOOK_SALES_HREF,
    },
    chapter: {
      badge: 'Coming soon',
      title: 'Read Chapter One',
      body: 'Chapter One is chapter one of Mastering the Game of Allyship — coming soon. Want it sooner? Grab the book.',
      cta: 'Get the book →',
      href: AWAKEN_BOOK_SALES_HREF,
    },
  },
  events: AWAKEN_EVENTS,
  secondary: {
    eyebrow: 'Go deeper',
    products: {
      title: 'Explore the book, deck & game',
      body: 'Browse everything you can buy and support →',
      href: AWAKEN_PRODUCTS_HREF,
    },
    nonprofit: {
      title: 'About the non-profit',
      body: 'Learn where this is headed (coming soon) →',
      href: AWAKEN_NONPROFIT_HREF,
    },
  },
}

function textOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function paragraphsOrDefault(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const paragraphs = value.filter((item): item is string => typeof item === 'string' && !!item.trim())
  return paragraphs.length ? paragraphs.map((item) => item.trim()) : fallback
}

export function normalizeAwakenPageContent(input: unknown): AwakenPageContent {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<AwakenPageContent>
  const defaults = AWAKEN_DEFAULT_CONTENT

  return {
    steps: {
      wake: textOrDefault(raw.steps?.wake, defaults.steps.wake),
      show: textOrDefault(raw.steps?.show, defaults.steps.show),
    },
    wake: {
      eyebrow: textOrDefault(raw.wake?.eyebrow, defaults.wake.eyebrow),
      title: textOrDefault(raw.wake?.title, defaults.wake.title),
      paragraphs: paragraphsOrDefault(raw.wake?.paragraphs, defaults.wake.paragraphs),
      stats: defaults.wake.stats.map((fallback, index) => {
        const stat = raw.wake?.stats?.[index]
        return {
          key: fallback.key,
          label: textOrDefault(stat?.label, fallback.label),
          value: textOrDefault(stat?.value, fallback.value),
        }
      }),
      cta: textOrDefault(raw.wake?.cta, defaults.wake.cta),
    },
    show: {
      eyebrow: textOrDefault(raw.show?.eyebrow, defaults.show.eyebrow),
      title: textOrDefault(raw.show?.title, defaults.show.title),
      subtitle: textOrDefault(raw.show?.subtitle, defaults.show.subtitle),
    },
    moves: {
      donate: normalizeMove(raw.moves?.donate, defaults.moves.donate),
      events: normalizeMove(raw.moves?.events, defaults.moves.events),
      deck: normalizeMove(raw.moves?.deck, defaults.moves.deck),
      book: normalizeMove(raw.moves?.book, defaults.moves.book),
      chapter: normalizeMove(raw.moves?.chapter, defaults.moves.chapter),
    },
    events: defaults.events.map((fallback, index) => {
      const event = raw.events?.[index]
      return {
        key: fallback.key,
        title: textOrDefault(event?.title, fallback.title),
        when: textOrDefault(event?.when, fallback.when),
        date: textOrDefault(event?.date, fallback.date),
        where: textOrDefault(event?.where, fallback.where),
        blurb: textOrDefault(event?.blurb, fallback.blurb),
        partifulUrl: textOrDefault(event?.partifulUrl, fallback.partifulUrl),
      }
    }),
    secondary: {
      eyebrow: textOrDefault(raw.secondary?.eyebrow, defaults.secondary.eyebrow),
      products: normalizeLink(raw.secondary?.products, defaults.secondary.products),
      nonprofit: normalizeLink(raw.secondary?.nonprofit, defaults.secondary.nonprofit),
    },
  }
}

function normalizeMove(
  input: Partial<AwakenMoveContent> | undefined,
  fallback: AwakenMoveContent
): AwakenMoveContent {
  return {
    badge: textOrDefault(input?.badge, fallback.badge),
    title: textOrDefault(input?.title, fallback.title),
    body: textOrDefault(input?.body, fallback.body),
    cta: textOrDefault(input?.cta, fallback.cta),
    href: textOrDefault(input?.href, fallback.href ?? ''),
  }
}

function normalizeLink(
  input: Partial<AwakenSecondaryLinkContent> | undefined,
  fallback: AwakenSecondaryLinkContent
) {
  return {
    title: textOrDefault(input?.title, fallback.title),
    body: textOrDefault(input?.body, fallback.body),
    href: textOrDefault(input?.href, fallback.href),
  }
}

export function parseAwakenPageTheme(theme: string | null | undefined): AwakenPageContent {
  try {
    const parsed = theme ? (JSON.parse(theme) as { awakenPage?: unknown }) : {}
    return normalizeAwakenPageContent(parsed.awakenPage)
  } catch {
    return AWAKEN_DEFAULT_CONTENT
  }
}
