/**
 * BARS ENGINE — Launch Offer Registry
 *
 * Single source of truth for the Mastering Allyship launch SKUs.
 * Drives the /launch offer page today; the same registry will feed the
 * eventual in-app Stripe checkout + RedemptionPack entitlement flow, so the
 * SKU keys here are the canonical product identifiers across surfaces.
 *
 * Commerce model (Phase 1): Gumroad hosts payment. Each offer links out to a
 * Gumroad product URL, supplied via a NEXT_PUBLIC_GUMROAD_*_URL env var so the
 * page ships now and product URLs are pasted in as products are created. When a
 * URL is absent the offer renders in a "setup pending" state rather than a dead
 * link — honest by default.
 *
 * Three-channel UI encoding (see UI_COVENANT.md). Element assignment is
 * semantic, never decorative (Law 9):
 *   - Digital book   → Water  (the source text — depth, flow)
 *   - RPG handbook   → Metal  (rules, structure, refinement)
 *   - Deck access    → Fire   (the oracle's illumination)
 *   - The Game       → Wood   (living, generative play)
 *   - Physical book  → Earth  (the text manifested in matter)
 *   - Founding Ally  → Earth, satisfied + ritual (the patron tier that grounds the launch)
 */

import type { ElementKey, CardAltitude, CardStage } from '@/lib/ui/card-tokens'
import type { AlchemyAltitude } from '@/lib/alchemy/types'

export type OfferKey =
  | 'book-digital'
  | 'rpg-handbook-digital'
  | 'deck-digital'
  | 'game-subscription'
  | 'book-physical'
  | 'rpg-handbook-physical'
  | 'founding-ally'

export type OfferGroup = 'digital' | 'physical' | 'bundle'

export interface LaunchOffer {
  key: OfferKey
  /** Display name — the card's name banner. */
  name: string
  /** One-line value proposition — body text (player-facing prose). */
  blurb: string
  /** What the buyer receives — itemized for bundles / subscriptions. */
  includes?: string[]
  group: OfferGroup
  /** Price in US cents. For PWYW this is the suggested anchor. */
  priceCents: number
  /** Pay-what-you-want — buyer sets the final amount on Gumroad; price is the anchor. */
  pwyw?: boolean
  /** Recurring (subscription) vs one-time / preorder. */
  recurring?: 'month'
  /** Preorder — fulfilled after launch (physical goods). */
  preorder?: boolean
  /** Gumroad product URL, or '' when not yet wired. */
  gumroadUrl: string
  /** CTA verb, e.g. "Buy", "Preorder", "Subscribe". */
  cta: string

  // ── Three-channel UI encoding ──
  element: ElementKey
  altitude: AlchemyAltitude
  stage: CardStage
  /** Hero treatment — alchemical moment + idle float (bundle only). */
  hero?: boolean
}

// Gumroad URLs — referenced statically so Next.js can inline NEXT_PUBLIC_* at build.
const GUMROAD = {
  bookDigital:        process.env.NEXT_PUBLIC_GUMROAD_BOOK_DIGITAL_URL ?? '',
  rpgHandbookDigital: process.env.NEXT_PUBLIC_GUMROAD_RPG_DIGITAL_URL ?? '',
  deckDigital:        process.env.NEXT_PUBLIC_GUMROAD_DECK_DIGITAL_URL ?? '',
  gameSubscription:   process.env.NEXT_PUBLIC_GUMROAD_GAME_SUB_URL ?? '',
  bookPhysical:       process.env.NEXT_PUBLIC_GUMROAD_BOOK_PHYSICAL_URL ?? '',
  rpgHandbookPhysical:process.env.NEXT_PUBLIC_GUMROAD_RPG_PHYSICAL_URL ?? '',
  foundingAlly:       process.env.NEXT_PUBLIC_GUMROAD_FOUNDING_ALLY_URL ?? '',
} as const

