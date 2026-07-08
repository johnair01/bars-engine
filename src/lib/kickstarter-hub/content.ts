/**
 * Kickstarter CYOA Hub — content model.
 *
 * Single source of truth for the July 17 Kickstarter hub (SPEC v2,
 * .specify docs: SPEC_KICKSTARTER_CYOA_HUB v2). The hub is a single interactive
 * page that answers a backer's three real questions without a click:
 *   1. how and when do I get my stuff   → the persistent fulfillment header (§2)
 *   2. what's next for MTGOA             → the Chapter 1 preview branch (§6)
 *   3. how can I get involved            → the expanded get-involved branch (§4)
 *
 * Branches are sequenced to mirror the reader's own journey through the book
 * (§3), not a product inventory. Every branch carries an explicit, visible
 * status and — when its asset isn't ready — a defined non-dead fallback (§5).
 *
 * Warm vs public (§7): the same branch set renders in two registers. The warm
 * hub (linked from the backer email) references the backing relationship and
 * "yours now, all of it"; the public hub (linked from social) drops that and
 * reframes as an invitation, while still stating the Aug 1 ship date plainly.
 *
 * Copy is deliberately lowercase (§8, visual system). Wording marked
 * "Wendell to finalize" in the spec is set here as a sensible default and is
 * safe to edit in place — this file is content, not logic.
 */

import { offerHref } from '@/lib/launch/offers'

export type HubAudience = 'warm' | 'public'

/** Every branch is visibly either actionable now, or honestly not-yet (§5). */
export type BranchStatus = 'ready' | 'coming-soon'

/** Accent channel (§8): coral is the primary action color; teal is reserved
 *  for the core transformation moves (open up / clean up / show up). */
export type HubAccent = 'coral' | 'teal'

export interface HubCta {
  label: string
  href: string
  /** Opens in a new tab (external commerce / scheduling surfaces). */
  external?: boolean
  /** Secondary CTAs render as a quieter ghost link beside the primary. */
  secondary?: boolean
}

export interface HubBranch {
  /** 1-based position in the spine (§3). */
  order: number
  /** The developmental move this step mirrors, e.g. "wake up". */
  move: string
  /** Small mono eyebrow, e.g. "01 · wake up". */
  eyebrow: string
  title: string
  /** Body copy — the warm register (references backing where relevant). */
  bodyWarm: string
  /** Body copy — the public register (invitation; no backer relationship). */
  bodyPublic: string
  status: BranchStatus
  accent: HubAccent
  /** The deck leads (§3 order 4): promoted, not equal-weight with the rest. */
  primary?: boolean
  /** Primary + optional secondary actions. Coming-soon branches may have none. */
  ctas?: HubCta[]
  /** Shown only on coming-soon branches: "here's what's coming and why" (§5). */
  holding?: string
}

/** Resolve the copy for one register. */
export function bodyFor(branch: HubBranch, audience: HubAudience): string {
  return audience === 'warm' ? branch.bodyWarm : branch.bodyPublic
}

// ── The persistent fulfillment header (§2) ──────────────────────────────────
// Always visible, above every branch, answering Q1 before any choice is made.
// Public register drops the four-year wait but still states the ship date.

export const SHIP_DATE = 'august 1'

export interface HubHeader {
  /** Mono kicker over the header. */
  kicker: string
  /** The plain fulfillment fact — the first thing an anxious backer reads. */
  statusLine: string
  /** One supporting line under the fact. */
  subline: string
}

export function headerFor(audience: HubAudience): HubHeader {
  if (audience === 'warm') {
    return {
      kicker: 'mastering the game of allyship',
      statusLine: `the book ships ${SHIP_DATE} — and everything else here is yours now, all of it.`,
      subline:
        'you backed this four years ago. this page is the rest of what you backed, ready to use today while the book makes its way to you.',
    }
  }
  return {
    kicker: 'mastering the game of allyship',
    statusLine: `the book ships ${SHIP_DATE} — here's everything that's ready to play with right now.`,
    subline:
      'a game, two quizzes, and a deck for doing the work — no wait, no account needed to start.',
  }
}

