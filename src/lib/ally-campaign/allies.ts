/**
 * Ally Campaign — the warm layer.
 *
 * Named invites, the myths that specifically block people who LOVE the person
 * they're trying to help, and the "who he actually is" beat.
 *
 * ⚠️ EDIT ME BEFORE SENDING. The opening for each ally is personal writing put in
 * Wendell's mouth by a machine. It is a competent draft and it is not his
 * sentences. Read every word of `opening` and `closing` for your own invites
 * before the link goes out — especially `mom`.
 *
 * Adding an ally: one entry here, and `/ally/<slug>` exists. No deploy-time
 * registry, no database row. That is what makes running the whole family through
 * this cheap enough to actually do.
 */

import type { AllyshipDomainKey } from '@/lib/allyship-domains'
import { INPUTS, usd } from './economics'

export interface AllyInvite {
  /** URL slug — `/ally/<slug>`. */
  slug: string
  /** How they're addressed on the page. */
  displayName: string
  /** Mono eyebrow over the opening. */
  eyebrow: string
  /** The personal opening. Second person, to them, in his voice. */
  opening: string
  /** What lands after they finish — the sign-off. */
  closing: string
  /** Shown on the steward dashboard to distinguish invite cohorts. */
  cohort: 'family' | 'friends' | 'colleagues' | 'public'
}

export const ALLIES: Record<string, AllyInvite> = {
  mom: {
    slug: 'mom',
    displayName: 'Mom',
    eyebrow: 'a letter, with a game attached',

    // ⚠️ ADD THE PERSONAL BEAT. This letter is deliberately free of invented
    // history — it makes no claim about your past with her, because a machine
    // guessing at that is how you get a sentence that is either wrong or, worse,
    // accidentally right. It reads as honest and slightly formal as a result.
    // One or two true sentences from you, dropped in before "Start when you're
    // ready," is what turns it from a good letter into your letter.
    opening: `Mom —

I'm going to ask you for ${usd(INPUTS.carLoanCents)}, as a loan, to buy a car. I'd rather you know that in the first sentence than wonder about it for fifteen minutes.

Everything after this is me showing the work: what the car is for, what the rest of it costs, how I pay you back, and what it looks like if I'm wrong. In writing, with numbers you can check.

It's built as a game because that is literally the job — I build games that teach people how to help each other. The fastest way to show you what I actually do all day is to hand you one and let you play it.

Two things before you start.

First: "no" is a complete answer. Not a disappointing one, and not one I'll be quiet and wounded about afterward. I would rather have a clear no from you today than a yes you're privately worrying about in March.

Second: there is more than money in here. Most of what I need can't be bought at any price. If your honest answer turns out to be "not the money, but I could do that other thing" — that's a real yes, and it lands on the same board.

Start when you're ready.`,

    closing: `That's the whole thing, Mom. Nothing held back, and nothing rounded in my favor.

Whatever you picked is on my board now, and I can see it. If you picked nothing, that's a real answer and I meant it when I said so.

I'll call you this week. You've seen everything I've seen now, so we can just talk about it.

— Wendell`,
    cohort: 'family',
  },
}

/** Anyone arriving at `/ally/<unknown>` gets a warm, non-presumptuous version. */
export const DEFAULT_INVITE: AllyInvite = {
  slug: 'friend',
  displayName: 'friend',
  eyebrow: 'an invitation, with a game attached',
  opening: `Someone who knows me sent you here — or you found it yourself, which is even better.

This is the honest version of what I'm building: what it is, what it costs, what I need, and how it pays for itself. It's built as a game because that's what my work actually is. I build games that teach people how to help each other well, so the fastest way to show you is to hand you one.

Fifteen minutes. You'll find your allyship superpower, lose a couple of myths, and leave with something specific you could do — including, legitimately, nothing.`,
  closing: `That's it — the whole plan, nothing held back.

Whatever you picked is on the board now and I can see it. If you left your name, I'll follow up. If you didn't, thank you for reading anyway.

— Wendell`,
  cohort: 'friends',
}

export function resolveInvite(slug: string | undefined): AllyInvite {
  if (!slug) return DEFAULT_INVITE
  return ALLIES[slug.toLowerCase()] ?? { ...DEFAULT_INVITE, slug }
}

export const ALLY_SLUGS = Object.keys(ALLIES)

// ── The myths ───────────────────────────────────────────────────────────────

export interface AllyMyth {
  /** Stable id — persisted on the lead as `mythsSeen`. */
  id: string
  myth: string
  truth: string
  reframe: string
  domainHint?: AllyshipDomainKey
}

/**
 * Six myths, chosen for a specific reader: someone who loves you and therefore
 * gets a *worse* set of blockers than a stranger does. A stranger's myth is
 * "allyship isn't for me." A mother's myth is "helping means rescuing," which is
 * far more expensive and far harder to name out loud.
 *
 * Each maps to the domain whose emergent problem it actually obstructs.
 */
