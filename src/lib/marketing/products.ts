/**
 * Marketing product catalog — the single source of truth for the public funnel.
 *
 * The /pricing sales hub reads from this list so a visitor can understand the whole
 * offering before logging in, and so every path cross-sells into the others (the funnel
 * goal). This catalog backs **Wall 2 (pre-sale)** of the July 18 Milestone BAR — see
 * `.specify/specs/mtgoa-launch-barn-raising-party/milestone-bar-brainstorm.md` (§13).
 *
 * Prices are confirmed by the host (2026-06-14). `href` currently points at the closest
 * internal surface; swap each for an external store/checkout URL when one exists.
 */
export type ProductKey =
  | "app"
  | "bundle"
  | "book"
  | "rpg-book"
  | "deck"
  | "igniting-joy"
  | "pins";

/** Billing shape of a price: a one-time charge, a monthly sub, or a lifetime unlock. */
export type PriceCadence = "once" | "month" | "lifetime";

export interface PriceVariant {
  /** Short variant label, e.g. "Digital", "Physical (pre-order)". */
  label: string;
  amountCents: number;
  cadence: PriceCadence;
  /** Optional honest caveat, e.g. fulfillment timing. */
  note?: string;
}

export interface MarketingProduct {
  key: ProductKey;
  name: string;
  tagline: string;
  description: string;
  /** Primary destination for "learn more / start / buy". */
  href: string;
  cta: string;
  /** Optional secondary action (e.g. a deep link into a mode). */
  secondary?: { label: string; href: string };
  /** True when the destination is reachable without logging in. */
  publicAccess: boolean;
  /** Purchase options. Empty = bundled/included (see `priceNote`). */
  prices: PriceVariant[];
  /** Shown when there is no standalone price (bundled/free items). */
  priceNote?: string;
  /** Tailwind accent classes (kept within the app's existing palette). */
  accent: {
    ring: string;
    text: string;
    button: string;
  };
}

export const MARKETING_PRODUCTS: MarketingProduct[] = [
  {
    key: "app",
    name: "The App",
    tagline: "Mastering Allyship — play the engine",
    description:
      "The bars-engine Mastering Allyship app. Face an encounter, read what the other person actually needs, and metabolize it into a win. A subscription also unlocks the digital book, the digital RPG book, and Igniting Joy.",
    href: "/game/",
    cta: "Open the app",
    secondary: { label: "Try Applied Mode", href: "/game/#applied" },
    publicAccess: true,
    prices: [
      {
        label: "Subscription",
        amountCents: 1000,
        cadence: "month",
        note: "includes digital book, digital RPG book & Igniting Joy",
      },
    ],
    accent: {
      ring: "hover:border-emerald-600/60",
      text: "text-emerald-300",
      button:
        "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white",
    },
  },
  {
    key: "bundle",
    name: "Founder Bundle",
    tagline: "Everything, for good",
    description:
      "Lifetime access to the app plus the digital version of every product — the book, the RPG book, the deck, and Igniting Joy. The single best way to back the work and get it all.",
    href: "/event",
    cta: "Get the Founder Bundle",
    publicAccess: true,
    prices: [{ label: "Lifetime", amountCents: 15000, cadence: "lifetime" }],
    accent: {
      ring: "hover:border-fuchsia-600/60",
      text: "text-fuchsia-300",
      button:
        "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white",
    },
  },
  {
    key: "book",
    name: "The Book",
    tagline: "Mastering the Game of Allyship",
    description:
      "The story and the frame everything else is built on. Read the front of the book free, phone-first — or get the full digital or physical edition.",
    href: "/handbook",
    cta: "Read the free preview",
    publicAccess: true,
    prices: [
      { label: "Digital", amountCents: 1500, cadence: "once" },
      {
        label: "Physical (pre-order)",
        amountCents: 2500,
        cadence: "once",
        note: "in hands by end of July",
      },
    ],
    accent: {
      ring: "hover:border-teal-600/60",
      text: "text-teal-300",
      button:
        "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white",
    },
  },
  {
    key: "rpg-book",
    name: "The Roleplaying Game Book",
    tagline: "Run allyship at the table",
    description:
      "The full tabletop RPG manual — Schools, ranks, and the School Ship. Turn the practice into a game your whole table can play.",
    href: "/handbook",
    cta: "Pre-order the RPG book",
    publicAccess: true,
    prices: [
      { label: "Physical", amountCents: 4900, cadence: "once" },
      { label: "Digital", amountCents: 3000, cadence: "once" },
    ],
    accent: {
      ring: "hover:border-indigo-600/60",
      text: "text-indigo-300",
      button:
        "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white",
    },
  },
  {
    key: "deck",
    name: "The Deck",
    tagline: "Scene cards for real play",
    description:
      "Turn a charged moment into a scene and a quest. The creator deck is where the practice becomes something you can run at a table.",
    href: "/creator-scene-deck",
    cta: "Open the deck",
    publicAccess: false,
    prices: [{ label: "Physical", amountCents: 3000, cadence: "once" }],
    accent: {
      ring: "hover:border-amber-600/60",
      text: "text-amber-300",
      button:
        "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white",
    },
  },
  {
    key: "igniting-joy",
    name: "Igniting Joy",
    tagline: "A digital-only companion book",
    description:
      "A separate book on igniting joy — included automatically with any app subscription or the Founder Bundle. Digital only.",
    href: "/game/",
    cta: "Get it with the App",
    publicAccess: true,
    prices: [],
    priceNote: "Included with the App & Founder Bundle",
    accent: {
      ring: "hover:border-rose-600/60",
      text: "text-rose-300",
      button:
        "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white",
    },
  },
  {
    key: "pins",
    name: "Allyship Enamel Pins",
    tagline: "Wear the work",
    description:
      "Collectible allyship enamel pins. A small, joyful way to carry the practice into the world — and back the launch.",
    href: "/event",
    cta: "Reserve pins",
    publicAccess: true,
    prices: [{ label: "Each", amountCents: 1500, cadence: "once" }],
    accent: {
      ring: "hover:border-sky-600/60",
      text: "text-sky-300",
      button:
        "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white",
    },
  },
];

/** Human price label, e.g. "$15", "$10/mo", "$150 lifetime". */
export function formatPrice(variant: PriceVariant): string {
  const dollars = variant.amountCents / 100;
  const amount = Number.isInteger(dollars)
    ? `$${dollars}`
    : `$${dollars.toFixed(2)}`;
  if (variant.cadence === "month") return `${amount}/mo`;
  if (variant.cadence === "lifetime") return `${amount} lifetime`;
  return amount;
}

/** The lowest price across a product's variants, for "from $X" summaries. */
export function lowestPrice(product: MarketingProduct): PriceVariant | null {
  if (product.prices.length === 0) return null;
  return product.prices.reduce((min, p) =>
    p.amountCents < min.amountCents ? p : min,
  );
}

/** Cross-sell helper: a few other products to surface from a given one. */
export function otherProducts(
  key: ProductKey,
  limit = 3,
): MarketingProduct[] {
  return MARKETING_PRODUCTS.filter((p) => p.key !== key).slice(0, limit);
}
