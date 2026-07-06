import type { CoreOfferKey as OfferKey } from '@/lib/launch/offers'
import type { ElementKey } from '@/lib/ui/card-tokens'

export type LaunchIntent = 'curious' | 'tool' | 'practice' | 'shelf'

export interface LaunchHeroContent {
  eyebrow: string
  title: string
  body: string
}

export interface LaunchPieceContent {
  step: string
  name: string
  role: string
}

export interface LaunchIntentContent {
  key: LaunchIntent
  element: ElementKey
  label: string
  sub: string
}

export interface LaunchOfferContent {
  name: string
  blurb: string
  bestFor: string
  unlocks: string
  context: string
  kicker: string
  image: string
  heroImage: string
  intents: LaunchIntent[]
}

export interface LaunchPageContent {
  hero: LaunchHeroContent
  pieces: LaunchPieceContent[]
  intents: LaunchIntentContent[]
  offers: Record<OfferKey, LaunchOfferContent>
}

export const LAUNCH_DEFAULT_CONTENT: LaunchPageContent = {
  hero: {
    eyebrow: 'The launch',
    title: 'Which doorway is right for you right now?',
    body:
      'Five ways in, from reading Chapter 1 to sponsoring the whole launch. Find the one that fits before you reach for your wallet.',
  },
  pieces: [
    { step: '01', name: 'Book', role: 'Teaches the frame.' },
    { step: '02', name: 'Deck', role: 'Gives concrete moves.' },
    { step: '03', name: 'Game', role: 'The ongoing practice.' },
    { step: '04', name: 'Dojo', role: 'Your live practice room.' },
  ],
  intents: [
    {
      key: 'curious',
      element: 'water',
      label: 'I am curious',
      sub: 'Read Chapter 1, then the digital book.',
    },
    {
      key: 'tool',
      element: 'fire',
      label: 'I want a tool',
      sub: 'Draw concrete moves from the deck.',
    },
    {
      key: 'practice',
      element: 'wood',
      label: 'I want a practice',
      sub: 'Play the ongoing game.',
    },
    {
      key: 'shelf',
      element: 'earth',
      label: 'I want the whole shelf',
      sub: 'Everything, and sponsor the launch.',
    },
  ],
  offers: {
    'founding-ally': {
      name: 'Founding Ally Bundle',
      blurb:
        'The patron tier. Everything, in your hands and on your shelf — and your name in the founding cohort.',
      bestFor: 'Best for the whole shelf',
      unlocks: 'Everything in the launch stack',
      context:
        'Choose this when you want the physical shelf, digital tools, and a direct role in getting the launch over the wall.',
      kicker: 'Lifetime bundle',
      image: '/launch/founders-bundle-thumbnail-1080x1080.png',
      heroImage: '/launch/founders-bundle-cover-1280x720.png',
      intents: ['practice', 'shelf'],
    },
    'book-digital': {
      name: 'Mastering Allyship — Digital',
      blurb:
        'The book, instantly — and a 30-day key into the app to play what you read. Pay what feels right; $15 is the suggested seed.',
      bestFor: 'Curious - start with the frame',
      unlocks: 'Book plus 30 days of app access',
      context: 'Choose this when you want the core argument before committing to more practice tools.',
      kicker: 'Name your price',
      image: '/launch/cover-front.png',
      heroImage: '/launch/cover-front.png',
      intents: ['curious'],
    },
    'rpg-handbook-digital': {
      name: 'RPG Handbook — Digital',
      blurb: 'The full tabletop rules — four moves, nations, archetypes, emotional alchemy.',
      bestFor: 'Best for facilitators and rules readers',
      unlocks: 'The tabletop system',
      context:
        'Choose this when you want the rules, moves, nations, archetypes, and emotional alchemy structure.',
      kicker: 'Digital rules',
      image: '/launch/rpg-book-thumbnail-1080x1080.png',
      heroImage: '/launch/rpg-book-cover-1280x720.png',
      intents: ['practice'],
    },
    'deck-digital': {
      name: 'Allyship Deck — Digital Access',
      blurb:
        'The $22 practice deck upsell: one concrete allyship move at a time, for yourself or a real campaign.',
      bestFor: 'Wants a concrete tool',
      unlocks: 'Digital Allyship Deck',
      context:
        'Choose this when you want one usable move at a time for a real conversation or campaign.',
      kicker: 'Digital deck',
      image: '/launch/allyship-deck-thumbnail-1080x1080.png',
      heroImage: '/launch/allyship-deck-cover-1280x720.png',
      intents: ['tool'],
    },
    'game-subscription': {
      name: 'The Game — Monthly',
      blurb:
        'Play the living game. Your subscription includes the digital book and digital deck access.',
      bestFor: 'Wants the ongoing game',
      unlocks: 'Game access, book, and deck',
      context: 'Choose this when you want the living practice loop instead of only static materials.',
      kicker: 'Monthly practice',
      image: '/launch/founders-bundle-thumbnail-1080x1080.png',
      heroImage: '/launch/founders-bundle-cover-1280x720.png',
      intents: ['practice'],
    },
    'book-physical': {
      name: 'Mastering Allyship — Physical',
      blurb: 'The printed book. Preorder now; ships after the print run.',
      bestFor: 'Best if you want the printed book',
      unlocks: 'Physical book preorder',
      context:
        'Choose this when the object matters: reading away from the screen, gifting, marking up, returning.',
      kicker: 'Physical preorder',
      image: '/launch/cover-front.png',
      heroImage: '/launch/cover-front.png',
      intents: ['curious', 'shelf'],
    },
    'rpg-handbook-physical': {
      name: 'RPG Handbook — Physical',
      blurb: 'The printed handbook for the table. Preorder now; ships after the print run.',
      bestFor: 'Best table copy',
      unlocks: 'Physical handbook preorder',
      context: 'Choose this when you want the rules and play reference available at the table.',
      kicker: 'Physical preorder',
      image: '/launch/rpg-book-thumbnail-1080x1080.png',
      heroImage: '/launch/rpg-book-cover-1280x720.png',
      intents: ['practice', 'shelf'],
    },
    'deck-physical': {
      name: 'Oracle Deck — Physical',
      blurb: 'The printed 120-card deck, in your hands. Preorder now; ships after the print run.',
      bestFor: 'Wants the deck in hand',
      unlocks: 'Physical Allyship Deck preorder',
      context: 'Choose this when you want to draw a real card off a real table, not a screen.',
      kicker: 'Physical preorder',
      image: '/launch/allyship-deck-thumbnail-1080x1080.png',
      heroImage: '/launch/allyship-deck-cover-1280x720.png',
      intents: ['tool', 'shelf'],
    },
    'coaching': {
      name: 'Coaching — Your Allyship Game Master',
      blurb:
        'The one only Wendell does: someone in the fire with you, running the campaign at your side and turning the saboteurs into allies.',
      bestFor: 'Wants to go all the way',
      unlocks: '1:1 coaching + deck and digital book access',
      context:
        'Choose this when you want a partner in the work, not another framework — the deprogramming, done together.',
      kicker: 'By application',
      image: '/launch/founders-bundle-thumbnail-1080x1080.png',
      heroImage: '/launch/founders-bundle-cover-1280x720.png',
      intents: ['practice'],
    },
  },
}