export const ALLY_MYTHS: readonly AllyMyth[] = [
  {
    id: 'ally-rescue',
    myth: 'Helping him means fixing it for him.',
    truth:
      'Rescue and allyship look identical from the outside and feel opposite from the inside. Rescue solves the problem and takes the agency with it; allyship removes an obstacle and leaves the person standing taller than before.',
    reframe:
      'Ask what the obstacle is before deciding what the help is. The answer is almost never the thing you assumed on the drive over.',
    domainHint: 'DIRECT_ACTION',
  },
  {
    id: 'ally-money-is-the-help',
    myth: 'If I write a check, I have done the helping part.',
    truth:
      'Money is one of four domains, not the whole board. Plenty of things here cannot be bought at any price — a warm introduction, a room, someone willing to say the plan is wrong.',
    reframe:
      'Money is the fastest help, not the deepest. Pick where you are actually strong, then decide whether money is also part of it.',
    domainHint: 'GATHERING_RESOURCES',
  },
  {
    id: 'ally-dont-understand',
    myth: "I don't really understand what he does, so I can't be useful.",
    truth:
      'You do not have to understand the work to move it. The person who finds a free room, or knows someone who runs a conference, changes the outcome without ever reading the book.',
    reframe:
      'Bring what you already have. Understanding the work is my job; having a life full of people and rooms is yours.',
    domainHint: 'RAISE_AWARENESS',
  },
  {
    id: 'ally-asking-means-failing',
    myth: "If he's asking me for money, it must be going badly.",
    truth:
      'Every book that ever reached a reader was capitalized by somebody before it earned anything. Needing capital at the point of manufacture is a stage of the process, not a verdict on the work.',
    reframe:
      'Judge it by whether there is a repayment plan and whether the numbers survive scrutiny — not by whether an ask happened.',
    domainHint: 'GATHERING_RESOURCES',
  },
  {
    id: 'ally-not-qualified',
    myth: "I'd just be in the way — this is for people who do this professionally.",
    truth:
      'The highest-leverage job in this entire campaign is hosting an event, and its qualifications are: a room, a date, and eight people who trust you. That is it.',
    reframe:
      'The thing you think is too small to offer is usually the thing that has been blocking everything for months.',
    domainHint: 'SKILLFUL_ORGANIZING',
  },
  {
    id: 'ally-his-thing',
    myth: "This is his thing. I support it from the sidelines.",
    truth:
      'A movement that depends on one person is not a movement, it is a job with a mission statement. The nonprofit, the board, the collective — all of it exists so this survives me.',
    reframe:
      'There are no sidelines here, only unassigned positions. Pick one, and it stops being mine alone.',
    domainHint: 'SKILLFUL_ORGANIZING',
  },
] as const

// ── Who he actually is ──────────────────────────────────────────────────────

export interface UnderstandingPanel {
  /** Mono kicker. */
  kicker: string
  heading: string
  body: string
}

/**
 * The "understand the person you want to help" beat — the step most allyship
 * training skips and then wonders why the help keeps missing.
 *
 * Biographical claims here are drawn from Wendell's own published sales letter
 * (studio work including the Ice Age films; allyship curriculum; alumni
 * engagement at a college). Nothing is invented. Still: read it before sending.
 */
export const UNDERSTANDING: readonly UnderstandingPanel[] = [
  {
    kicker: 'what I actually do',
    heading: "I teach people to ask for what they need — and I build the game that teaches it",
    body: `I spent years inside a studio — including the Ice Age films — where the job was making the place work for the artists in it. Which mostly meant helping people advocate for their own needs instead of waiting to be rescued. Then I built allyship curriculum and ran the rooms where people practice it. Then alumni engagement at a college, on a belief I've never been able to shake: people are moved by joy, not by guilt.

Mastering the Game of Allyship is all of that in one place. A book, a 120-card deck, and workshops. Not a lecture about being better — a practice you run.`,
  },
  {
    kicker: 'the part that is hard to say',
    heading: "The work is finished. The distribution is not.",
    body: `This is the honest shape of my problem, and it isn't a creative one.

The book is written. The deck exists — 120 cards, printed, sold today. The workshops run and people leave changed. Everything I make works.

What doesn't exist is the boring machinery between a finished thing and the people it's for: a vehicle, a print run, a hundred real relationships, an entity that can hold a grant, and twelve rooms with dates on them.

I am very good at the first part. I have been avoiding the second part for four years, and it has cost me more than admitting it will.`,
  },
  {
    kicker: 'what help looks like from in here',
    heading: "Specific beats generous",
    body: `"Let me know if you need anything" is kind and it has never once produced a result, because it puts the work of naming the need back on the person already underwater.

So I named them. Twenty of them, on the next screens. Each one says what it is, what it costs you, and what "done" means.

Take one. Take none. But take a real one rather than promising a vague one — I would rather have a clear no from you today than a soft yes I'm quietly counting on in March.`,
  },
] as const
