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
  doneTitle?: string
  doneBody?: string
  helperTitle?: string
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
    chapter: AwakenMoveContent
    events: AwakenMoveContent
  }
  events: AwakenEvent[]
  secondary: {
    eyebrow: string
    products: AwakenSecondaryLinkContent
    nonprofit: AwakenSecondaryLinkContent
  }
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

export const AWAKEN_DEFAULT_CONTENT: AwakenPageContent = {
  steps: {
    wake: 'Wake up',
    show: 'Show up',
  },
  wake: {
    eyebrow: 'Act I · The current state of things',
    title: 'Wake up.',
    paragraphs: [
      'Right now, a real thing is happening. Not an abstraction — a person, a community, and a car that needs to keep running so the work can keep moving.',
      "The car fund isn't charity. It's fuel. It's what turns intention into showing up — to the events, to the people, to the next chapter of a story that's already in motion.",
      "Here's where we are today, and three honest ways you can step in. Read it, then choose how you want to show up.",
    ],
    stats: [
      { key: 'weekend', label: 'Weekend', value: 'Jul 17–19' },
      { key: 'events', label: 'Events', value: '3 nights' },
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
      body: 'A direct contribution keeps the wheels turning. Every dollar is fuel for showing up.',
      cta: 'Donate to the car fund →',
    },
    chapter: {
      badge: 'Move 2',
      title: 'Read Chapter One',
      body: "Start the story for free. Drop your email and we'll send the first chapter straight to your inbox.",
      cta: 'Send me Chapter One →',
      doneTitle: "You're in.",
      doneBody: 'Chapter One is on its way to your inbox.',
    },
    events: {
      badge: 'Move 3',
      title: 'Be there · Jul 17–19',
      body: "Three gatherings the weekend of July 18th. RSVP on Partiful for the ones you'll make.",
      cta: 'Keep me posted →',
      doneTitle: "You're on the list.",
      doneBody: 'Check your inbox — we sent the weekend details and every RSVP link.',
      helperTitle: 'Want reminders + the weekend details by email?',
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
      chapter: normalizeMove(raw.moves?.chapter, defaults.moves.chapter),
      events: normalizeMove(raw.moves?.events, defaults.moves.events),
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

function normalizeMove(input: Partial<AwakenMoveContent> | undefined, fallback: AwakenMoveContent) {
  return {
    badge: textOrDefault(input?.badge, fallback.badge),
    title: textOrDefault(input?.title, fallback.title),
    body: textOrDefault(input?.body, fallback.body),
    cta: textOrDefault(input?.cta, fallback.cta),
    doneTitle: textOrDefault(input?.doneTitle, fallback.doneTitle ?? ''),
    doneBody: textOrDefault(input?.doneBody, fallback.doneBody ?? ''),
    helperTitle: textOrDefault(input?.helperTitle, fallback.helperTitle ?? ''),
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
