/**
 * Ally Campaign — the honest economics.
 *
 * One place for every number the campaign quotes. Surfaces (the /ally CYOA, the
 * steward dashboard, the CSV export) derive their targets from here — nothing
 * hard-codes a dollar figure or a unit count of its own. Edit the INPUTS block
 * and every "here's what it takes" line on the site recomputes.
 *
 * Design stance (UI_COVENANT + the deck sales page's honest-terms guarantee):
 * we never show a number we can't stand behind. Anything still unconfirmed is
 * marked `TODO(wendell)` below and rendered with a visible "estimate" flag by
 * `isEstimate` — the site says "estimate" out loud rather than implying
 * precision we don't have.
 *
 * Units: money is in CENTS everywhere (never floats). Counts are whole units.
 */

// ─────────────────────────────────────────────────────────────────────────────
// INPUTS — edit these. Everything below is derived.
// ─────────────────────────────────────────────────────────────────────────────

/** Which inputs are still placeholders. Remove a key once the real number lands. */
export const UNCONFIRMED = new Set<string>([
  // carLoanCents is CONFIRMED — $2,500, the actual ask (Wendell, 2026-08-13).
  // The car's full price is still open; if it lands above the loan, the gap is
  // self-funded and `carBudgetCents` should rise while `carLoanCents` stays put.
  'carBudgetCents',
  'printUnitCostCents',
  'shipUnitCostCents',
  'digitalUnitCostCents',
  'workshopSeatPriceCents',
  'workshopSeatsPerRun',
  'adMonthlyBudgetCents',
  'nonprofitFilingCents',
  'adCostPerSaleCents',
  'paidAcquisitionShare',
  'workshopAttachRate',
])

export interface CampaignInputs {
  // ── The car ────────────────────────────────────────────────────────────────
  /**
   * TODO(wendell): full price of a reliable, tour-capable vehicle. Only the
   * `carLoanCents` portion is borrowed; any excess is self-funded, so this can
   * rise without changing what anyone is being asked for.
   */
  carBudgetCents: number
  /**
   * The actual ask — what is borrowed from family and repaid on a schedule.
   * This, not `carBudgetCents`, drives the repayment plan. Kept separate because
   * "what the car costs" and "what I'm asking you for" are different questions
   * and collapsing them is how an ask quietly inflates.
   */
  carLoanCents: number
  /** How the payback splits between the two revenue engines. Must sum to 1. */
  repaymentMix: { workshops: number; books: number }
  /** Months Wendell is committing to pay it back within. */
  repaymentMonths: number

  // ── The print run ──────────────────────────────────────────────────────────
  /** Total copies in the run. */
  printRunUnits: number
  /**
   * Copies ALREADY SOLD to readers who are still waiting for delivery.
   *
   * These are not inventory and they are not revenue. The money was collected and
   * spent; the copies are an obligation the print run has to discharge before it
   * can earn anything. Counting them as sellable would be the single easiest way
   * to make this plan look better than it is, so they are subtracted everywhere.
   *
   * TODO(wendell): confirm this revenue is fully spent. If any of it is still on
   * hand it belongs in the capital block as cash already raised, not here.
   */
  presoldUnits: number
  /** Copies held back to sell hand-to-hand at conferences + in-person events. */
  unitsHeldForEvents: number
  /** TODO(wendell): per-unit print cost at this run size. */
  printUnitCostCents: number
  /** TODO(wendell): per-unit shipping/fulfillment for the mailed portion. */
  shipUnitCostCents: number
  /** Cover price of the physical book. */
  bookRetailPriceCents: number

  // ── The digital edition ────────────────────────────────────────────────────
  /**
   * Price of the digital edition. Supply is UNLIMITED — this is the only engine
   * in the campaign with no unit ceiling, which makes it the one the repayment
   * plan can actually lean on.
   *
   * CONFIRMED $30 (Wendell, 2026-08-18), and the `book-digital` offer in
   * `@/lib/launch/offers` was raised from pay-what-you-want/$15 to match.
   *
   * These two must never disagree: an ally asking five people to buy a $30 book
   * cannot make that ask against a page that invites $15, and every copy target
   * in this campaign is computed from the figure below. `digital-price-parity`
   * fails the build if they drift apart.
   */
  digitalPriceCents: number
  /**
   * TODO(wendell): payment processing + delivery per digital sale. Placeholder
   * assumes roughly 2.9% + $0.30 on a card charge. Confirm against the actual
   * processor before this figure is quoted to anyone.
   */
  digitalUnitCostCents: number

