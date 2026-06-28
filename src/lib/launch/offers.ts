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
import { BARN_WALLS } from '@/lib/event/barn-raising'
import { SUPERPOWERS, SUPERPOWER_DEFS, type Superpower } from '@/lib/superpowers/types'

/** The hand-authored launch SKUs (book, deck, handbook, subscription, bundles). */
export type CoreOfferKey =
  | 'book-digital'
  | 'rpg-handbook-digital'
  | 'deck-digital'
  | 'game-subscription'
  | 'book-physical'
  | 'rpg-handbook-physical'
  | 'founding-ally'

/**
 * Superpower expansion-pack SKU. MUST equal `superpowerPackSku(sp)` from
 * `player-entitlements/superpower-skus.ts` — the entitlement layer derives pack
 * ownership from this exact string pattern, so the two are one identity.
 */
export type SuperpowerPackKey = `superpower-${Superpower}-pack`

/** The deck + both loadout packs, sold together (single-charge — see grants.ts). */
export type LoadoutBundleKey = 'loadout-bundle'

export type OfferKey = CoreOfferKey | SuperpowerPackKey | LoadoutBundleKey

/** Typed pack OfferKey for a superpower — identical string to `superpowerPackSku`. */
export function superpowerPackOfferKey(sp: Superpower): SuperpowerPackKey {
  return `superpower-${sp}-pack`
}

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
  loadoutBundle:      process.env.NEXT_PUBLIC_GUMROAD_LOADOUT_BUNDLE_URL ?? '',
} as const

// Per-pack Gumroad URLs. Static member access so Next inlines NEXT_PUBLIC_* at
// build; absent URLs render "setup pending" (honest, never a dead link).
const GUMROAD_PACKS: Record<Superpower, string> = {
  connector:     process.env.NEXT_PUBLIC_GUMROAD_SP_CONNECTOR_URL ?? '',
  storyteller:   process.env.NEXT_PUBLIC_GUMROAD_SP_STORYTELLER_URL ?? '',
  strategist:    process.env.NEXT_PUBLIC_GUMROAD_SP_STRATEGIST_URL ?? '',
  disruptor:     process.env.NEXT_PUBLIC_GUMROAD_SP_DISRUPTOR_URL ?? '',
  alchemist:     process.env.NEXT_PUBLIC_GUMROAD_SP_ALCHEMIST_URL ?? '',
  escape_artist: process.env.NEXT_PUBLIC_GUMROAD_SP_ESCAPE_ARTIST_URL ?? '',
  coach:         process.env.NEXT_PUBLIC_GUMROAD_SP_COACH_URL ?? '',
}

const CORE_LAUNCH_OFFERS: readonly LaunchOffer[] = [
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
    blurb:
      'The book, instantly — and a 30-day key into the app to play what you read. Pay what feels right; $15 is the suggested seed.',
    includes: ['The digital book', '30 days of app access'],
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
    blurb: 'The 120-move Oracle at the Edge of the Known World. (Also included with The Game.)',
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

/** $8 add-on per superpower — the 60-card expansion model. */
const PACK_PRICE_CENTS = 800

/**
 * The seven superpower expansion packs, generated from `SUPERPOWER_DEFS` so the
 * catalog can never drift from the canonical superpower set (incl. Coach — every
 * superpower has a purchasable pack; no second-class loadout slot). Element is the
 * superpower's own channel (semantic, never decorative — UI_COVENANT Law 9).
 */
const SUPERPOWER_PACK_OFFERS: readonly LaunchOffer[] = SUPERPOWERS.map((sp) => {
  const def = SUPERPOWER_DEFS[sp]
  return {
    key: superpowerPackOfferKey(sp),
    name: `${def.label} Pack`,
    blurb: `The 60-card ${def.label} expansion — five moves across six levels, inner and outer. Adds your ${def.label} depth to any allyship campaign.`,
    includes: [
      '60 superpower-move cards',
      'Inner + outer aspects',
      'Clickable “Go Deeper” on matching deck cards',
    ],
    group: 'digital',
    priceCents: PACK_PRICE_CENTS,
    gumroadUrl: GUMROAD_PACKS[sp],
    cta: 'Buy',
    element: def.channel as ElementKey,
    altitude: 'neutral',
    stage: 'growing',
  }
})

/**
 * The loadout bundle: deck access + both packs in the player's loadout. Priced as
 * deck + two packs with a small bundle discount. SINGLE-CHARGE: a deck owner whose
 * inner pack was auto-granted on quiz completion is not re-charged for it — the
 * deferred grant is idempotent by SKU (see grants.ts + saveSuperpowerLoadout).
 */
const LOADOUT_BUNDLE_OFFER: LaunchOffer = {
  key: 'loadout-bundle',
  name: 'Your Loadout Bundle',
  blurb:
    'The deck plus both superpower packs in your loadout — inner and outer, together. The full Go Deeper experience for your two superpowers.',
  includes: ['Digital deck access', 'Your inner superpower pack', 'Your outer superpower pack'],
  group: 'bundle',
  priceCents: 2000,
  gumroadUrl: GUMROAD.loadoutBundle,
  cta: 'Equip your loadout',
  element: 'wood',
  altitude: 'satisfied',
  stage: 'growing',
  hero: true,
}

export const LAUNCH_OFFERS: readonly LaunchOffer[] = [
  ...CORE_LAUNCH_OFFERS,
  ...SUPERPOWER_PACK_OFFERS,
  LOADOUT_BUNDLE_OFFER,
]

/**
 * Launch fundraising target — the spine of the campaign. Derived from the barn's
 * **pre-sale wall** target so the two can never drift: launch sales *are* the pre-sale
 * wall (see the Gumroad webhook bridge). Single source of truth: `BARN_WALLS`.
 */
export const LAUNCH_GOAL_CENTS =
  BARN_WALLS.find((w) => w.key === 'presale')?.targetCents ?? 500_000 // $5,000

/** Format US cents as a price string, e.g. 1500 → "$15", 500000 → "$5,000". */
export function formatPrice(cents: number): string {
  const dollars = cents / 100
  return Number.isInteger(dollars)
    ? `$${dollars.toLocaleString('en-US')}`
    : `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Offers belonging to a UI group, in registry order. */
export function offersByGroup(group: OfferGroup): LaunchOffer[] {
  return LAUNCH_OFFERS.filter((o) => o.group === group)
}

/** Look up an offer by its SKU, or undefined if unknown. */
export function offerByKey(key: string): LaunchOffer | undefined {
  return LAUNCH_OFFERS.find((o) => o.key === key)
}

/** Whether an OfferKey is a superpower expansion pack (vs a core/bundle SKU). */
export function isSuperpowerPackKey(key: string): boolean {
  return /^superpower-.+-pack$/.test(key)
}

/**
 * Where the buyer should be sent for a SKU: the live Gumroad product if wired,
 * else the /launch page anchored to the offer (honest fallback, never dead).
 */
export function offerHref(key: string): string {
  const offer = offerByKey(key)
  if (offer && isOfferLive(offer)) return offer.gumroadUrl
  return `/launch#${key}`
}

/** Whether an offer is purchasable right now (Gumroad URL wired). */
export function isOfferLive(offer: LaunchOffer): boolean {
  return offer.gumroadUrl.trim().length > 0
}

// Re-export the UI channel types for consumers of the registry.
export type { ElementKey, CardAltitude, CardStage }
