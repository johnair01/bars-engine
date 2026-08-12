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
  'carBudgetCents',
  'printUnitCostCents',
  'shipUnitCostCents',
  'workshopSeatPriceCents',
  'workshopSeatsPerRun',
  'adMonthlyBudgetCents',
  'nonprofitFilingCents',
])

export interface CampaignInputs {
  // ── The car ────────────────────────────────────────────────────────────────
  /** TODO(wendell): real target for a reliable, tour-capable vehicle. */
  carBudgetCents: number
  /** How the payback splits between the two revenue engines. Must sum to 1. */
  repaymentMix: { workshops: number; books: number }
  /** Months Wendell is committing to pay it back within. */
  repaymentMonths: number

  // ── The print run ──────────────────────────────────────────────────────────
  /** Total copies in the run. */
  printRunUnits: number
  /** Copies held back to sell hand-to-hand at conferences + in-person events. */
  unitsHeldForEvents: number
  /** TODO(wendell): per-unit print cost at this run size. */
  printUnitCostCents: number
  /** TODO(wendell): per-unit shipping/fulfillment for the mailed portion. */
  shipUnitCostCents: number
  /** Cover price of the physical book. */
  bookRetailPriceCents: number

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
  carBudgetCents: 12_000_00,
  repaymentMix: { workshops: 0.5, books: 0.5 },
  repaymentMonths: 18,

  printRunUnits: 500,
  unitsHeldForEvents: 200,
  printUnitCostCents: 6_50,
  shipUnitCostCents: 4_75,
  bookRetailPriceCents: 28_00,

  workshopSeatPriceCents: 150_00,
  workshopSeatsPerRun: 12,
  workshopNetMargin: 0.7,

  adMonthlyBudgetCents: 500_00,
  dream100Target: 100,

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
  }
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
  const principalCents = i.carBudgetCents
  const fromWorkshopsCents = round(principalCents * i.repaymentMix.workshops)
  const fromBooksCents = principalCents - fromWorkshopsCents

  const { netPerRunCents } = workshopEconomics(i)
  const { landedUnitCostCents } = printEconomics(i)
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
    booksAvailable: i.printRunUnits,
    withinCapacity: booksNeeded <= i.printRunUnits,
  }
}

export interface CampaignTotals {
  /** Everything the campaign needs funded, added up. */
  capitalNeededCents: number
  /** Line items behind that total. */
  lines: { key: string; label: string; cents: number; estimate: boolean }[]
}

export function campaignTotals(i: CampaignInputs = INPUTS): CampaignTotals {
  const print = printEconomics(i)
  const lines = [
    { key: 'carBudgetCents', label: 'The car', cents: i.carBudgetCents },
    { key: 'printUnitCostCents', label: `Print run (${i.printRunUnits} copies)`, cents: print.printTotalCents },
    { key: 'shipUnitCostCents', label: `Shipping (${print.unitsForFulfillment} mailed)`, cents: print.shipTotalCents },
    { key: 'adMonthlyBudgetCents', label: 'Ads (3-month test)', cents: i.adMonthlyBudgetCents * 3 },
    { key: 'nonprofitFilingCents', label: 'Nonprofit filing + first year', cents: i.nonprofitFilingCents },
  ].map((l) => ({ ...l, estimate: UNCONFIRMED.has(l.key) }))

  return {
    capitalNeededCents: lines.reduce((sum, l) => sum + l.cents, 0),
    lines,
  }
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
