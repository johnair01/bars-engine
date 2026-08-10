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
 * Dated events /awaken is currently advertising. **Empty is the correct state
 * between tours**, and the card degrades to its blurb plus the book-tour link.
 *
 * The July 17–18 launch weekend ran and has been removed. A public funnel
 * advertising a date that has passed is the defect this list exists to avoid,
 * so add a stop only while it is still ahead, and take it out once it runs.
 * `AWAKEN_EVENT_KEYS` gates the signup route, so a removed key stops accepting
 * RSVPs on its own.
 */
export const AWAKEN_EVENTS: AwakenEvent[] = []

export const AWAKEN_EVENT_KEYS = new Set(AWAKEN_EVENTS.map((e) => e.key))

/** Legacy donate page. The press-run CTA points at the Crossing campaign instead. */
export const AWAKEN_DONATE_HREF = '/event/donate'

/**
 * The Crossing campaign — where "pay toward the press run" sends people. The
 * campaign engine is unchanged; the object it raises against moved from the car
 * (bought) to the print run owed to the Kickstarter backers.
 */
export const AWAKEN_CROSSING_HREF = '/campaign/the-crossing'

/** Book tour help — the four ways to put the book in front of people. */
export const AWAKEN_BOOK_TOUR_HREF = '/mastering-allyship/book-tour/help'

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

/** The Chapter One lead page — the chapter in exchange for an email address. */
export const AWAKEN_CHAPTER_ONE_HREF = '/mastering-allyship/chapter-1'

export const AWAKEN_DEFAULT_CONTENT: AwakenPageContent = {
  steps: {
    wake: 'Wake up',
    show: 'Show up',
  },
  wake: {
    eyebrow: 'Act I · Where this stands',
    title: 'Wake up.',
    paragraphs: [
      'Most allyship marketing sells a verdict: you are good, or you are not good yet. A verdict is something a person waits to receive, and the work waits alongside her.',
      'Allyship is a game you learn by playing: a handful of moves you practice, miss, and practice again. Right now the game is specific. Three hundred seventy-one people paid for a printed book in the Kickstarter and are still holding a receipt.',
      'That is the Crossing. One honest move is the whole entry price. Below is where the press run stands and what you can do today.',
    ],
    stats: [
      { key: 'backers', label: 'Backers owed print', value: '371' },
      { key: 'object', label: 'The object', value: 'The press run' },
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
      title: 'Pay toward the press run',
      body: 'Three hundred seventy-one backers paid for a printed book and are still holding a receipt. The print bill is what puts a copy in their hands. Chip in and join the Crossing campaign.',
      cta: 'Chip in & join the Crossing →',
      href: AWAKEN_CROSSING_HREF,
    },
    events: {
      badge: 'Move 2',
      title: 'Help with the book tour',
      body: 'A tour stop needs someone to host it, produce it, spread word about it, or introduce the person who can. Pick the one that matches what you already have.',
      cta: 'See the four ways in →',
      href: AWAKEN_BOOK_TOUR_HREF,
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
      title: 'Get the book',
      body: 'The ebook of Mastering the Game of Allyship is live on Gumroad: nine chapters, eight appendices, and the ten myths the first chapter takes apart. The printed edition is what the press run pays for.',
      cta: 'Get the ebook →',
      href: AWAKEN_BOOK_SALES_HREF,
    },
    chapter: {
      badge: 'Move 5',
      title: 'Read Chapter One',
      body: 'The Infinite Arcade, and the ten myths that keep the game unwinnable. It costs an email address and arrives immediately.',
      cta: 'Send me the chapter →',
      href: AWAKEN_CHAPTER_ONE_HREF,
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
      title: 'The organization, in formation',
      body: 'What it needs is people, not money. See the four →',
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
