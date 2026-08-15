/**
 * Ally Campaign — the five workstreams, as sub-campaigns.
 *
 * The Mobility Quest is the parent campaign. Each workstream below is a real
 * child `Campaign` (`parentCampaignId`), keyed by the allyship domain whose
 * *emergent problem* it actually is — per `.specify/memory/allyship-domain-definitions.md`,
 * the domain is chosen by what's missing, not by what the work resembles.
 *
 *   GATHERING_RESOURCES  the thing that lets life unfold isn't here yet
 *   SKILLFUL_ORGANIZING  no system exists; the problem is the lack of one
 *   RAISE_AWARENESS      people can't see what's already available
 *   DIRECT_ACTION        the action needs doing and nobody's doing it
 *
 * Each workstream decomposes into `MilestoneNeed`s — scoped, superpower-typed,
 * unit-typed asks. A need is simultaneously a quest (the unit of the helper's own
 * development) and a contribution (the unit of help the campaign receives). That
 * double-reading is the whole point: nobody is "just donating."
 *
 * Six Faces ruling (see mobility-quest spec): units are never blended and no
 * action is worth more than another. `bountyVibeulons` is the *energy* a need
 * releases when completed — it is not a price, and internal-orientation work
 * carries the same bounty range as external so that money never dwarfs inner work.
 *
 * This file is CONTENT. Edit the copy freely; keep `id` values stable — they are
 * persisted on leads and needs.
 */

import type { AllyshipDomainKey } from '@/lib/allyship-domains'
import { INPUTS, printEconomics, repaymentPlan, usd } from './economics'

/** Canonical seven. Mirrors `@/lib/superpowers/types`. */
export type SuperpowerKey =
  | 'connector'
  | 'storyteller'
  | 'strategist'
  | 'disruptor'
  | 'alchemist'
  | 'escape_artist'
  | 'coach'

export type Orientation = 'internal' | 'external'
export type NeedUnit = 'action' | 'currency' | 'hours'

export interface WorkstreamNeed {
  /** Stable id — persisted as `MilestoneNeed.id`. Never rename casually. */
  id: string
  superpower: SuperpowerKey
  orientation: Orientation
  unit: NeedUnit
  /** Dollars for `currency`, hours for `hours`, count for `action`. */
  value: number
  /** Energy released on completion. Same range inner and outer, by ruling. */
  bountyVibeulons: number
  /** Base allyship card this need translates. `{MOVE}-{GR|RA|DA|SO}-{FACE}`. */
  cardId: string
  /** The ask, as a person would say it out loud. */
  title: string
  /** What doing it actually looks like — no ambiguity about "done". */
  detail: string
  /** Flagged on the steward dashboard as blocked / needing a second pair of hands. */
  needsHelp?: boolean
}

export interface Workstream {
  /** Stable key. Sub-campaign slug is `mobility-quest-${key}`. */
  key: 'car' | 'print-run' | 'dream-100' | 'nonprofit' | 'book-tour'
  domain: AllyshipDomainKey
  title: string
  /** Small mono eyebrow. */
  eyebrow: string
  /** Why this domain — the emergent problem, in the domain's own terms. */
  emergentProblem: string
  /** The story beat, in Wendell's voice, addressed to the reader. */
  narrative: string
  /** The plain ask. No hedging. */
  theAsk: string
  /** Milestone target + unit for the progress bar. */
  milestone: { title: string; targetValue: number; unit: NeedUnit }
  needs: WorkstreamNeed[]
}

const plan = repaymentPlan()
const print = printEconomics()

/** "1 workshop" / "5 workshops" — derived counts land in prose, so they agree. */
function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

