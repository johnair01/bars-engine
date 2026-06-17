/**
 * The Milestone BAR — three-wall "barn raising" config for the July 18 send-off.
 *
 * Single source of truth for the barn's three walls (the three *kinds* of money) plus the
 * in-kind "hands & beams" readout. Presentational components read this; it can later be
 * backed by live `CampaignMilestone` rows (one per wall) without changing the UI.
 *
 * Design + decisions: `.specify/specs/mtgoa-launch-barn-raising-party/milestone-bar-brainstorm.md`
 */

export type WallKey = "car" | "presale" | "runway";

/**
 * Campaign ref the July-18 barn lives under. The event `Instance` and the three wall
 * `CampaignMilestone` rows share this ref (see `scripts/seed-barn-raising.ts`).
 */
export const BARN_CAMPAIGN_REF = "mtgoa-barn-raising";

/** Ordered wall keys (matches `BARN_WALLS`). */
export const WALL_KEYS: readonly WallKey[] = ["car", "presale", "runway"];

export interface BarnWall {
  key: WallKey;
  /** Short display name. */
  name: string;
  /** The kind of money this wall collects. */
  kind: "gift" | "commerce" | "patronage";
  /** One-line framing. */
  blurb: string;
  /** Target in cents. For `runway`, this is a *monthly* target. */
  targetCents: number;
  /** Whether the target is one-time or recurring monthly. */
  cadence: "once" | "month";
  /** Where "raise a plank" sends a giver for this wall. */
  cta: { label: string; href: string };
  /** Tailwind accent classes, within the app palette. */
  accent: { bar: string; text: string; ring: string };
}

/** Confirmed targets (host, 2026-06-14). Presale is a modeled goal (units + $). */
export const BARN_WALLS: readonly BarnWall[] = [
  {
    key: "car",
    name: "Replace the car",
    kind: "gift",
    blurb:
      "The priority wall. A reliable replacement for the car that died — fills first.",
    targetCents: 850_000, // $8,500 all-in (car + tax/title/reg + inspection + contingency)
    cadence: "once",
    cta: { label: "Chip in for the car", href: "/event/donate?dswPath=money&wall=car" },
    accent: {
      bar: "from-amber-600 to-orange-500",
      text: "text-amber-300",
      ring: "border-amber-900/40",
    },
  },
  {
    key: "presale",
    name: "Pre-sale",
    kind: "commerce",
    blurb:
      "The book, RPG, deck, app, pins & Founder Bundle. Every pre-order raises this wall.",
    targetCents: 500_000, // modeled goal (~50 guests × mix of bundles/books); tracks $ AND units
    cadence: "once",
    cta: { label: "Browse the pre-sale", href: "/launch" },
    accent: {
      bar: "from-emerald-600 to-teal-500",
      text: "text-emerald-300",
      ring: "border-emerald-900/40",
    },
  },
  {
    key: "runway",
    name: "Runway",
    kind: "patronage",
    blurb:
      "Become a sustaining patron. Keeps the work standing — $1,500/mo of the $6k/mo horizon.",
    targetCents: 150_000, // $1,500/mo party sub-goal (25% of the $6,000/mo horizon)
    cadence: "month",
    cta: { label: "Become a patron", href: "/event/donate/wizard?wall=runway" },
    accent: {
      bar: "from-violet-600 to-fuchsia-500",
      text: "text-fuchsia-300",
      ring: "border-fuchsia-900/40",
    },
  },
] as const;

/** The whole runway horizon (Wall 3's long game), for context copy. */
export const RUNWAY_HORIZON_CENTS = 600_000; // $6,000/mo

/** Live (or illustrative) state for the barn. All default to 0 — the honest pre-launch state. */
export interface BarnState {
  /** Raised so far per wall, in cents (monthly committed for `runway`). */
  raisedCents: Record<WallKey, number>;
  /** In-kind: pledged helping hands (time + host labor). */
  hands: number;
  /** In-kind: pledged beams (space/resources offered). */
  beams: number;
}

export const EMPTY_BARN_STATE: BarnState = {
  raisedCents: { car: 0, presale: 0, runway: 0 },
  hands: 0,
  beams: 0,
};