  // ── Workshops ──────────────────────────────────────────────────────────────
  /** TODO(wendell): price per seat. */
  workshopSeatPriceCents: number
  /** TODO(wendell): seats you actually fill per run (be pessimistic here). */
  workshopSeatsPerRun: number
  /** Share of workshop revenue left after venue, materials, travel. */
  workshopNetMargin: number

  // ── Awareness: ads + Dream 100 ─────────────────────────────────────────────
  /** TODO(wendell): monthly paid-ad budget once the funnel is proven. */
  adMonthlyBudgetCents: number
  /** The Dream 100 — named people/orgs worth a real relationship, not a blast. */
  dream100Target: number
  /**
   * TODO(wendell): ad spend required to produce ONE book sale.
   *
   * This is the most consequential unknown in the entire campaign and the actual
   * question the 3-month ad test exists to answer. Everything downstream — how
   * many copies a month each path needs, whether paid acquisition is an engine
   * or a hole — is a function of this number, and right now it is a guess.
   *
   * The ceiling is not negotiable: if it lands at or above the per-copy margin,
   * every paid sale loses money and no amount of budget fixes that.
   */
  adCostPerSaleCents: number
  /**
   * TODO(wendell): share of book sales expected to come from PAID acquisition
   * rather than organic reach (Dream 100, events, word of mouth, the deck).
   *
   * Organic sales cost nothing to acquire, so this fraction decides how much the
   * acquisition cost drags on the plan. Setting it to 0 would assume every reader
   * arrives free, which is the assumption that made the earlier version of this
   * page too optimistic.
   */
  paidAcquisitionShare: number
  /**
   * TODO(wendell): share of book readers who eventually buy a workshop seat.
   *
   * This is the hinge of the entire paid-acquisition argument. A book sold on
   * cold paid traffic frequently costs more than the book earns — that is normal
   * for this category and not by itself a verdict. It only becomes profitable if
   * some readers go on to buy something bigger, which for this business is a
   * workshop seat.
   *
   * So the honest question is not "do ads pay for the book" but "what fraction
   * of readers has to take a seat for ads to pay at all." `attachRateToBreakEven`
   * turns any cost per sale into exactly that number, which is checkable.
   */
  workshopAttachRate: number

  // ── The nonprofit ──────────────────────────────────────────────────────────
  /** TODO(wendell): filing + registered agent + first-year compliance. */
  nonprofitFilingCents: number

  // ── The tour ───────────────────────────────────────────────────────────────
  /** Events to book for the tour. */
  tourEventTarget: number
  /** Copies you expect to move at a single in-person event. */
  unitsPerEvent: number
}

export const INPUTS: CampaignInputs = {
  carBudgetCents: 2_500_00,
  carLoanCents: 2_500_00,
  repaymentMix: { workshops: 0.5, books: 0.5 },
  repaymentMonths: 18,

  printRunUnits: 500,
  presoldUnits: 250,
  unitsHeldForEvents: 200,
  printUnitCostCents: 6_50,
  shipUnitCostCents: 4_75,
  bookRetailPriceCents: 40_00,

  digitalPriceCents: 30_00,
  digitalUnitCostCents: 1_17,

  workshopSeatPriceCents: 150_00,
  workshopSeatsPerRun: 12,
  workshopNetMargin: 0.7,

  adMonthlyBudgetCents: 500_00,
  dream100Target: 100,
  adCostPerSaleCents: 12_00,
  paidAcquisitionShare: 0.5,
  workshopAttachRate: 0.03,

  nonprofitFilingCents: 1_200_00,

  tourEventTarget: 12,
  unitsPerEvent: 18,
}