const OFFER_KEYS = Object.keys(LAUNCH_DEFAULT_CONTENT.offers) as OfferKey[]
const INTENT_KEYS: LaunchIntent[] = ['curious', 'tool', 'practice', 'shelf']

function textOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function intentsOrDefault(value: unknown, fallback: LaunchIntent[]): LaunchIntent[] {
  if (!Array.isArray(value)) return fallback
  const valid = value.filter((item): item is LaunchIntent =>
    INTENT_KEYS.includes(item as LaunchIntent)
  )
  return valid.length ? valid : fallback
}

export function normalizeLaunchPageContent(input: unknown): LaunchPageContent {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<LaunchPageContent>
  const defaults = LAUNCH_DEFAULT_CONTENT

  return {
    hero: {
      eyebrow: textOrDefault(raw.hero?.eyebrow, defaults.hero.eyebrow),
      title: textOrDefault(raw.hero?.title, defaults.hero.title),
      body: textOrDefault(raw.hero?.body, defaults.hero.body),
    },
    pieces: defaults.pieces.map((fallback, index) => {
      const piece = raw.pieces?.[index]
      return {
        step: textOrDefault(piece?.step, fallback.step),
        name: textOrDefault(piece?.name, fallback.name),
        role: textOrDefault(piece?.role, fallback.role),
      }
    }),
    intents: defaults.intents.map((fallback) => {
      const item = raw.intents?.find((intent) => intent?.key === fallback.key)
      return {
        key: fallback.key,
        element: fallback.element,
        label: textOrDefault(item?.label, fallback.label),
        sub: textOrDefault(item?.sub, fallback.sub),
      }
    }),
    offers: OFFER_KEYS.reduce(
      (acc, key) => {
        const fallback = defaults.offers[key]
        const offer = raw.offers?.[key]
        acc[key] = {
          name: textOrDefault(offer?.name, fallback.name),
          blurb: textOrDefault(offer?.blurb, fallback.blurb),
          bestFor: textOrDefault(offer?.bestFor, fallback.bestFor),
          unlocks: textOrDefault(offer?.unlocks, fallback.unlocks),
          context: textOrDefault(offer?.context, fallback.context),
          kicker: textOrDefault(offer?.kicker, fallback.kicker),
          image: textOrDefault(offer?.image, fallback.image),
          heroImage: textOrDefault(offer?.heroImage, fallback.heroImage),
          intents: intentsOrDefault(offer?.intents, fallback.intents),
        }
        return acc
      },
      {} as Record<OfferKey, LaunchOfferContent>
    ),
  }
}

export function parseLaunchPageTheme(theme: string | null | undefined): LaunchPageContent {
  try {
    const parsed = theme ? (JSON.parse(theme) as { launchPage?: unknown }) : {}
    return normalizeLaunchPageContent(parsed.launchPage)
  } catch {
    return LAUNCH_DEFAULT_CONTENT
  }
}

export const LAUNCH_OFFER_KEYS = OFFER_KEYS
export const LAUNCH_INTENT_KEYS = INTENT_KEYS