// ── 1:1 coaching bridge (§4) ────────────────────────────────────────────────
// A single 90-minute call, $150, one-time — NOT the premium cohort. Payment via
// Gumroad, scheduling via Calendly (both already set up). URLs are pasted in via
// env, matching the launch registry's pattern; absent → honest /launch fallback.

export const ONE_ON_ONE_PRICE = '$150'
export const ONE_ON_ONE_FORMAT = 'single 90-minute call, one-time'

/** Where the 1:1 payment lives (Gumroad). Falls back to the launch page. */
export function oneOnOneHref(): string {
  const url = process.env.NEXT_PUBLIC_GUMROAD_1ON1_URL?.trim()
  return url && url.length > 0 ? url : '/launch#coaching'
}

/** Where the 1:1 gets scheduled (Calendly), if wired separately. */
export function oneOnOneScheduleHref(): string | null {
  const url = process.env.NEXT_PUBLIC_CALENDLY_1ON1_URL?.trim()
  return url && url.length > 0 ? url : null
}

// ── Get involved — the four concrete actions + self-report (§4) ──────────────

export interface InvolveAction {
  key: 'buy-deck' | '1on1' | 'sell-book' | 'social'
  title: string
  bodyWarm: string
  bodyPublic: string
  cta: HubCta
  status: BranchStatus
}

export function involveActions(): InvolveAction[] {
  const scheduleHref = oneOnOneScheduleHref()
  return [
    {
      key: 'buy-deck',
      title: 'buy the deck',
      bodyWarm:
        'played with it and want it in your hands? a clear next click to own the full 120-card deck — not folded into the sample above.',
      bodyPublic:
        'want the full 120-card deck for doing the work? one click to own it.',
      cta: { label: 'buy the deck', href: offerHref('deck-digital'), external: true },
      status: 'ready',
    },
    {
      key: '1on1',
      title: 'sit down with wendell, 1:1',
      bodyWarm:
        `personalized support to use the book and deck now, while the rest of the ecosystem finishes building — ${ONE_ON_ONE_FORMAT}, ${ONE_ON_ONE_PRICE}. not the cohort (that's the deeper transformation, later); this is a bridge for the gap before it exists.`,
      bodyPublic:
        `personalized support to put the book and deck to work — ${ONE_ON_ONE_FORMAT}, ${ONE_ON_ONE_PRICE}. a bridge, not the full cohort.`,
      cta: {
        label: scheduleHref ? 'book your call' : 'book your call',
        href: oneOnOneHref(),
        external: true,
      },
      status: 'ready',
    },
    {
      key: 'sell-book',
      title: 'help sell the book',
      bodyWarm:
        "the single most useful thing you can do. grab ready-to-send copy below — no writing required, just paste and share with someone who'd want it.",
      bodyPublic:
        'know someone who needs this? grab ready-to-send copy below and pass it along.',
      // Anchors to the ShareKit on the same page — a concrete action, never "spread the word".
      cta: { label: 'get shareable copy', href: '#share-kit' },
      status: 'ready',
    },
    {
      key: 'social',
      title: 'post about it',
      bodyWarm:
        "something to actually post — not just an invitation to be enthusiastic. copy, paste, done.",
      bodyPublic:
        'give your feed something real — copy-paste posts ready to go.',
      cta: { label: 'get post copy', href: '#share-kit' },
      status: 'ready',
    },
  ]
}

/** Identification-not-solicitation self-report (§4, carried from v1). Routing of
 *  this data is Wendell's open decision (§9) — the UI captures intent only. */
export interface SelfReportCategory {
  key: string
  label: string
  blurb: string
}