/** True when a figure is still a placeholder — surfaces label it "estimate". */
export function isEstimate(key: keyof CampaignInputs): boolean {
  return UNCONFIRMED.has(key)
}

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED — do not hand-edit; change the inputs above.
// ─────────────────────────────────────────────────────────────────────────────

const round = (n: number) => Math.round(n)
const ceil = (n: number) => Math.ceil(n)

export interface PrintEconomics {
  /** Copies mailed out rather than carried to events. */
  unitsForFulfillment: number
  /** Print cost for the whole run. */
  printTotalCents: number
  /** Shipping cost for the mailed portion only (event copies travel with him). */
  shipTotalCents: number
  /** What it costs to put 500 books into the world. */
  landedTotalCents: number
  /** True per-copy cost across the run. */
  landedUnitCostCents: number
  /** Margin on a copy sold hand-to-hand at an event (no shipping). */
  eventUnitMarginCents: number
  /** Margin on a copy mailed to a reader. */
  mailedUnitMarginCents: number
  /** Copies that must sell just to cover the run. */
  breakEvenUnits: number
  /** Revenue if the 200 event copies all move at events. */
  eventRevenuePotentialCents: number
  /** Copies owed to readers who already paid — an obligation, not inventory. */
  obligationUnits: number
  /** Copies actually available to earn new money. */
  sellableUnits: number
  /**
   * False when break-even needs more copies than the run has left to sell after
   * the pre-sold obligations come out. This is the sentence the plan most wants
   * to avoid saying, which is exactly why it gets its own flag.
   */
  coversRunFromSellable: boolean
}

export function printEconomics(i: CampaignInputs = INPUTS): PrintEconomics {
  const unitsForFulfillment = Math.max(0, i.printRunUnits - i.unitsHeldForEvents)
  const printTotalCents = i.printUnitCostCents * i.printRunUnits
  const shipTotalCents = i.shipUnitCostCents * unitsForFulfillment
  const landedTotalCents = printTotalCents + shipTotalCents
  const landedUnitCostCents = i.printRunUnits > 0 ? round(landedTotalCents / i.printRunUnits) : 0

  const eventUnitMarginCents = i.bookRetailPriceCents - i.printUnitCostCents
  const mailedUnitMarginCents = i.bookRetailPriceCents - i.printUnitCostCents - i.shipUnitCostCents

  // Break-even measured against the blended landed cost — the honest number.
  const blendedMargin = i.bookRetailPriceCents - landedUnitCostCents
  const breakEvenUnits = blendedMargin > 0 ? ceil(landedTotalCents / blendedMargin) : 0

  const obligationUnits = Math.min(i.presoldUnits, i.printRunUnits)
  const sellableUnits = Math.max(0, i.printRunUnits - obligationUnits)

  return {
    unitsForFulfillment,
    printTotalCents,
    shipTotalCents,
    landedTotalCents,
    landedUnitCostCents,
    eventUnitMarginCents,
    mailedUnitMarginCents,
    breakEvenUnits,
    eventRevenuePotentialCents: i.unitsHeldForEvents * i.bookRetailPriceCents,
    obligationUnits,
    sellableUnits,
    coversRunFromSellable: breakEvenUnits > 0 && breakEvenUnits <= sellableUnits,
  }
}

export interface DigitalEconomics {
  priceCents: number
  unitCostCents: number
  /** What one digital sale actually returns. */
  marginCents: number
  /**
   * Always true, and the single most important structural fact in the plan:
   * digital has no unit ceiling. Every other engine is capacity-bound — the run
   * prints what it prints, a workshop seats who it seats.
   */
  unlimitedSupply: true
  /** How much better a digital sale is than the blended print copy. */
  marginAdvantageCents: number
}

/**
 * The digital edition.
 *
 * This changes the shape of the whole campaign, so it is worth stating plainly:
 * digital moves the binding constraint from SUPPLY to DEMAND. Print asks "can we
 * make enough copies"; digital asks "can we find enough readers." Those are
 * different problems with different failure modes, and the second one is the
 * honest one — nothing in this campaign has proven demand yet. That is precisely
 * what the ad test and the Dream 100 exist to answer.
 */
