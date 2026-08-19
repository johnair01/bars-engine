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
import {
  WARM_CASE_UNITS,
  WARM_CHANNELS,
  copiesPerRun,
  warmPlan,
} from './warm-selling'
import { monthlyBookTargetCopies } from './victory-paths'
import {
  INPUTS,
  digitalEconomics,
  printEconomics,
  repaymentPlan,
  repaymentPlanDigital,
  usd,
} from './economics'

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
  /**
   * Set when this need is one SLICE of a larger ask that several people can split.
   *
   * Each slice is a real, separately-claimable `MilestoneNeed` row — which is what
   * lets two allies take three slices each without either being on the hook for
   * the whole thing, and lets the existing conditional-claim logic stay exactly as
   * it is. The funnel groups slices back into one card with a quantity stepper, so
   * the reader sees "the print run" and not ten near-identical rows.
   */
  share?: {
    /** Stable group key — the ask these slices add up to. */
    groupId: string
    /** 1-based position within the group. */
    index: number
    /** How many slices the whole ask divides into. */
    count: number
    /** What one slice buys, in plain words: "50 copies". */
    sliceLabel: string
  }
}

export interface Workstream {
  /** Stable key. Sub-campaign slug is `mobility-quest-${key}`. */
  key: 'car' | 'print-run' | 'dream-100' | 'book-brigade' | 'nonprofit' | 'book-tour'
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
const planDigital = repaymentPlanDigital()
const print = printEconomics()
const digital = digitalEconomics()

/** Digital sales that would pay for the entire paper run. */
const digitalCopiesForRun = Math.ceil(print.landedTotalCents / digital.marginCents)

/**
 * The warm channel at full strength, measured against the monthly book target the
 * victory paths use. Imported for prose so the brigade's headline claim and the
 * plan screen's arithmetic can never disagree.
 */
const warmFull = warmPlan(20, monthlyBookTargetCopies())

/** "1 workshop" / "5 workshops" — derived counts land in prose, so they agree. */
function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/**
 * Expand a divisible ask into `count` independently-claimable slices.
 *
 * Why slices rather than a "pledge any amount" field: a claim in this schema is a
 * row someone holds, and holding is what makes the board honest — the steward can
 * see that four of ten slices are taken and six are open. An amount typed into a
 * box is a promise with no row behind it. Slices keep partial help first-class
 * without inventing a second, weaker kind of commitment.
 */
function shareNeeds(spec: {
  groupId: string
  count: number
  superpower: SuperpowerKey
  orientation: Orientation
  unit: NeedUnit
  /** Value of ONE slice. */
  sliceValue: number
  bountyVibeulons: number
  cardId: string
  sliceLabel: string
  title: string
  detail: string
  needsHelp?: boolean
}): WorkstreamNeed[] {
  return Array.from({ length: spec.count }, (_, idx) => ({
    id: `${spec.groupId}-${String(idx + 1).padStart(2, '0')}`,
    superpower: spec.superpower,
    orientation: spec.orientation,
    unit: spec.unit,
    value: spec.sliceValue,
    bountyVibeulons: spec.bountyVibeulons,
    cardId: spec.cardId,
    title: spec.title,
    detail: spec.detail,
    needsHelp: spec.needsHelp,
    share: {
      groupId: spec.groupId,
      index: idx + 1,
      count: spec.count,
      sliceLabel: spec.sliceLabel,
    },
  }))
}

/** Copies bought by one slice of the print run. Ten slices = the whole run. */
const PRINT_SHARE_UNITS = 50

export const WORKSTREAMS: readonly Workstream[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    key: 'car',
    domain: 'GATHERING_RESOURCES',
    title: 'The Car',
    eyebrow: '01 · gathering resources',
    emergentProblem:
      "The resource that lets the work unfold isn't here. Everything downstream — the tour, the events, the boxes of books — assumes a vehicle that exists.",
    narrative: `Here's the part I'd rather not say plainly, so I'm going to say it plainly, and I'd rather you hear it from me than find it later.

I already raised money from my community for a car. I did not buy a car with it. I spent it on living expenses and on finishing the book — month by month, each decision defensible on its own, and the sum of them is that the money is gone and there is still no car. Nobody was deceived; the work it paid for is real and finished. But I made that call quietly instead of going back to the people who gave it and saying out loud what I was doing. That is the actual mistake, and it is the reason this entire page exists in writing instead of as a phone call.

So this ask comes with its history attached. If that history is a reason to say no, that is a legitimate reading and I am not going to argue you out of it.

I can't get the book to the people it's for. Not because the book isn't ready — it's ready, and 250 people have already paid for copies they're still waiting on. Because a book tour is a logistics problem wearing a literary costume, and the logistics start with being able to drive somewhere with two hundred books in the back.

The ask is ${usd(INPUTS.carLoanCents)}, as a loan.

Not a gift, not an investment, not "whatever you can spare." A loan, paid back out of the two things this work already produces: workshops and books. That's ${plural(planDigital.workshopsNeeded, 'workshop')} and ${plural(planDigital.copiesNeeded, 'digital copy', 'digital copies')} over ${INPUTS.repaymentMonths} months — about ${usd(planDigital.monthlyCents)} a month, or ${plural(planDigital.copiesPerMonth, 'copy', 'copies')} a month alongside the workshops.

Digital, because the digital edition has no print cost and no ceiling. On paper alone the same loan would take ${plural(plan.booksNeeded, 'copy', 'copies')} out of a run that only has ${plan.booksAvailable} left to sell after what I already owe. Those copy counts are also net of what it costs to find a reader — I am not assuming anyone shows up for free.

I wrote those numbers down before I asked you, because an ask without a repayment schedule isn't an ask. It's a hope with good manners.`,
    theAsk: `Lend ${usd(INPUTS.carLoanCents)} for the car. I pay it back at ${usd(planDigital.monthlyCents)}/month from workshop and digital book revenue, over ${INPUTS.repaymentMonths} months.`,
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
        detail: `A loan against the written schedule — ${usd(planDigital.monthlyCents)}/month for ${INPUTS.repaymentMonths} months, from workshop and digital book revenue. Repaid in full, not "when things pick up."`,
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
      'The book exists as a file, and 250 people have already paid for a copy they cannot hold. A file cannot be signed, handed across a table, or mailed to someone who has been waiting. The material form is the missing resource.',
    narrative: `Start with the part that is not a projection: **${print.obligationUnits} copies are already sold.** Real people paid real money and are still waiting for a book. That money came in and went straight back out — into living expenses and into finishing the manuscript. So those ${print.obligationUnits} copies are not inventory and they are not income. They are a debt I owe in cardboard.

The PDF is finally done. It was produced this year, not four years ago — what took the time was everything between a finished draft and a file a printer will accept.

So: a run of ${INPUTS.printRunUnits}. The first ${print.obligationUnits} discharge the debt. That leaves ${print.sellableUnits} copies that can actually earn.

Printing runs ${usd(print.printTotalCents)}. Shipping the mailed portion runs ${usd(print.shipTotalCents)}. Landed, ${usd(print.landedTotalCents)} — about ${usd(print.landedUnitCostCents)} a copy against a ${usd(INPUTS.bookRetailPriceCents)} cover.

${
      print.coversRunFromSellable
        ? `Covering the run takes ${print.breakEvenUnits} sold copies, and after the obligations there are ${print.sellableUnits} left to sell. So it fits — with ${print.sellableUnits - print.breakEvenUnits} copies of headroom. At a lower cover price it did not fit at all, which is most of why the price is what it is.`
        : `Here is the number I would rather not print, so I am printing it: covering the run takes ${print.breakEvenUnits} sold copies, and after the obligations there are only ${print.sellableUnits} left to sell. **Paper alone cannot pay for the paper.** There is no slack in it at all.`
    }

Alongside it there's the digital edition at ${usd(INPUTS.digitalPriceCents)} — no printing, no shipping, and no ceiling on how many exist. ${digitalCopiesForRun} digital sales would pay for the entire paper run on their own.

Paper actually earns slightly more per copy (${usd(INPUTS.bookRetailPriceCents - print.landedUnitCostCents)} against ${usd(digital.marginCents)}); what it cannot do is scale past ${print.sellableUnits}. So they do different jobs. Paper is the handshake — signed at a table, carried home from an event, and the ${print.obligationUnits} copies I already owe. Digital is the engine, because it is the only one of the two that can answer a good month.

Which moves the real question, and I want it stated plainly rather than buried: unlimited supply is not unlimited demand. I can make any number of copies. Whether anyone buys them is a different claim, and it is the one thing on this page nobody has proven yet.`,
    theAsk: `Fund or de-risk the ${INPUTS.printRunUnits}-copy run — ${usd(print.landedTotalCents)} landed, splittable into ${Math.ceil(INPUTS.printRunUnits / PRINT_SHARE_UNITS)} shares of ${PRINT_SHARE_UNITS} copies so nobody carries it alone. ${print.obligationUnits} copies are already owed to readers.`,
    milestone: {
      title: `${INPUTS.printRunUnits} copies, printed and moving`,
      targetValue: INPUTS.printRunUnits,
      unit: 'action',
    },
    needs: [
      // Divisible: ten shares of 50 copies. Nobody has to carry the whole run,
      // and the board shows exactly how many shares are still open.
      ...shareNeeds({
        groupId: 'aq-print-share',
        count: Math.ceil(INPUTS.printRunUnits / PRINT_SHARE_UNITS),
        superpower: 'strategist',
        orientation: 'external',
        unit: 'currency',
        // Exact, not rounded: ten shares must add up to the landed cost to the
        // cent. Rounding each share up is how an ask quietly inflates — the same
        // sin as collapsing the loan into the car's price.
        sliceValue: (print.landedUnitCostCents * PRINT_SHARE_UNITS) / 100,
        bountyVibeulons: 5,
        cardId: 'SHOW-GR-REGENT',
        sliceLabel: `${PRINT_SHARE_UNITS} copies`,
        title: `Underwrite ${PRINT_SHARE_UNITS} copies of the run`,
        detail: `One share is ${PRINT_SHARE_UNITS} copies at the landed cost of ${usd(print.landedUnitCostCents)} each. Take one share or take several — the run needs all ${Math.ceil(INPUTS.printRunUnits / PRINT_SHARE_UNITS)}, and no one person needs to be the one who covers it.`,
      }),
      {
        id: 'aq-print-owed',
        superpower: 'coach',
        orientation: 'external',
        unit: 'hours',
        value: 3,
        bountyVibeulons: 5,
        cardId: 'CLEAN-SO-DIPLOMAT',
        title: `Get the ${print.obligationUnits} owed copies out the door`,
        detail: `${print.obligationUnits} people paid and are still waiting. Build the list, confirm addresses, and run the mailing when the pallets land. This is the one job on this whole board with someone else's patience already spent on it.`,
        needsHelp: true,
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
    key: 'book-brigade',
    domain: 'RAISE_AWARENESS',
    title: 'The Book Brigade',
    eyebrow: '04 · raise awareness',
    emergentProblem:
      "A few hundred pockets of people who would want this have never heard of it, and no advertisement can reach them — the only bridge into someone's circle is someone they already trust.",
    narrative: `The ad math says a cold book sale costs about what the book earns. Half the advertisers in this category do worse than that. So the answer is not a bigger ad budget — it is that ads are the wrong instrument for a book like this, and I would rather say so than spend your money finding out.

Here is the instrument that does work, and it is not sophisticated. It's Girl Scout cookies.

A warm ask from someone you trust converts several times better than any advertisement — referred buyers convert roughly four times as well as strangers, and a warm referral gets a reply 40 to 60 percent of the time where cold outreach gets under seven. That gap is not a marketing trick. It is just what it means to be vouched for.

So: a case is ${WARM_CASE_UNITS} copies. Not "tell your friends" — ${WARM_CASE_UNITS} copies, to ${20} specific people you would text about anything else, over a month. ${warmFull.alliesForFullCoverage} people doing that covers the entire monthly book target with no acquisition cost at all.

What you're selling is the digital edition, and that is on purpose. You front nothing, store nothing and post nothing — you send a link and the book arrives instantly. No box in your hallway, no money out of your pocket, no shipment to chase. It costs the campaign about ${usd(warmFull.marginTradedPerCopyCents)} a copy in margin versus paper, and it is the best ${usd(warmFull.marginTradedPerCopyCents)} in this whole plan: paper would run the brigade dry after ${warmFull.physicalCapacityAllies} cases, and digital never runs out. The printed copies go where paper actually earns its keep — the ${print.obligationUnits} I already owe, and hand-selling at events.

Two things I will hold myself to here. You get a link that tracks what came from you, so this is a number on the board and not a favour disappearing into the dark. And I will tell you which of these actually works — a post sells about ${copiesPerRun(WARM_CHANNELS[0])} copies, and I am not going to pretend otherwise to make the ask feel lighter.`,
    theAsk: `Take a case: ${WARM_CASE_UNITS} digital copies to people who already trust you, tracked with your own link — nothing to front, nothing to ship. Or make one podcast introduction, worth about ${copiesPerRun(WARM_CHANNELS[3])} copies on its own.`,
    milestone: {
      title: 'The brigade, selling',
      targetValue: WARM_CASE_UNITS * 20,
      unit: 'action',
    },
    needs: [
      // Divisible: the whole point is that many people each take a small, finite
      // amount. Twenty cases is the brigade at full strength.
      ...shareNeeds({
        groupId: 'aq-brigade-case',
        count: 20,
        superpower: 'connector',
        orientation: 'external',
        unit: 'action',
        sliceValue: WARM_CASE_UNITS,
        bountyVibeulons: 5,
        cardId: 'SHOW-RA-DIPLOMAT',
        sliceLabel: `${WARM_CASE_UNITS} copies`,
        title: `Sell a case — ${WARM_CASE_UNITS} copies to your own people`,
        detail: `Ask ${20} specific people, one at a time, the way you'd ask them anything else. Not a broadcast. It's the digital edition, so you send your tracking link and the book arrives instantly — you never front money, hold stock or post anything. Done means ${WARM_CASE_UNITS} copies bought through your link.`,
      }),
      {
        id: 'aq-brigade-podcast',
        superpower: 'connector',
        orientation: 'external',
        unit: 'action',
        value: 1,
        bountyVibeulons: 6,
        cardId: 'WAKE-RA-DIPLOMAT',
        title: 'Put me on one podcast you actually listen to',
        detail: `One warm introduction to a host you know — I take it from there. A show doing 3,000 downloads converts around 1%, so a single episode is worth roughly ${copiesPerRun(WARM_CHANNELS[3])} copies. Done means the episode airs with the book in the show notes.`,
        needsHelp: true,
      },
      {
        id: 'aq-brigade-org',
        superpower: 'strategist',
        orientation: 'external',
        unit: 'action',
        value: 1,
        bountyVibeulons: 5,
        cardId: 'SHOW-RA-REGENT',
        title: 'Get one group to buy a case together',
        detail:
          'A book club, an ERG, a team, a congregation, a class. One person saying yes on behalf of ten is the cheapest ten copies in the whole campaign. Done means a bulk order placed.',
      },
      {
        // The floor of the whole campaign, and it was missing. Every other
        // Brigade ask is about moving OTHER people — sell a case, brief a group,
        // get me on a podcast. Someone whose honest answer is "I'll buy a copy
        // and read it" had nothing to take, which quietly says the smallest real
        // contribution isn't a contribution. It is the one everybody can do.
        //
        // Typed to the disruptor, who had nothing in this workstream at all: the
        // move here is to stop deliberating about how to help and just do the
        // obvious thing.
        id: 'aq-brigade-buy',
        superpower: 'disruptor',
        orientation: 'external',
        unit: 'currency',
        value: INPUTS.digitalPriceCents / 100,
        bountyVibeulons: 3,
        cardId: 'SHOW-RA-CHALLENGER',
        title: 'Buy the book — one copy, for you',
        detail: `${usd(INPUTS.digitalPriceCents)} for the digital edition. Not a donation and not a favour: it is the thing being sold, you get the thing, and it is the single number every other plan on this page is costed on. If you only ever do one item from this whole campaign, this is a complete answer.`,
      },
      {
        id: 'aq-brigade-post',
        superpower: 'storyteller',
        orientation: 'external',
        unit: 'action',
        value: 1,
        bountyVibeulons: 3,
        cardId: 'SHOW-RA-SAGE',
        title: 'Post about it in your own words',
        detail: `One post saying why this matters to YOU — your reason, not my copy. Honest expectation: about ${copiesPerRun(WARM_CHANNELS[0])} copies. It is the weakest thing on this list and it is still worth doing, because it is how the people who'd never take a direct ask find out this exists.`,
      },
      {
        id: 'aq-brigade-report',
        superpower: 'coach',
        orientation: 'external',
        unit: 'hours',
        value: 1,
        bountyVibeulons: 4,
        cardId: 'CLEAN-RA-REGENT',
        title: 'Report your real numbers, including the zeroes',
        detail:
          "Tell me what actually happened — how many you asked, how many said yes, what made them hesitate. A month where you sold none is the most useful data on this board, and it is the one nobody ever volunteers.",
      },
      {
        id: 'aq-brigade-avoid',
        superpower: 'alchemist',
        orientation: 'internal',
        unit: 'action',
        value: 1,
        bountyVibeulons: 5,
        cardId: 'OPEN-RA-SHAMAN',
        title: "Notice who you're not asking",
        detail:
          "Make the list of twenty and watch who you quietly leave off it. The names you skip are carrying something — an old debt, a story about what they'd think of you. That flinch is the actual subject of the book, showing up in your own hands.",
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

/**
 * Where a given superpower actually lands, per domain.
 *
 * Exists so the funnel can SHOW the reader why the quiz mattered instead of
 * asserting that it did. A quiz whose result never visibly changes anything is
 * a personality test, and this one is supposed to be a router.
 */
export interface SuperpowerFootprint {
  domain: AllyshipDomainKey
  /** Needs in this domain typed to their superpower. */
  matched: number
  /** All needs in this domain. */
  total: number
  /** The single best-matched need, for naming a concrete example. */
  exemplar?: WorkstreamNeed
}

export function superpowerFootprint(
  superpower: SuperpowerKey | string | null,
  orientation: Orientation | null = null,
): SuperpowerFootprint[] {
  const domains = [...new Set(WORKSTREAMS.map((w) => w.domain))]
  return domains.map((domain) => {
    // Count ASKS, not rows. Ten shares of the print run are one job a reader can
    // take, and reporting them as ten would inflate every count on the page.
    const pool = groupNeedEntries(
      WORKSTREAMS.filter((w) => w.domain === domain).flatMap((w) => w.needs),
    ).map((e) => e.need)
    const matched = pool.filter((n) => superpower && n.superpower === superpower)
    // Prefer a match that also fits their inner/outer orientation.
    const exemplar =
      matched.find((n) => orientation && n.orientation === orientation) ?? matched[0] ?? pool[0]
    return { domain, matched: matched.length, total: pool.length, exemplar }
  })
}

/**
 * Collapse slice needs back into one presentable ask.
 *
 * The catalogue stores ten claimable rows; the reader should see one card with a
 * quantity. Non-divisible needs pass through untouched, and ordering follows the
 * incoming (already superpower-sorted) list so match ranking survives grouping.
 */
export type NeedEntry =
  | { kind: 'single'; key: string; need: WorkstreamNeed }
  | {
      kind: 'group'
      key: string
      /** Representative need — title, detail, superpower, unit all come from it. */
      need: WorkstreamNeed
      /** Every slice in the group, in catalogue order. */
      slices: WorkstreamNeed[]
      sliceLabel: string
      sliceValue: number
    }

export function groupNeedEntries(needs: readonly WorkstreamNeed[]): NeedEntry[] {
  const out: NeedEntry[] = []
  const seenGroups = new Set<string>()
  for (const need of needs) {
    if (!need.share) {
      out.push({ kind: 'single', key: need.id, need })
      continue
    }
    const { groupId } = need.share
    if (seenGroups.has(groupId)) continue
    seenGroups.add(groupId)
    const slices = ALL_NEEDS.filter((n) => n.share?.groupId === groupId).sort(
      (a, b) => (a.share?.index ?? 0) - (b.share?.index ?? 0),
    )
    out.push({
      kind: 'group',
      key: groupId,
      need,
      slices,
      sliceLabel: need.share.sliceLabel,
      sliceValue: need.value,
    })
  }
  return out
}

/** Total vibeulon energy on the board — the collective's capacity, not a price. */
export const TOTAL_BOUNTY_VIBEULONS = ALL_NEEDS.reduce((sum, n) => sum + n.bountyVibeulons, 0)