export const SELF_REPORT_CATEGORIES: SelfReportCategory[] = [
  {
    key: 'org-budget-connector',
    label: 'i can open an org door',
    blurb: 'i work somewhere with a budget or a team that should see this.',
  },
  {
    key: 'donor-connector',
    label: 'i can fund or connect',
    blurb: 'i can give, or introduce you to someone who can.',
  },
  {
    key: 'hype-builder',
    label: "i'm a hype-builder",
    blurb: "i love this and i'll help it travel.",
  },
  {
    key: 'here-for-july-17',
    label: "i'm just here for july 17",
    blurb: 'no ask — i backed it and i wanted to look around.',
  },
]

// ── Shareable copy (§4: "help sell the book" / "post on social") ─────────────
// Something concrete to click and paste, per the spec's anti-"spread the word"
// requirement. Warm and public variants.

export interface ShareSnippet {
  key: string
  label: string
  textWarm: string
  textPublic: string
}

export const SHARE_SNIPPETS: ShareSnippet[] = [
  {
    key: 'short',
    label: 'short & personal',
    textWarm:
      "i backed 'mastering the game of allyship' years ago and it's finally here — a book, a game, and a deck for doing the work instead of just talking about it. the book ships aug 1; you can play with the deck today.",
    textPublic:
      "'mastering the game of allyship' turns allyship into something you practice, not perform — a book, a game, and a deck. book ships aug 1; the deck's playable now.",
  },
  {
    key: 'quiz',
    label: 'lead with the quiz',
    textWarm:
      'took the "find your allyship superpower" quiz from mastering the game of allyship — no signup, result in two minutes. worth it. the whole thing lands aug 1.',
    textPublic:
      'free 2-minute quiz: find your allyship superpower. no signup. from "mastering the game of allyship" — book out aug 1.',
  },
]

/** Internal link to the Chapter 1 surface, keeping the reader's register. Always
 *  a real destination — the excerpt when ready, else the coming-soon page (§5/§6);
 *  never a redirect and never a dead link. */
export function chapterOneHref(audience: HubAudience): string {
  const base = '/kickstarter/chapter-1'
  return audience === 'public' ? `${base}?audience=public` : base
}

// ── The spine (§3) ──────────────────────────────────────────────────────────