/** Illustrative fill for design review (`?preview=1`) — clearly not real money. */
export const PREVIEW_BARN_STATE: BarnState = {
  raisedCents: { car: 520_000, presale: 185_000, runway: 84_000 },
  hands: 14,
  beams: 5,
};

/**
 * Map raw milestone rows → per-wall raised **cents**. `CampaignMilestone.currentValue` is
 * stored in **dollars** (see `src/actions/donate.ts`), so we ×100 here. Pure + tested.
 */
export function buildRaisedCents(
  rows: ReadonlyArray<{ wallKey: string | null; currentValue: number }>,
): Record<WallKey, number> {
  const out: Record<WallKey, number> = { car: 0, presale: 0, runway: 0 };
  for (const r of rows) {
    if (r.wallKey === "car" || r.wallKey === "presale" || r.wallKey === "runway") {
      out[r.wallKey] = Math.round(r.currentValue * 100);
    }
  }
  return out;
}

export function wallProgress01(wall: BarnWall, state: BarnState): number {
  if (wall.targetCents <= 0) return 0;
  return Math.min(1, state.raisedCents[wall.key] / wall.targetCents);
}

/** Sum of all one-time walls' targets + raised (excludes monthly runway from the $ headline). */
export function oneTimeHeadline(state: BarnState): {
  raisedCents: number;
  targetCents: number;
  progress01: number;
} {
  const walls = BARN_WALLS.filter((w) => w.cadence === "once");
  const raisedCents = walls.reduce((s, w) => s + state.raisedCents[w.key], 0);
  const targetCents = walls.reduce((s, w) => s + w.targetCents, 0);
  return {
    raisedCents,
    targetCents,
    progress01: targetCents > 0 ? Math.min(1, raisedCents / targetCents) : 0,
  };
}

/** "$8,500" / "$1,500/mo". */
export function formatMoneyCents(cents: number, cadence: "once" | "month" = "once"): string {
  const dollars = Math.round(cents / 100);
  const base = `$${dollars.toLocaleString("en-US")}`;
  return cadence === "month" ? `${base}/mo` : base;
}

/** One guided next-step after a wall fills (FR6 "keep building"). */
export interface KeepBuildingAction {
  label: string;
  href: string;
}

/** "Keep building" guidance shown after a contribution tops off a wall. */
export interface KeepBuildingGuidance {
  /** The wall that just reached its target. */
  completedWallKey: WallKey;
  title: string;
  message: string;
  /** Ordered next steps: cross-wall → purchases → in-kind → access. */
  actions: KeepBuildingAction[];
}

/**
 * FR6: when a contribution tops off `creditedWall`, return the "keep building" redirect —
 * point the giver to the next plank (the other open walls first, then in-kind, then access).
 * Returns `null` when the credited wall is *not* yet full (no redirect needed). Pure + tested.
 */
export function keepBuildingAfterWall(
  state: BarnState,
  creditedWall: WallKey,
): KeepBuildingGuidance | null {
  const wall = BARN_WALLS.find((w) => w.key === creditedWall);
  if (!wall) return null;
  if (wallProgress01(wall, state) < 1) return null; // wall not full → no redirect

  const actions: KeepBuildingAction[] = [];
  // 1. Cross-wall: other walls still open, in priority order (car → pre-sale → runway).
  for (const w of BARN_WALLS) {
    if (w.key === creditedWall) continue;
    if (wallProgress01(w, state) < 1) {
      actions.push({ label: w.cta.label, href: w.cta.href });
    }
  }
  // 2. In-kind: lend time / offer space.
  actions.push({ label: "Lend a hand or offer space", href: "/event/donate/wizard?dswPath=time" });
  // 3. Access: open the app.
  actions.push({ label: "Open the app", href: "/game/" });

  return {
    completedWallKey: creditedWall,
    title: `${wall.name} is funded — roof's on that wall 🎉`,
    message: "Your gift topped off this wall. Here's where the next plank can go.",
    actions: actions.slice(0, 3),
  };
}

/** Threshold beats that "fire something real" as a wall fills (non-pressure). */
export const BARN_THRESHOLDS = [
  { at: 0.0, label: "First plank" },
  { at: 0.33, label: "Walls going up" },
  { at: 0.66, label: "Almost there" },
  { at: 1.0, label: "Roof on" },
] as const;
