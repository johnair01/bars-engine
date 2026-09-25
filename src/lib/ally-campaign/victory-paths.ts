/**
 * Ally Campaign — paths to victory.
 *
 * The numbers layer for the analyst reader: someone who trusts a plan exactly as
 * far as its arithmetic checks out, wants to see the failure mode written down
 * before the success mode, and would rather fund a schedule than a dream.
 *
 * Everything here derives from `economics.INPUTS` — no figure is authored twice.
 * The one new input is the monthly income target and the bridge-income estimate;
 * both live here so `economics.ts` stays the single home of campaign costs and
 * this file stays the single home of the income plan.
 *
 * ⚠️ EDIT ME BEFORE SENDING. `NINETY_DAY` and each path's support lists are a
 * draft plan put in Wendell's mouth by a machine. Read every line before the
 * link goes out — these are commitments, not copy.
 */

import {
  INPUTS,
  UNCONFIRMED,
  adEconomics,
  digitalEconomics,
  printEconomics,
  workshopEconomics,
  usd,
  type CampaignInputs,
} from './economics'

// ─────────────────────────────────────────────────────────────────────────────
// INPUTS — edit these. Everything below is derived.
// ─────────────────────────────────────────────────────────────────────────────

/** The figure the whole plan aims at: monthly income that makes this a living. */
export const MONTHLY_TARGET_CENTS = 6_000_00

/**
 * TODO(wendell): realistic monthly take-home from part-time work while building.
 * This is the "get a job" path taken seriously, not a straw man — be honest here.
 */
export const BRIDGE_INCOME_CENTS = 3_000_00

/**
 * TODO(wendell): the monthly floor — rent, food, insurance, phone. NOT a salary
 * and not a budget for the business. This is the number that has to be met for
 * the lights to stay on during a full-time job search, and it is the only figure
 * the Career Pivot path actually asks anyone to cover.
 */
export const MONTHLY_BILLS_FLOOR_CENTS = 1_800_00

/**
 * How long a targeted search runs before the path is declared failed and folds
 * into the Steady Build. Bounded on purpose: an open-ended "support me while I
 * look" is exactly the dependency this campaign is built to avoid.
 */
export const JOB_SEARCH_MONTHS = 3

/** Inputs above that are still placeholders — surfaces flag them "estimate". */
export const PATH_UNCONFIRMED = new Set<string>(['bridgeIncomeCents', 'monthlyBillsFloorCents'])

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED — do not hand-edit; change the inputs above or economics.INPUTS.
// ─────────────────────────────────────────────────────────────────────────────

export interface VictoryPath {
  key: string
  /** Plain-English name. */
  title: string
  /** The team-comp read, for a reader who thinks in win conditions. */
  comp: string
  /** Why a sane person would pick this path. */
  thesis: string
  /** Fixed choices that define the path. */
  workshopsPerMonth: number
  bridgeIncomeCents: number
  /** Derived: copies/month that close the remaining gap at the blended margin. */
  booksPerMonth: number
  /** Derived: what the path actually yields per month (>= target by construction). */
  monthlyCents: number
  /** What has to exist on day 1 for this path to be runnable at all. */
  needsUpFront: string[]
  /** The specific, bounded things an ally on this path would be doing. */
  supportLooksLike: string[]
  /** The tripwire — the observable fact that says this path is NOT working. */
  failureReads: string
  /**
   * Support needed DURING the path, before it pays for itself — bounded in months
   * and stated as a total, never as an open tab. A path that needs runway and
   * doesn't say so is asking for dependency without using the word.
   */
  runway?: { months: number; monthlyCents: number; totalCents: number; what: string; endsWhen: string }
  /**
   * Months until the current print run would be exhausted if this path's copies
   * were all paper. Infinity when the path sells no books.
   */
  runMonthsAtPace: number
  /**
   * True only when a path is bound to PRINT supply. Digital has no ceiling, so
   * the reprint question — which used to be this plan's loudest warning — does
   * not arise for it. That is a genuine improvement and it is why the field
   * survives rather than being deleted: it still fires if a path goes paper-only.
   */
  needsReprint: boolean
  /**
   * What this path is actually betting on now that supply is solved. Every path
   * carries it, because "unlimited copies" is the exact phrase that makes people
   * stop asking whether anyone wants one.
   */
  demandRisk: string
  /** True while any input feeding this path is still a placeholder. */
  estimate: boolean
}

/** Blended per-copy PRINT margin — the honest one, same basis as `repaymentPlan`. */
export function blendedMarginCents(i: CampaignInputs = INPUTS): number {
  return i.bookRetailPriceCents - printEconomics(i).landedUnitCostCents
}

/**
 * Copies a month required to hit the income target on books alone.
 *
 * Exported so the warm channel's "N allies covers the target" claim derives from
 * the same arithmetic as the paths, rather than being restated beside it.
 */