export function digitalEconomics(i: CampaignInputs = INPUTS): DigitalEconomics {
  const marginCents = i.digitalPriceCents - i.digitalUnitCostCents
  const { landedUnitCostCents } = printEconomics(i)
  return {
    priceCents: i.digitalPriceCents,
    unitCostCents: i.digitalUnitCostCents,
    marginCents,
    unlimitedSupply: true,
    marginAdvantageCents: marginCents - (i.bookRetailPriceCents - landedUnitCostCents),
  }
}

/**
 * Published cost-per-sale benchmarks, by channel.
 *
 * EXTERNAL DATA, not Wendell's numbers — these are what the category costs other
 * people, and they exist so the plan's own guess can be judged against something
 * rather than asserted. Every entry carries its source; if a figure has no
 * source it does not belong in this list.
 *
 * The headline: a $30 book sold to cold Meta traffic costs about what it earns.
 * That is not a reason to abandon paid acquisition — it is the reason the
 * workshop attach rate below is the number that actually decides the question.
 */
export interface AcquisitionBenchmark {
  key: string
  label: string
  /** Null when the channel's cost lands somewhere the sources don't price. */
  lowCents: number | null
  highCents: number | null
  what: string
  source: string
}

export const ACQUISITION_BENCHMARKS: readonly AcquisitionBenchmark[] = [
  {
    key: 'amazon-ads',
    label: 'Amazon Ads',
    lowCents: 5_60,
    highCents: 15_60,
    what: 'Sponsored Products run roughly $0.81–$1.30 a click; at about a 10% conversion that is 7–12 clicks per sale. Amazon takes its own cut on top, and the reader stays Amazon’s, not yours.',
    source: 'Ad Badger / SellerMetrics Amazon advertising benchmarks, 2026',
  },
  {
    key: 'meta-cold',
    label: 'Meta, cold traffic, direct sale',
    lowCents: 30_69,
    highCents: 30_69,
    what: 'Median cost per purchase for the Books & Music vertical. This is a median across 40,000+ brands, so half of them do worse. Assume worse until proven otherwise.',
    source: 'Triple Whale Meta benchmarks, 40,000+ brands, Aug 2025 – Jul 2026',
  },
  {
    key: 'meta-email-first',
    label: 'Meta, email-first funnel',
    lowCents: null,
    highCents: null,
    what: 'Ads buy an email address rather than a sale; the sale happens later over a sequence. Reliably cheaper per reader than a cold direct sale, but the sources price a cost-per-lead, not a cost-per-sale — quoting a number here would be inventing one.',
    source: 'Landing-page and cold-traffic funnel benchmarks, 2025–2026',
  },
] as const

export interface AdEconomics {
  /** What one sale returns before any cost of getting it. */
  grossMarginCents: number
  /** What it costs in ad spend to produce one sale. */
  costPerSaleCents: number
  /** What a PAID sale is actually worth once its acquisition is paid for. */
  contributionPerPaidSaleCents: number
  /**
   * The ceiling if the book has to pay for itself, alone. Above this a sale
   * loses money on the book — which, in this category, is most of the time.
   */
  maxViableCostPerSaleCents: number
  /**
   * The ceiling once a reader's downstream value counts: some readers take a
   * workshop seat later. Reported SEPARATELY from the book-only ceiling and
   * never blended into one "it works" number, because the two answer different
   * questions and only one of them is proven.
   */
  ltvCeilingCents: number
  /** What a reader is worth across the whole relationship, not one transaction. */
  readerLtvCents: number
  /** False when paid acquisition loses money on the book alone. */
  viable: boolean
  /** True when the current cost per sale clears the LTV ceiling. */
  viableOnLtv: boolean
  /**
   * The falsifiable version of "ads will work": the share of readers who must
   * eventually buy a workshop seat for the CURRENT cost per sale to break even.
   * Zero when the book already covers it on its own.
   */
  requiredAttachRate: number
  /** Return on ad spend — revenue per dollar in. Below 1.0 is a hole. */
  roas: number
  /** Sales the monthly budget buys at this cost. */
  salesPerMonthAtBudget: number
  /** What those sales actually contribute after the budget is paid. */
  netPerMonthAtBudget: number
  /**
   * Per-sale contribution BLENDED across paid and organic — the figure every
   * path's copy count is measured in, so no path can quietly assume its readers
   * arrived for free.
   */
  blendedContributionPerSaleCents: number
}

