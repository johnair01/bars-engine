/**
 * Marketing product catalog — the single source of truth for the public funnel.
 *
 * The /pricing sales hub, the logged-out landing, and the public NavBar all read
 * from this list so a visitor can understand the whole offering before logging
 * in, and so every path cross-sells into the others (the funnel goal). Internal
 * routes only; swap `href` for an external store/checkout URL when one exists.
 */
export interface MarketingProduct {
  key: "book" | "deck" | "game";
  name: string;
  tagline: string;
  description: string;
  /** Primary destination for "learn more / start". */
  href: string;
  cta: string;
  /** Optional secondary action (e.g. a deep link into a mode). */
  secondary?: { label: string; href: string };
  /** True when the destination is reachable without logging in. */
  publicAccess: boolean;
  /** Tailwind accent classes (kept within the app's existing palette). */
  accent: {
    ring: string;
    text: string;
    button: string;
  };
}

export const MARKETING_PRODUCTS: MarketingProduct[] = [
  {
    key: "book",
    name: "The Book",
    tagline: "Mastering the Game of Allyship",
    description:
      "The front of the book, phone-first. Read the story and the frame that everything else is built on — free, no account needed.",
    href: "/handbook",
    cta: "Read the handbook",
    publicAccess: true,
    accent: {
      ring: "hover:border-teal-600/60",
      text: "text-teal-300",
      button:
        "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white",
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
    accent: {
      ring: "hover:border-amber-600/60",
      text: "text-amber-300",
      button:
        "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white",
    },
  },
  {
    key: "game",
    name: "The Game",
    tagline: "Play the allyship engine",
    description:
      "Face an encounter, read what the other person actually needs, and metabolize it into a win. Playable right now in your browser — no account.",
    href: "/game/",
    cta: "Play now",
    secondary: { label: "Try Applied Mode", href: "/game/#applied" },
    publicAccess: true,
    accent: {
      ring: "hover:border-emerald-600/60",
      text: "text-emerald-300",
      button:
        "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white",
    },
  },
];

/** Cross-sell helper: the other products to surface from a given one. */
export function otherProducts(key: MarketingProduct["key"]): MarketingProduct[] {
  return MARKETING_PRODUCTS.filter((p) => p.key !== key);
}