export const LAUNCH_OFFERS: readonly LaunchOffer[] = [
  {
    key: 'founding-ally',
    name: 'Founding Ally Bundle',
    blurb:
      'The patron tier. Everything, in your hands and on your shelf — and your name in the founding cohort.',
    includes: [
      'Physical Mastering the Game of Allyship book',
      'Physical RPG Handbook',
      'Allyship enamel pin',
      'Digital deck access',
      'Lifetime access to the app',
    ],
    group: 'bundle',
    priceCents: 15000,
    gumroadUrl: GUMROAD.foundingAlly,
    cta: 'Become a Founding Ally',
    element: 'earth',
    altitude: 'satisfied',
    stage: 'growing',
    hero: true,
  },
  {
    key: 'book-digital',
    name: 'Mastering Allyship — Digital',
    blurb: 'The book, instantly. Pay what feels right — $15 is the suggested seed.',
    group: 'digital',
    priceCents: 1500,
    pwyw: true,
    gumroadUrl: GUMROAD.bookDigital,
    cta: 'Name your price',
    element: 'water',
    altitude: 'neutral',
    stage: 'growing',
  },
  {
    key: 'rpg-handbook-digital',
    name: 'RPG Handbook — Digital',
    blurb: 'The full tabletop rules — four moves, nations, archetypes, emotional alchemy.',
    group: 'digital',
    priceCents: 3000,
    gumroadUrl: GUMROAD.rpgHandbookDigital,
    cta: 'Buy',
    element: 'metal',
    altitude: 'neutral',
    stage: 'growing',
  },
  {
    key: 'deck-digital',
    name: 'Oracle Deck — Digital Access',
    blurb: 'The 52-card Oracle at the Edge of the Known World. (Also included with The Game.)',
    group: 'digital',
    priceCents: 1000,
    gumroadUrl: GUMROAD.deckDigital,
    cta: 'Buy',
    element: 'fire',
    altitude: 'neutral',
    stage: 'growing',
  },
  {
    key: 'game-subscription',
    name: 'The Game — Monthly',
    blurb: 'Play the living game. Your subscription includes the digital book and digital deck access.',
    includes: ['Full game access', 'Digital book included', 'Digital deck access included'],
    group: 'digital',
    priceCents: 1000,
    recurring: 'month',
    gumroadUrl: GUMROAD.gameSubscription,
    cta: 'Subscribe',
    element: 'wood',
    altitude: 'neutral',
    stage: 'growing',
  },
  {
    key: 'book-physical',
    name: 'Mastering Allyship — Physical',
    blurb: 'The printed book. Preorder now; ships after the print run.',
    group: 'physical',
    priceCents: 2500,
    preorder: true,
    gumroadUrl: GUMROAD.bookPhysical,
    cta: 'Preorder',
    element: 'earth',
    altitude: 'neutral',
    stage: 'growing',
  },
  {
    key: 'rpg-handbook-physical',
    name: 'RPG Handbook — Physical',
    blurb: 'The printed handbook for the table. Preorder now; ships after the print run.',
    group: 'physical',
    priceCents: 4900,
    preorder: true,
    gumroadUrl: GUMROAD.rpgHandbookPhysical,
    cta: 'Preorder',
    element: 'metal',
    altitude: 'neutral',
    stage: 'growing',
  },
]

/** Launch fundraising target — the spine of the campaign. */
export const LAUNCH_GOAL_CENTS = 80000 // $800

/** Format US cents as a price string, e.g. 1500 → "$15". */
export function formatPrice(cents: number): string {
  const dollars = cents / 100
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

/** Offers belonging to a UI group, in registry order. */
export function offersByGroup(group: OfferGroup): LaunchOffer[] {
  return LAUNCH_OFFERS.filter((o) => o.group === group)
}

/** Whether an offer is purchasable right now (Gumroad URL wired). */
export function isOfferLive(offer: LaunchOffer): boolean {
  return offer.gumroadUrl.trim().length > 0
}

// Re-export the UI channel types for consumers of the registry.
export type { ElementKey, CardAltitude, CardStage }