/**
 * Paid acquisition, stated as the arithmetic that decides whether it is an
 * engine or a hole.
 *
 * The omission this replaces was serious: every path used to count a book sale
 * as pure margin, which silently assumed readers cost nothing to find. Once a
 * fraction of them arrive through ads, each of those sales carries its own
 * acquisition cost and the copy counts go UP. They should.
 */
export function adEconomics(i: CampaignInputs = INPUTS): AdEconomics {
  const grossMarginCents = digitalEconomics(i).marginCents
  const costPerSaleCents = Math.max(0, i.adCostPerSaleCents)
  const contributionPerPaidSaleCents = grossMarginCents - costPerSaleCents
  const share = Math.min(1, Math.max(0, i.paidAcquisitionShare))

  const salesPerMonthAtBudget =
    costPerSaleCents > 0 ? Math.floor(i.adMonthlyBudgetCents / costPerSaleCents) : 0

  const netPerSeatCents = netPerWorkshopSeatCents(i)
  const attach = Math.min(1, Math.max(0, i.workshopAttachRate))
  const readerLtvCents = round(grossMarginCents + attach * netPerSeatCents)

  return {
    grossMarginCents,
    costPerSaleCents,
    contributionPerPaidSaleCents,
    maxViableCostPerSaleCents: grossMarginCents,
    ltvCeilingCents: readerLtvCents,
    readerLtvCents,
    viable: costPerSaleCents > 0 && costPerSaleCents < grossMarginCents,
    viableOnLtv: costPerSaleCents > 0 && costPerSaleCents < readerLtvCents,
    requiredAttachRate: attachRateToBreakEven(costPerSaleCents, i),
    roas: costPerSaleCents > 0 ? i.digitalPriceCents / costPerSaleCents : 0,
    salesPerMonthAtBudget,
    netPerMonthAtBudget: salesPerMonthAtBudget * contributionPerPaidSaleCents,
    blendedContributionPerSaleCents: round(grossMarginCents - share * costPerSaleCents),
  }
}

/** Net a single workshop seat returns, after venue, materials and travel. */
export function netPerWorkshopSeatCents(i: CampaignInputs = INPUTS): number {
  const seats = Math.max(1, i.workshopSeatsPerRun)
  return round(workshopEconomics(i).netPerRunCents / seats)
}

/**
 * The share of readers who must eventually take a workshop seat for a given cost
 * per sale to break even.
 *
 * This is the whole paid-acquisition argument reduced to one checkable fraction.
 * "Ads will work" is unfalsifiable; "2.8% of readers must book a seat" is a claim
 * that can be measured and can be wrong. Returns 0 when the book already covers
 * its own acquisition, and 1 when no attach rate could rescue it.
 */
export function attachRateToBreakEven(costPerSaleCents: number, i: CampaignInputs = INPUTS): number {
  const bookMargin = digitalEconomics(i).marginCents
  if (costPerSaleCents <= bookMargin) return 0
  const netPerSeat = netPerWorkshopSeatCents(i)
  if (netPerSeat <= 0) return 1
  return Math.min(1, Math.round(((costPerSaleCents - bookMargin) / netPerSeat) * 10000) / 10000)
}

/** One row of "what if the ad test comes back at…" — the honest way to quote an unknown. */
export interface CacScenario {
  costPerSaleCents: number
  contributionPerSaleCents: number
  /** Copies a month needed to hit the income target on books alone at this CAC. */
  copiesForTarget: number
  viable: boolean
  verdict: string
  /** Where this figure comes from, when it is a published benchmark rather than a round number. */
  benchmarkLabel?: string
  /** Share of readers who must take a workshop seat for this cost to break even. */
  requiredAttachRate: number
}

/**
 * A sensitivity table instead of a single made-up number.
 *
 * The cost per sale is unknown, so the responsible thing is not to pick a
 * flattering value and quote it — it is to show what each possible answer would
 * mean, including the ones that kill the path.
 */