export function monthlyBookTargetCopies(i: CampaignInputs = INPUTS): number {
  const margin = salesMarginCents(i)
  return margin > 0 ? Math.ceil(MONTHLY_TARGET_CENTS / margin) : 0
}

/**
 * The per-sale figure every path's book count is measured in.
 *
 * Digital, because it is the only book engine with no supply ceiling — a path
 * needing 200 copies a month is fantasy on paper (the run holds 250 sellable in
 * total) and merely hard in digital.
 *
 * And NET OF ACQUISITION, because readers are not free. A share of them arrive
 * through paid ads, each carrying its own cost, so the blended contribution — not
 * the gross margin — is what a copy is actually worth to the plan. Measuring in
 * gross margin was a real omission: it made every path's copy count smaller than
 * reality by assuming an audience that shows up on its own.
 */
export function salesMarginCents(i: CampaignInputs = INPUTS): number {
  return adEconomics(i).blendedContributionPerSaleCents
}

function buildPath(
  base: Omit<
    VictoryPath,
    'booksPerMonth' | 'monthlyCents' | 'runMonthsAtPace' | 'needsReprint' | 'estimate'
  >,
  i: CampaignInputs = INPUTS,
): VictoryPath {
  // Digital: the only book engine that can supply what these paths need.
  const margin = salesMarginCents(i)
  const fromWorkshops = workshopEconomics(i).netPerRunCents * base.workshopsPerMonth
  const gap = Math.max(0, MONTHLY_TARGET_CENTS - fromWorkshops - base.bridgeIncomeCents)
  const booksPerMonth = margin > 0 ? Math.ceil(gap / margin) : 0
  const monthlyCents = fromWorkshops + base.bridgeIncomeCents + booksPerMonth * margin
  const runMonthsAtPace =
    booksPerMonth > 0 ? Math.round((i.printRunUnits / booksPerMonth) * 10) / 10 : Infinity
  return {
    ...base,
    booksPerMonth,
    monthlyCents,
    runMonthsAtPace,
    // Digital supply is unlimited, so no pace can exhaust it. This stays wired to
    // the real condition rather than hard-coded false: if a future path is ever
    // costed in paper, the old warning comes back on by itself.
    needsReprint:
      margin === blendedMarginCents(i) && booksPerMonth * i.repaymentMonths > i.printRunUnits,
    estimate:
      // The part-time figure, and the bills floor a runway is built on, are both
      // still placeholders. A salary TARGET is a goal, not an estimate, so it
      // does not by itself flag the path.
      (base.bridgeIncomeCents === BRIDGE_INCOME_CENTS && PATH_UNCONFIRMED.has('bridgeIncomeCents')) ||
      (!!base.runway && PATH_UNCONFIRMED.has('monthlyBillsFloorCents')) ||
      // Book- and workshop-derived counts inherit the campaign's own estimates.
      ((booksPerMonth > 0 || base.workshopsPerMonth > 0) &&
        [
          'printUnitCostCents',
          'shipUnitCostCents',
          'workshopSeatPriceCents',
          'workshopSeatsPerRun',
          // The copy counts are a direct function of what a reader costs to find.
          'digitalUnitCostCents',
          'adCostPerSaleCents',
          'paidAcquisitionShare',
        ].some((k) => isInputUnconfirmed(k))),
  }
}

// economics.ts owns UNCONFIRMED; re-checked through a seam so this file can't drift.
function isInputUnconfirmed(key: string): boolean {
  return UNCONFIRMED.has(key)
}

/**
 * Three ways to the same number. None of them is "the" plan — the plan is that
 * a miss on one engine is answered by another engine, not by a bigger ask.
 */