export function hubBranches(audience: HubAudience = 'warm'): HubBranch[] {
  const chapterReady = chapterOnePreviewReady()
  return [
    // 1 — Wake Up: framing beat. New copy, no build. Must explain the *point*
    // before asking for a quiz answer.
    {
      order: 1,
      move: 'wake up',
      eyebrow: '01 · wake up',
      title: 'you have an allyship superpower',
      bodyWarm:
        "before the quiz, the point: a superpower is the specific way you're built to show up for others — the move that comes naturally to you and lands for the people around you. the book opens here, in chapter 1, because you can't play a game you can't see. so first, let's help you see yours.",
      bodyPublic:
        "the point first: a superpower is the specific way you're built to show up for others — the move that's natural to you and actually lands. it's where the book opens, chapter 1, because you can't play a game you can't see. so let's help you see yours.",
      status: 'ready',
      accent: 'coral',
    },
    // 2 — Open Up: superpower quiz. Built, needs wiring. Result bridges to
    // "here's what this means for you."
    {
      order: 2,
      move: 'open up',
      eyebrow: '02 · open up',
      title: 'find your superpower',
      bodyWarm:
        'twelve quick choices, no signup, result the moment you finish. you carry more than one — this shows which you lead with, and what that means for your next move.',
      bodyPublic:
        'twelve quick choices, no signup, result the moment you finish. a lens for your next move, not a box.',
      status: 'ready',
      accent: 'teal',
      ctas: [{ label: 'find your superpower', href: '/superpower' }],
    },
    // 3 — Clean Up: myths quiz. Built, needs wiring. Result bridges to "one
    // thing you can do about this today."
    {
      order: 3,
      move: 'clean up',
      eyebrow: '03 · clean up',
      title: 'find the myth you inherited',
      bodyWarm:
        "the stories about allyship you never chose but still carry. this read names the one running loudest for you — and hands you one thing you can actually do about it today, not just a diagnosis.",
      bodyPublic:
        'the allyship stories you never chose but still carry. this read names the loudest one — and one concrete thing to do about it today.',
      status: 'ready',
      accent: 'teal',
      ctas: [{ label: 'read your myths', href: '/mastering-allyship/myths-read' }],
    },
    // 4 — Show Up (start now): the deck. Ready today, zero caveats. THE primary
    // "act on this right now" CTA — promoted, not equal-weight.
    {
      order: 4,
      move: 'show up',
      eyebrow: '04 · show up · start now',
      title: 'play with the deck',
      bodyWarm:
        "the one thing here with nothing pending — no wait, no caveats, ready this second. 120 moves for doing the work, right now, for free. this is where you go from reading about it to actually playing.",
      bodyPublic:
        'nothing pending, no caveats — playable this second. 120 moves for doing the work, free. the fastest way from reading about allyship to practicing it.',
      status: 'ready',
      accent: 'teal',
      primary: true,
      ctas: [
        { label: 'play the deck', href: '/deck/preview' },
        { label: 'see the full deck', href: '/deck/sales', secondary: true },
      ],
    },
    // 5 — What's next: Chapter 1 preview. Launches in a "coming very soon"
    // holding state; upgraded to the real excerpt the moment it lands (§6).
    {
      order: 5,
      move: "what's next",
      eyebrow: "05 · what's next",
      title: 'read chapter 1',
      bodyWarm:
        "proof, not a status update: the actual opening of the book you backed. it's in final polish and lands here in the next day or two — this page upgrades itself the moment it's ready.",
      bodyPublic:
        "the actual opening of the book — in final polish, landing here in the next day or two. this page upgrades itself the moment it's ready.",
      status: chapterReady ? 'ready' : 'coming-soon',
      accent: 'coral',
      // Always a real destination: the excerpt when ready, else the coming-soon
      // page (which itself points on to /launch). Never a dead link (§5).
      ctas: [
        {
          label: chapterReady ? 'read chapter 1' : 'see what’s coming',
          href: chapterOneHref(audience),
        },
      ],
      holding:
        "coming very soon — the excerpt is in final polish. we'd rather show you the real thing than a placeholder, so it lands here in the next day or two.",
    },
    // 6 — Get involved: expanded self-report + concrete CTAs. Rendered by the
    // page from involveActions() + SELF_REPORT_CATEGORIES + SHARE_SNIPPETS.
    {
      order: 6,
      move: 'get involved',
      eyebrow: '06 · get involved',
      title: 'four ways in',
      bodyWarm:
        "no single ask — pick the one that fits. buy the deck, sit down with me 1:1, help the book find its people, or just tell me who you are so i know how to have you in this.",
      bodyPublic:
        'pick the one that fits: buy the deck, book a 1:1, help the book find its people, or just tell us who you are.',
      status: 'ready',
      accent: 'coral',
    },
    // 7 — Help fund the crossing: car campaign. Drafted, assets pending → last,
    // one path among several, the single explicit monetary ask (§3).
    {
      order: 7,
      move: 'help fund the crossing',
      eyebrow: '07 · help fund the crossing',
      title: 'the car campaign',
      bodyWarm:
        "the one straight-up money ask, and it comes last on purpose — after everything else has already been offered to you. it funds the literal crossing that gets this work to the people who need it.",
      bodyPublic:
        'the one direct money ask, last on purpose. it funds the crossing that carries this work to the people who need it.',
      status: 'coming-soon',
      accent: 'coral',
      holding:
        "still coming together — the video and giving rails aren't live yet. rather than send you to a half-built page, here's the honest state: it's drafted, and it'll open here soon.",
    },
  ]
}

/** Chapter 1 excerpt readiness. Off until the manuscript lands (§6); flip via
 *  env once the excerpt page ships so the branch upgrades from holding → live. */
export function chapterOnePreviewReady(): boolean {
  return process.env.NEXT_PUBLIC_HUB_CHAPTER1_READY === 'true'
}