export function cacScenarios(
  monthlyTargetCents: number,
  i: CampaignInputs = INPUTS,
): CacScenario[] {
  const margin = digitalEconomics(i).marginCents
  const share = Math.min(1, Math.max(0, i.paidAcquisitionShare))

  // Anchored on published benchmarks rather than round numbers, so the table is
  // a map of the real range this category costs — including the parts that hurt.
  const amazon = ACQUISITION_BENCHMARKS.find((b) => b.key === 'amazon-ads')
  const meta = ACQUISITION_BENCHMARKS.find((b) => b.key === 'meta-cold')
  const points: { cents: number; label?: string }[] = [
    { cents: amazon?.lowCents ?? 5_60, label: 'Amazon Ads, good' },
    { cents: i.adCostPerSaleCents, label: 'this plan assumes' },
    { cents: amazon?.highCents ?? 15_60, label: 'Amazon Ads, poor' },
    { cents: margin, label: 'the book-only ceiling' },
    { cents: meta?.lowCents ?? 30_69, label: 'Meta cold-traffic median' },
  ]
    .filter((p, idx, all) => all.findIndex((o) => o.cents === p.cents) === idx)
    .sort((a, b) => a.cents - b.cents)

  return points.map(({ cents: cac, label }) => {
    const contribution = round(margin - share * cac)
    const viable = cac < margin
    return {
      costPerSaleCents: cac,
      contributionPerSaleCents: contribution,
      copiesForTarget: contribution > 0 ? ceil(monthlyTargetCents / contribution) : 0,
      viable,
      benchmarkLabel: label,
      requiredAttachRate: attachRateToBreakEven(cac, i),
      verdict:
        cac < margin / 3
          ? 'the book pays for its own ads several times over'
          : cac < margin / 1.5
            ? 'the book pays for its ads, and the pace is real work'
            : cac < margin
              ? 'the book barely covers its own ads; organic has to carry the plan'
              : 'the book alone loses money on every ad sale — it only works if readers go on to buy a seat',
    }
  })
}

export interface WorkshopEconomics {
  /** Gross for one full workshop run. */
  grossPerRunCents: number
  /** What actually lands after venue/materials/travel. */
  netPerRunCents: number
}

export function workshopEconomics(i: CampaignInputs = INPUTS): WorkshopEconomics {
  const grossPerRunCents = i.workshopSeatPriceCents * i.workshopSeatsPerRun
  return {
    grossPerRunCents,
    netPerRunCents: round(grossPerRunCents * i.workshopNetMargin),
  }
}

export interface RepaymentPlan {
  /** The amount being paid back. */
  principalCents: number
  /** Portion assigned to each engine. */
  fromWorkshopsCents: number
  fromBooksCents: number
  /** How many of each it takes. */
  workshopsNeeded: number
  booksNeeded: number
  /** Pace required to land inside `repaymentMonths`. */
  workshopsPerMonth: number
  booksPerMonth: number
  monthlyCents: number
  /** Copies the current print run can actually supply. */
  booksAvailable: number
  /**
   * False when the plan needs more copies than the run prints — i.e. the pitch
   * would be promising books that do not exist. Surfaced in the UI rather than
   * hidden, because a repayment schedule that can't be sourced is not a schedule.
   */
  withinCapacity: boolean
}

/**
 * The PRINT-ONLY repayment view: what it would take if paper were the only book
 * revenue. Retained because its answer is unflattering and useful — the run
 * cannot comfortably carry the loan on its own once the 250 owed copies come
 * out. See {@link repaymentPlanDigital} for the plan actually being proposed.
 *
 * The ask, stated as a plan rather than a hope: what the car costs, split across
 * the two engines, converted into a countable number of workshops and books,
 * then divided into a monthly pace. This is the core of the pitch — it turns
 * "please buy me a car" into "here is the repayment schedule."
 *
 * Books are costed at the run's BLENDED margin, not the (better) hand-to-hand
 * event margin. Using the event margin would quietly assume every repayment copy
 * gets sold in person, and the run only holds back `unitsHeldForEvents` of them —
 * an assumption that flatters the plan by understating how many books it takes.
 */