export const WORKSTREAMS: readonly Workstream[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    key: 'car',
    domain: 'GATHERING_RESOURCES',
    title: 'The Car',
    eyebrow: '01 · gathering resources',
    emergentProblem:
      "The resource that lets the work unfold isn't here. Everything downstream — the tour, the events, the boxes of books — assumes a vehicle that exists.",
    narrative: `Here's the part I'd rather not say plainly, so I'm going to say it plainly.

I can't get the book to the people it's for. Not because the book isn't ready — it's ready. Because a book tour is a logistics problem wearing a literary costume, and the logistics start with being able to drive somewhere with two hundred books in the back.

The ask is ${usd(INPUTS.carLoanCents)}, as a loan.

Not a gift, not an investment, not "whatever you can spare." A loan, paid back out of the two things this work already produces: workshops and books. That's ${plural(plan.workshopsNeeded, 'workshop')} and ${plural(plan.booksNeeded, 'copy', 'copies')} over ${INPUTS.repaymentMonths} months — about ${usd(plan.monthlyCents)} a month.

I wrote those numbers down before I asked you, because an ask without a repayment schedule isn't an ask. It's a hope with good manners.`,
    theAsk: `Lend ${usd(INPUTS.carLoanCents)} for the car. I pay it back at ${usd(plan.monthlyCents)}/month from workshop and book revenue, over ${INPUTS.repaymentMonths} months.`,
    milestone: { title: 'The car, funded', targetValue: INPUTS.carLoanCents / 100, unit: 'currency' },
    needs: [
      {
        id: 'aq-car-underwrite',
        superpower: 'strategist',
        orientation: 'external',
        unit: 'currency',
        value: INPUTS.carLoanCents / 100,
        bountyVibeulons: 8,
        cardId: 'SHOW-GR-ARCHITECT',
        title: `Lend the ${usd(INPUTS.carLoanCents)} for the car`,
        detail: `A loan against the written schedule — ${usd(plan.monthlyCents)}/month for ${INPUTS.repaymentMonths} months, from workshop and book revenue. Repaid in full, not "when things pick up."`,
      },
      {
        id: 'aq-car-terms',
        superpower: 'strategist',
        orientation: 'external',
        unit: 'hours',
        value: 2,
        bountyVibeulons: 5,
        cardId: 'CLEAN-GR-REGENT',
        title: 'Pressure-test the repayment terms',
        detail:
          "Read the repayment math like you don't trust it. Find the month where it breaks. Tell me what you found — I'd rather hear it from you than discover it in month nine.",
      },
      {
        id: 'aq-car-shop',
        superpower: 'connector',
        orientation: 'external',
        unit: 'hours',
        value: 3,
        bountyVibeulons: 4,
        cardId: 'WAKE-GR-DIPLOMAT',
        title: 'Find the actual car',
        detail:
          'Three real listings that fit: reliable, cargo room for book boxes, honest mileage. Someone who knows cars looking with real eyes beats me guessing on a listings site at midnight.',
      },
      {
        id: 'aq-car-ask',
        superpower: 'alchemist',
        orientation: 'internal',
        unit: 'action',
        value: 1,
        bountyVibeulons: 5,
        cardId: 'OPEN-GR-SHAMAN',
        title: 'Notice what the ask stirs up',
        detail:
          "Before you answer: what came up when you read it? Obligation? Relief? An old argument? Name it honestly — to yourself, or to me. An unspoken 'yes' with a knot in it costs us both more later than a clean 'no' does now.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    key: 'print-run',
    domain: 'GATHERING_RESOURCES',
    title: `${INPUTS.printRunUnits} Copies`,
    eyebrow: '02 · gathering resources',
    emergentProblem:
      'The book exists as a file. A file cannot be signed, handed across a table, or carried home from a conference. The material form is the missing resource.',
    narrative: `A run of ${INPUTS.printRunUnits}. ${INPUTS.unitsHeldForEvents} of them never touch a shipping label — those ride in the car to conferences and events and get sold hand to hand, which is both the best margin and the only way this book actually sells. The other ${print.unitsForFulfillment} get mailed.

Printing runs ${usd(print.printTotalCents)}. Shipping the mailed portion runs ${usd(print.shipTotalCents)}. Landed, that's ${usd(print.landedTotalCents)} — about ${usd(print.landedUnitCostCents)} a copy against a ${usd(INPUTS.bookRetailPriceCents)} cover.

Which means ${print.breakEvenUnits} copies pays for the whole run. Not ${INPUTS.printRunUnits}. ${print.breakEvenUnits}. The rest is what pays for the car.

I've been carrying this book as a PDF for four years. A PDF has never once been signed at a table.`,
    theAsk: `Fund or de-risk the ${INPUTS.printRunUnits}-copy run — ${usd(print.landedTotalCents)} landed. ${print.breakEvenUnits} copies makes it whole.`,
    milestone: {
      title: `${INPUTS.printRunUnits} copies, printed and moving`,
      targetValue: INPUTS.printRunUnits,
      unit: 'action',
    },
    needs: [
      {
        id: 'aq-print-fund',
        superpower: 'strategist',
        orientation: 'external',
        unit: 'currency',
        value: Math.round(print.landedTotalCents / 100),
        bountyVibeulons: 8,
        cardId: 'SHOW-GR-REGENT',
        title: 'Fund the print run',
        detail: `Cover the ${usd(print.landedTotalCents)} landed cost of ${INPUTS.printRunUnits} copies. Recouped at ${print.breakEvenUnits} copies sold.`,
      },
      {
        id: 'aq-print-quotes',
        superpower: 'strategist',
        orientation: 'external',
        unit: 'hours',
        value: 3,
        bountyVibeulons: 4,
        cardId: 'CLEAN-GR-ARCHITECT',
        title: 'Get three real printer quotes',
        detail: `Three printers, same spec, written quotes at ${INPUTS.printRunUnits} units. My placeholder is ${usd(INPUTS.printUnitCostCents)}/unit and I do not trust it. Replace it with a real number.`,
        needsHelp: true,
      },
      {
        id: 'aq-print-storage',
        superpower: 'coach',
        orientation: 'external',
        unit: 'action',
        value: 1,
        bountyVibeulons: 3,
        cardId: 'SHOW-SO-REGENT',
        title: 'Offer somewhere to put 500 books',
        detail:
          'A dry garage, a spare room, a corner of a basement. Books arrive on pallets and pallets need somewhere to live between events.',
      },
      {
        id: 'aq-print-fulfil',
        superpower: 'escape_artist',
        orientation: 'external',
        unit: 'hours',
        value: 4,
        bountyVibeulons: 4,
        cardId: 'CLEAN-SO-ARCHITECT',
        title: 'Kill the fulfillment busywork',
        detail: `Find the least stupid way to mail ${print.unitsForFulfillment} books — labels, postage, packaging — so I'm not hand-addressing envelopes at 1am instead of writing.`,
      },
      {
        id: 'aq-print-scarcity',
        superpower: 'alchemist',
        orientation: 'internal',
        unit: 'action',
        value: 1,
        bountyVibeulons: 5,
        cardId: 'WAKE-GR-SHAMAN',
        title: 'Name what feels scarce that isn’t',
        detail:
          "Look at the numbers above and notice where your gut says 'that's too much' even after the math says otherwise. That gap is the myth doing its work — on you, and on me.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    key: 'dream-100',
    domain: 'RAISE_AWARENESS',
    title: 'The Dream 100',
    eyebrow: '03 · raise awareness',
    emergentProblem:
      "The book, the deck, the workshops, the coaching — all of it already exists and is buyable today. The problem is not supply. It's that the hundred people who most need to know are not aware any of it is here.",
    narrative: `The Dream 100 is not a mailing list. It's one hundred named human beings — DEI leads, conference programmers, ERG chairs, podcast hosts, professors who assign books — who each already have the audience I'm trying to reach. A hundred real relationships beats a hundred thousand impressions, and it isn't close.

Paid ads sit underneath that, not on top of it. ${usd(INPUTS.adMonthlyBudgetCents)} a month for three months, and the only job of that money is to find out which sentence makes a stranger stop. Once I know the sentence, the Dream 100 outreach gets to use it.

Ads are for learning. Relationships are for selling. Reversing those two is how people set money on fire and call it marketing.`,
    theAsk: `Help name and reach the ${INPUTS.dream100Target}. Or fund the ${usd(INPUTS.adMonthlyBudgetCents)}/month, 3-month ad test that finds the sentence.`,
    milestone: {
      title: `The Dream ${INPUTS.dream100Target}, named and warm`,
      targetValue: INPUTS.dream100Target,
      unit: 'action',
    },
    needs: [
      {
        id: 'aq-d100-names',
        superpower: 'connector',
        orientation: 'external',
        unit: 'action',
        value: 5,
        bountyVibeulons: 4,
        cardId: 'WAKE-RA-DIPLOMAT',
        title: 'Add five names to the Dream 100',
        detail:
          'Five specific people or organizations with an audience that needs this — name, where to find them, and why them. Not categories. Names.',
      },
      {
        id: 'aq-d100-intro',
        superpower: 'connector',
        orientation: 'external',
        unit: 'action',
        value: 1,
        bountyVibeulons: 6,
        cardId: 'SHOW-RA-DIPLOMAT',
        title: 'Make one warm introduction',
        detail:
          "An actual email that puts me and one of the hundred in the same thread. One real intro outperforms fifty cold sends, and you already know that's true.",
      },
      {
        id: 'aq-d100-ads',
        superpower: 'strategist',
        orientation: 'external',
        unit: 'currency',
        value: Math.round((INPUTS.adMonthlyBudgetCents * 3) / 100),
        bountyVibeulons: 7,
        cardId: 'GROW-RA-ARCHITECT',
        title: 'Fund the three-month ad test',
        detail: `${usd(INPUTS.adMonthlyBudgetCents)}/month for three months. Deliverable is not sales — it's a written answer to "which sentence makes a stranger stop."`,
      },
      {
        id: 'aq-d100-story',
        superpower: 'storyteller',
        orientation: 'external',
        unit: 'action',
        value: 1,
        bountyVibeulons: 5,
        cardId: 'SHOW-RA-CHALLENGER',
        title: 'Tell people why you said yes',
        detail:
          "Post, email, or say out loud why you're backing this — in your words, not mine. People who know you will believe you about me in a way they will never believe me about me.",
      },
      {
        id: 'aq-d100-mystory',
        superpower: 'storyteller',
        orientation: 'internal',
        unit: 'action',
        value: 1,
        bountyVibeulons: 4,
        cardId: 'WAKE-RA-SHAMAN',
        title: 'Check the story you carry about my work',
        detail:
          "What have you been telling yourself about what I do all day? Write it down. If it's wrong, I'd rather fix the story than keep performing against it.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    key: 'nonprofit',
    domain: 'SKILLFUL_ORGANIZING',
    title: 'The Nonprofit',
    eyebrow: '04 · skillful organizing',
    emergentProblem:
      'There is no structure. The curriculum, the deck, the workshops all exist — but there is no vessel that can hold a grant, take a donation, outlive me, or let anyone else own a piece of this.',
    narrative: `Mastering Allyship should not depend on whether I'm having a good year.

Right now it does. Every workshop, every sale, every relationship routes through one person, and that's not humility talking — it's a structural single point of failure. A nonprofit is the fix. It can hold a grant. It can take a donation and give a receipt. It can have a board that tells me no. It can keep going if I stop.

Filing and first-year compliance runs about ${usd(INPUTS.nonprofitFilingCents)}. That's the cheapest part. The expensive part is the three people willing to sit on a board and take it seriously.

This is the least romantic workstream and probably the most important one. Nobody's inner life was ever changed by a filing. But nothing outlasts its founder without one.`,
    theAsk: `Help stand up the entity — ${usd(INPUTS.nonprofitFilingCents)} to file, plus three people willing to be a real board.`,
    milestone: { title: 'The nonprofit, standing on its own', targetValue: 6, unit: 'action' },
    needs: [
      {
        id: 'aq-np-file',
        superpower: 'strategist',
        orientation: 'external',
        unit: 'currency',
        value: Math.round(INPUTS.nonprofitFilingCents / 100),
        bountyVibeulons: 6,
        cardId: 'SHOW-SO-ARCHITECT',
        title: 'Cover the filing',
        detail: `Incorporation, 501(c)(3) application, registered agent, first-year compliance — about ${usd(INPUTS.nonprofitFilingCents)} all in.`,
      },
      {
        id: 'aq-np-board',
        superpower: 'coach',
        orientation: 'external',
        unit: 'action',
        value: 1,
        bountyVibeulons: 7,
        cardId: 'GROW-SO-REGENT',
        title: 'Sit on the board — or find someone who should',
        detail:
          "A real seat with real fiduciary duty, not a name on letterhead. If that's not you, name the person it should be and tell me why.",
        needsHelp: true,
      },
      {
        id: 'aq-np-legal',
        superpower: 'strategist',
        orientation: 'external',
        unit: 'hours',
        value: 2,
        bountyVibeulons: 5,
        cardId: 'CLEAN-SO-SAGE',
        title: 'Get a lawyer’s eyes on the structure',
        detail:
          'Two hours with someone who has actually filed one of these. What am I getting wrong before I get it wrong on a government form?',
      },
      {
        id: 'aq-np-single-point',
        superpower: 'escape_artist',
        orientation: 'internal',
        unit: 'action',
        value: 1,
        bountyVibeulons: 5,
        cardId: 'CLEAN-SO-CHALLENGER',
        title: 'Name what I should stop being the only one doing',
        detail:
          "Look at how this runs and point at the thing only I can currently do. That's the bottleneck, and I'm usually too close to it to see it.",
      },
      {
        id: 'aq-np-disrupt',
        superpower: 'disruptor',
        orientation: 'external',
        unit: 'action',
        value: 1,
        bountyVibeulons: 5,
        cardId: 'WAKE-SO-CHALLENGER',
        title: 'Say the thing nobody’s saying about this plan',
        detail:
          "You've read all five workstreams. Which one is a bad idea? I need one person willing to be unpopular in a family thread.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    key: 'book-tour',
    domain: 'DIRECT_ACTION',
    title: 'The Book Tour',
    eyebrow: '05 · direct action',
    emergentProblem:
      'Nothing here is unknown or unfunded at this point — the events simply are not happening. Rooms need booking, dates need setting, and someone has to actually do it.',
    narrative: `${INPUTS.tourEventTarget} events. About ${INPUTS.unitsPerEvent} copies move at a good one, which is how the ${INPUTS.unitsHeldForEvents} event copies find their homes and how the car gets paid back.

But I want to be honest about what these are, because "book tour" makes it sound like I read aloud and sign things. That's not the event. The event is a room where people run the actual practice — the deck comes out, people find their superpower, and they leave having done something rather than having heard something. The book is what they take home to keep doing it.

That's harder to book and much better to attend.

Hosting is the highest-leverage thing on this entire page and the one people most consistently assume they're not qualified for. You need a room, a date, and eight people who trust you. That's the whole qualification.`,
    theAsk: `Host one. Or fill a room someone else is hosting. ${INPUTS.tourEventTarget} events is the target.`,
    milestone: { title: `${INPUTS.tourEventTarget} events, booked and run`, targetValue: INPUTS.tourEventTarget, unit: 'action' },
    needs: [
      {
        id: 'aq-tour-host',
        superpower: 'connector',
        orientation: 'external',
        unit: 'action',
        value: 1,
        bountyVibeulons: 8,
        cardId: 'SHOW-DA-DIPLOMAT',
        title: 'Host an event',
        detail: `A room, a date, and eight people who trust you. I bring the deck, the practice, and the books. Expect around ${INPUTS.unitsPerEvent} copies to move.`,
      },
      {
        id: 'aq-tour-fill',
        superpower: 'storyteller',
        orientation: 'external',
        unit: 'action',
        value: 8,
        bountyVibeulons: 5,
        cardId: 'SHOW-RA-REGENT',
        title: 'Fill someone else’s room',
        detail:
          "Get eight people to an event you're not hosting. Every host's real fear is an empty room, and this is how you make that fear unfounded.",
      },
      {
        id: 'aq-tour-venue',
        superpower: 'connector',
        orientation: 'external',
        unit: 'hours',
        value: 2,
        bountyVibeulons: 4,
        cardId: 'WAKE-DA-ARCHITECT',
        title: 'Find venues that cost nothing',
        detail:
          'Libraries, community rooms, bookstores, a friendly conference room after hours. Free rooms are the difference between twelve events and four.',
      },
      {
        id: 'aq-tour-run',
        superpower: 'coach',
        orientation: 'external',
        unit: 'hours',
        value: 3,
        bountyVibeulons: 6,
        cardId: 'GROW-DA-DIPLOMAT',
        title: 'Run the room with me',
        detail:
          "Co-facilitate. Twelve people doing real practice is more than one person can hold well, and holding it badly is worse than not doing it.",
      },
      {
        id: 'aq-tour-show',
        superpower: 'disruptor',
        orientation: 'internal',
        unit: 'action',
        value: 1,
        bountyVibeulons: 4,
        cardId: 'SHOW-DA-CHALLENGER',
        title: 'Come to one. Actually come.',
        detail:
          "Pick a date and put it in your calendar now, before there is a date. The people closest to this work are the most likely to assume they already know what's in it.",
      },
    ],
  },
]

// ── Lookups ─────────────────────────────────────────────────────────────────

export const ALL_NEEDS: readonly WorkstreamNeed[] = WORKSTREAMS.flatMap((w) => w.needs)

/** Sub-campaign slug for a workstream — the child `Campaign.slug`. */
export function subcampaignSlug(key: Workstream['key']): string {
  return `mobility-quest-${key}`
}

export function workstreamsForDomain(domain: AllyshipDomainKey): Workstream[] {
  return WORKSTREAMS.filter((w) => w.domain === domain)
}

export function findWorkstream(key: string): Workstream | undefined {
  return WORKSTREAMS.find((w) => w.key === key)
}

export function findNeed(id: string): WorkstreamNeed | undefined {
  return ALL_NEEDS.find((n) => n.id === id)
}

export function workstreamForNeed(id: string): Workstream | undefined {
  return WORKSTREAMS.find((w) => w.needs.some((n) => n.id === id))
}

/**
 * Needs matched to a revealed superpower + orientation, best-first.
 * Never returns an empty list: an exact match is ideal, but a person who shows up
 * should always be handed something real to do. Falls back superpower-only, then
 * to every open need — honest breadth beats a dead end.
 */
export function needsForSuperpower(
  superpower: SuperpowerKey | string | null,
  orientation: Orientation | null,
  opts: { domain?: AllyshipDomainKey | null; limit?: number } = {},
): WorkstreamNeed[] {
  const pool = opts.domain
    ? WORKSTREAMS.filter((w) => w.domain === opts.domain).flatMap((w) => w.needs)
    : [...ALL_NEEDS]

  const scored = pool
    .map((need) => {
      let score = 0
      if (superpower && need.superpower === superpower) score += 2
      if (orientation && need.orientation === orientation) score += 1
      return { need, score }
    })
    .sort((a, b) => b.score - a.score)

  const ordered = scored.map((s) => s.need)
  return typeof opts.limit === 'number' ? ordered.slice(0, opts.limit) : ordered
}

/** Total vibeulon energy on the board — the collective's capacity, not a price. */
export const TOTAL_BOUNTY_VIBEULONS = ALL_NEEDS.reduce((sum, n) => sum + n.bountyVibeulons, 0)