export function victoryPaths(i: CampaignInputs = INPUTS): VictoryPath[] {
  return [
    buildPath(
      {
        key: 'career-pivot',
        title: 'The Career Pivot',
        comp: 'Off-tank main — the flex pick. Same kit, different role, and the team stops losing.',
        thesis:
          'A finished book is a credential, not just a product. Published author in the allyship and inclusion field is a materially different job applicant than the same person was two years ago — this path spends that credential on a full-time role in the field, and the book keeps selling underneath it on evenings and weekends. This is the "go get a job" answer, run as a real plan with a real number instead of a shrug.',
        workshopsPerMonth: 0,
        bridgeIncomeCents: MONTHLY_TARGET_CENTS,
        needsUpFront: [
          'The book in hand as a credential — printed, not a file, for interviews and speaking bios',
          `A bounded search: ${JOB_SEARCH_MONTHS} months, targeted at DEI, L&D, and belonging roles`,
          'Bills covered for the search window, and nothing beyond that',
        ],
        supportLooksLike: [
          `Cover the bills floor — ${usd(MONTHLY_BILLS_FLOOR_CENTS)}/month for ${JOB_SEARCH_MONTHS} months, ending the day an offer signs`,
          'One warm introduction to anyone hiring in DEI, L&D, people ops, or belonging',
          'Read the resume and the bio against the book — tell me where the credential is being undersold',
        ],
        failureReads: `No offer by month ${JOB_SEARCH_MONTHS}. Then the search widens past the field, this path folds into the Steady Build, and the runway ask stops whether or not the job landed — it does not get extended.`,
        demandRisk:
          'Lowest demand risk of the four: it needs one employer to say yes, not hundreds of readers. Book sales are upside here, not load-bearing.',
        runway: {
          months: JOB_SEARCH_MONTHS,
          monthlyCents: MONTHLY_BILLS_FLOOR_CENTS,
          totalCents: MONTHLY_BILLS_FLOOR_CENTS * JOB_SEARCH_MONTHS,
          what: 'the bills floor during a full-time search — rent, food, insurance, phone. Not a salary, not a business budget.',
          endsWhen: 'the day an offer is signed, or month ' + JOB_SEARCH_MONTHS + ', whichever comes first',
        },
      },
      i,
    ),
    buildPath(
      {
        key: 'steady-build',
        title: 'The Steady Build',
        comp: 'Sustain comp — a healer on the team means nobody has to play perfectly.',
        thesis:
          'Part-time work covers the floor while the book and workshops grow into the ceiling. This is the "get a job" plan taken seriously: the job is IN it, on purpose, so no single month of slow sales threatens rent or the repayment schedule.',
        workshopsPerMonth: 1,
        bridgeIncomeCents: BRIDGE_INCOME_CENTS,
        needsUpFront: [
          'A part-time position or contract (applications are a campaign task, not a footnote)',
          'The print run in hand, so copies exist to sell',
          'One booked workshop room per month',
        ],
        supportLooksLike: [
          'Review the monthly numbers against this page — finding an error is the support',
          'Forward one job or contract lead if one crosses your desk',
          'Nothing financial beyond the car loan, if you choose to make it',
        ],
        failureReads:
          'Two consecutive months where combined income misses the floor by more than 20% — then the mix shifts or the target date moves, in writing.',
        demandRisk:
          'Moderate. The part-time floor holds rent no matter what the book does, so a slow sales month is a disappointment rather than an emergency. That is the entire point of the floor.',
      },
      i,
    ),
    buildPath(
      {
        key: 'ground-game',
        title: 'The Ground Game',
        comp: 'Brawl comp — win the fight in the room, every room, close range.',
        thesis:
          'Workshops are the highest-margin engine and the one that sells books by hand at the better margin. This path fills rooms first and lets book sales ride along with every event.',
        workshopsPerMonth: 4,
        bridgeIncomeCents: 0,
        needsUpFront: [
          'Four bookable rooms a month — this is the whole constraint',
          'The tour dates from the Book Tour workstream, converted into workshop stops',
          'The car, because rooms outside one bus line are where the demand is',
        ],
        supportLooksLike: [
          'One introduction to anyone who runs a venue, church hall, library program, or company offsite',
          'Sanity-check the per-workshop net figure against the receipts from the first run',
          'Attend one — count the room yourself and check the math against the door',
        ],
        failureReads:
          'Fewer than 2 bookings in any month, or seats filling under 60% of the planned count for two runs — the seat-count input gets rewritten with the real number before anything else is decided.',
        demandRisk:
          'Concentrated in rooms, not readers. Four filled rooms a month is a demand claim about venues and hosts, and it is the one this campaign has the least evidence for today.',
      },
      i,
    ),
    buildPath(
      {
        key: 'volume',
        title: 'The Volume Play',
        comp: 'Dive comp — all damage, no sustain. Wins fast or loses fast, and you know which by day 30.',
        thesis:
          'The digital edition only. Unlimited supply means this path is no longer arithmetically impossible the way it was on paper — but everything it needs is now a demand claim, and demand is the thing nobody here has proven. It is still the path the plan does NOT lean on; it is just honestly costed instead of dismissed.',
        workshopsPerMonth: 0,
        bridgeIncomeCents: 0,
        needsUpFront: [
          'The Dream 100 list actually worked — relationships, not a mailing blast',
          'The proven ad funnel (the 3-month ad test exists to answer whether this path is real)',
          'A digital storefront that can actually take the money and deliver the file',
        ],
        supportLooksLike: [
          'Audit the ad-test results at day 90 — cost per copy sold, against this page',
          'Buy one digital copy and tell me honestly whether it was worth $30 to you',
          'This path asks the least of any ally and the most of the founder',
        ],
        failureReads: `Ad test finishes with a cost-per-sale above ${usd(digitalEconomics(i).marginCents)} — the path is dead and is retired, not retried with a bigger budget.`,
        demandRisk:
          'Highest of the four, and it is now the ONLY risk. Supply is solved; every remaining question is whether strangers buy. Selling this many copies a month, every month, is a thing this campaign has never once done.',
      },
      i,
    ),
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// The copy ladder — the same question answered at every altitude:
// "how many books is that?"
// ─────────────────────────────────────────────────────────────────────────────

export interface CopyRung {
  key: string
  label: string
  copies: number
  note: string
}

export function copyLadder(i: CampaignInputs = INPUTS): CopyRung[] {
  const print = printEconomics(i)
  const digital = digitalEconomics(i)
  const margin = salesMarginCents(i)
  const loanBooksShare = Math.round(i.carLoanCents * i.repaymentMix.books)
  const loanCopies = margin > 0 ? Math.ceil(loanBooksShare / margin) : 0
  const targetCopies = margin > 0 ? Math.ceil(MONTHLY_TARGET_CENTS / margin) : 0
  const printRunCopies = margin > 0 ? Math.ceil(print.landedTotalCents / margin) : 0

  // Sorted by size so it reads as a ladder. The rungs' relative order is not
  // fixed — a dearer cost per sale can push the income target above the paper
  // break-even — so it is derived rather than authored.
  const rungs: CopyRung[] = [
    {
      key: 'loan',
      label: `Repay the book half of the ${usd(i.carLoanCents)} loan`,
      copies: loanCopies,
      note: `${Math.ceil(loanCopies / Math.max(1, i.repaymentMonths))} digital copies a month over ${i.repaymentMonths} months — the other half comes from workshops`,
    },
    {
      key: 'print-run',
      label: 'Pay off the whole print run in digital sales',
      copies: printRunCopies,
      note: `${usd(print.landedTotalCents)} at ${usd(digital.marginCents)} a copy — digital is what makes the paper run affordable, not the other way round`,
    },
    {
      key: 'target',
      label: `Hit ${usd(MONTHLY_TARGET_CENTS)}/month on books alone`,
      copies: targetCopies,
      note: 'per month, every month. Supply can do this; nothing yet proves demand can.',
    },
    {
      key: 'break-even',
      label: 'Make the print run free from paper sales alone',
      copies: print.breakEvenUnits,
      note: print.coversRunFromSellable
        ? `of the ${print.sellableUnits} left after the ${print.obligationUnits} already owed — it fits, with ${print.sellableUnits - print.breakEvenUnits} copies to spare`
        : `more than the ${print.sellableUnits} left after the ${print.obligationUnits} already owed — the one rung here that does not fit`,
    },
  ]

  return rungs.sort((a, b) => a.copies - b.copies)
}

// ─────────────────────────────────────────────────────────────────────────────
// The 90-day campaign — three gates, each with a written abort condition.
// ─────────────────────────────────────────────────────────────────────────────

export interface NinetyDayGate {
  day: 30 | 60 | 90
  title: string
  /** Checkable facts, not vibes. Each one is publicly verifiable by an ally. */
  proves: string[]
  /** What happens if the gate does NOT pass. Written before day 1, not after day 29. */
  ifMissed: string
}

export const NINETY_DAY: readonly NinetyDayGate[] = [
  {
    day: 30,
    title: 'Prove the machine exists',
    proves: [
      'Print quote in writing — the "estimate" flags on this page replaced by real numbers',
      'First workshop scheduled with a named venue and date',
      'First 10 tour/venue conversations logged on the campaign board',
      'Career Pivot / Steady Build: applications out and interviews logged, counted on the board',
    ],
    ifMissed:
      'We talk before anything else happens — same numbers in front of both of us, and the gate is checkable from your own page, so neither of us is working from a feeling.',
  },
  {
    day: 60,
    title: 'Prove people pay',
    proves: [
      'First workshop delivered — real seat count and real net posted next to the estimate',
      'Print run ordered; the 250 already-sold copies counted, boxed, and shipping',
      'First loan payment made, on schedule, regardless of how the month went',
      'Career Pivot: second-round interviews, or the path is already in trouble',
    ],
    ifMissed:
      'The path changes, the ask does not. A missed gate shifts the mix toward whichever engine IS working — it never becomes a request for more money.',
  },
  {
    day: 90,
    title: 'Prove the pace holds',
    proves: [
      'Three consecutive loan payments made',
      'Chosen path hitting its monthly copy and workshop counts, posted on the board',
      `Ad test concluded with a real cost-per-sale — the guess on this page replaced by a fact, and measured against the ${usd(digitalEconomics().marginCents)} ceiling`,
      'Every copy count on this page recomputed from that fact, whichever way it goes',
    ],
    ifMissed:
      'The 90-day review happens either way, with the same numbers in front of both of us. The question at that table is "which engine, at what pace" — never "who else can we ask."',
  },
] as const