export function repaymentPlan(i: CampaignInputs = INPUTS): RepaymentPlan {
  // The borrowed portion, never the car's full price — see `carLoanCents`.
  const principalCents = i.carLoanCents
  const fromWorkshopsCents = round(principalCents * i.repaymentMix.workshops)
  const fromBooksCents = principalCents - fromWorkshopsCents

  const { netPerRunCents } = workshopEconomics(i)
  const { landedUnitCostCents, sellableUnits } = printEconomics(i)
  const blendedMarginCents = i.bookRetailPriceCents - landedUnitCostCents

  const workshopsNeeded = netPerRunCents > 0 ? ceil(fromWorkshopsCents / netPerRunCents) : 0
  const booksNeeded = blendedMarginCents > 0 ? ceil(fromBooksCents / blendedMarginCents) : 0
  const months = Math.max(1, i.repaymentMonths)

  return {
    principalCents,
    fromWorkshopsCents,
    fromBooksCents,
    workshopsNeeded,
    booksNeeded,
    workshopsPerMonth: Math.round((workshopsNeeded / months) * 10) / 10,
    booksPerMonth: ceil(booksNeeded / months),
    monthlyCents: ceil(principalCents / months),
    // Copies owed to readers who already paid cannot also be sold to repay a
    // loan. Capacity is what's left AFTER the obligations, never the run size.
    booksAvailable: sellableUnits,
    withinCapacity: booksNeeded <= sellableUnits,
  }
}

/**
 * How a given dollar comes back — or doesn't.
 *
 *   repaid    goes back to a specific person on a schedule (the car loan)
 *   recouped  comes back out of sales revenue (the print run)
 *   spent     genuinely gone; the real cost of the year (ads, filing fees)
 *
 * These are NOT interchangeable and must never be summed into a single
 * "what I need" figure without also being shown apart. A lone total blends a
 * loan with a sunk cost and reads as "give me $9,875" when the true sentence is
 * "$2,500 comes back to you, $4,675 comes back out of sales, $2,700 is gone."
 * Same principle as the Six Faces unit ruling: report kinds separately, always.
 */
/**
 * The repayment plan as it is ACTUALLY run: workshops plus the digital edition.
 *
 * `repaymentPlan` above answers a narrower question — "could the print run alone
 * carry this?" — and its answer is no, which is worth knowing and worth showing.
 * This is the plan being proposed. Digital is unbounded in supply, so there is no
 * capacity flag here; the risk simply moved somewhere else, and `demandCaveat`
 * exists so no surface can quote the smaller number without carrying the reason
 * it is smaller.
 */
export interface DigitalRepaymentPlan {
  principalCents: number
  fromWorkshopsCents: number
  fromBooksCents: number
  workshopsNeeded: number
  /** Digital copies over the whole term. No ceiling — supply is unlimited. */
  copiesNeeded: number
  copiesPerMonth: number
  workshopsPerMonth: number
  monthlyCents: number
  /** How many FEWER copies this takes than doing it on print alone. */
  copiesSavedVsPrint: number
  demandCaveat: string
}

export function repaymentPlanDigital(i: CampaignInputs = INPUTS): DigitalRepaymentPlan {
  const principalCents = i.carLoanCents
  const fromWorkshopsCents = round(principalCents * i.repaymentMix.workshops)
  const fromBooksCents = principalCents - fromWorkshopsCents

  const { netPerRunCents } = workshopEconomics(i)
  const { marginCents } = digitalEconomics(i)

  const workshopsNeeded = netPerRunCents > 0 ? ceil(fromWorkshopsCents / netPerRunCents) : 0
  const copiesNeeded = marginCents > 0 ? ceil(fromBooksCents / marginCents) : 0
  const months = Math.max(1, i.repaymentMonths)

  return {
    principalCents,
    fromWorkshopsCents,
    fromBooksCents,
    workshopsNeeded,
    copiesNeeded,
    copiesPerMonth: ceil(copiesNeeded / months),
    workshopsPerMonth: Math.round((workshopsNeeded / months) * 10) / 10,
    monthlyCents: ceil(principalCents / months),
    copiesSavedVsPrint: Math.max(0, repaymentPlan(i).booksNeeded - copiesNeeded),
    demandCaveat:
      'Digital supply is unlimited; digital demand is not. This number is smaller than the print one because the margin is better, not because selling got easier.',
  }
}

export type RecoveryKind = 'repaid' | 'recouped' | 'spent'

export interface CampaignLine {
  key: string
  label: string
  cents: number
  estimate: boolean
  recovery: RecoveryKind
  /** How this specific money comes back, in one plain line. */
  recoveryNote: string
}

export interface CampaignTotals {
  /**
   * Money that must EXIST up front, before any revenue returns. This is a
   * cash-flow requirement, not a cost — do not present it alone.
   */
  capitalNeededCents: number
  /** Returned to a lender on a written schedule. */
  repaidCents: number
  /** Recovered out of sales revenue. */
  recoupedCents: number
  /** Never recovered — the honest cost of doing this for a year. */
  spentCents: number
  lines: CampaignLine[]
}

export function campaignTotals(i: CampaignInputs = INPUTS): CampaignTotals {
  const print = printEconomics(i)
  const plan = repaymentPlan(i)

  // The car splits into a borrowed portion and any self-funded gap. They are
  // different kinds of money and are never shown as one line.
  const carGapCents = Math.max(0, i.carBudgetCents - i.carLoanCents)

  const authored: Omit<CampaignLine, 'estimate'>[] = [
    {
      key: 'carLoanCents',
      label: 'The car — borrowed',
      cents: i.carLoanCents,
      recovery: 'repaid',
      recoveryNote: `repaid to the lender at ${usd(plan.monthlyCents)}/month over ${i.repaymentMonths} months`,
    },
    ...(carGapCents > 0
      ? [
          {
            key: 'carBudgetCents',
            label: 'The car — self-funded',
            cents: carGapCents,
            recovery: 'spent' as RecoveryKind,
            recoveryNote: 'the part of the vehicle nobody is being asked to cover',
          },
        ]
      : []),
    {
      key: 'printUnitCostCents',
      label: `Print run (${i.printRunUnits} copies)`,
      cents: print.printTotalCents,
      recovery: 'recouped',
      recoveryNote: `recovered from book sales across both editions — paper alone would need ${print.breakEvenUnits} of the ${print.sellableUnits} it has left to sell, which is why digital carries this`,
    },
    {
      key: 'shipUnitCostCents',
      label: `Shipping (${print.unitsForFulfillment} mailed)`,
      cents: print.shipTotalCents,
      recovery: 'recouped',
      recoveryNote: 'built into the cover price of every mailed copy',
    },
    {
      key: 'adMonthlyBudgetCents',
      label: 'Ads (3-month test)',
      cents: i.adMonthlyBudgetCents * 3,
      recovery: 'spent',
      recoveryNote: 'buys an answer, not inventory — this money does not come back',
    },
    {
      key: 'nonprofitFilingCents',
      label: 'Nonprofit filing + first year',
      cents: i.nonprofitFilingCents,
      recovery: 'spent',
      recoveryNote: 'one-time cost of an entity that outlives its founder',
    },
  ]

  const lines: CampaignLine[] = authored.map((l) => ({
    ...l,
    estimate: UNCONFIRMED.has(l.key),
  }))

  const sumOf = (kind: RecoveryKind) =>
    lines.filter((l) => l.recovery === kind).reduce((s, l) => s + l.cents, 0)

  return {
    capitalNeededCents: lines.reduce((sum, l) => sum + l.cents, 0),
    repaidCents: sumOf('repaid'),
    recoupedCents: sumOf('recouped'),
    spentCents: sumOf('spent'),
    lines,
  }
}

/** Human label for a recovery kind — used as a group heading. */
export const RECOVERY_LABEL: Record<RecoveryKind, string> = {
  repaid: 'Comes back to the lender',
  recouped: 'Comes back out of sales',
  spent: 'Genuinely spent',
}

/** `$1,234` / `$1,234.50` — cents in, display string out. Never floats in state. */
export function usd(cents: number, opts: { showCents?: boolean } = {}): string {
  const showCents = opts.showCents ?? cents % 100 !== 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(cents / 100)
}
