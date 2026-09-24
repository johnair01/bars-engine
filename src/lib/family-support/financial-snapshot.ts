/**
 * The browser receives only this explicit, reviewable snapshot. It must never
 * receive bank credentials or raw transaction history.
 */
export type BudgetLine = {
  key: string
  name: string
  category: 'essential' | 'experiment' | 'covered' | 'income'
  amountCents: number
  cadence: string
  includedIn: string
  why: string
  assumption: string
}

export const FAMILY_FINANCIAL_SNAPSHOT = {
  version: '2026-09-23-v1',
  asOf: 'September 23, 2026',
  weeklyStabilizationCents: 50_000,
  monthRequestCents: 220_476,
  ninetyDayCeilingCents: 661_428,
  lines: [
    {
      key: 'uhaul', name: 'U-Haul', category: 'essential', amountCents: 9_000,
      cadence: 'one-time this week', includedIn: 'weekly stabilization',
      why: 'An immediate transportation/storage obligation.', assumption: 'Current bill: $90.',
    },
    {
      key: 'phone', name: 'Phone', category: 'essential', amountCents: 6_000,
      cadence: 'monthly', includedIn: 'weekly, month, and 90-day runway',
      why: 'Keeps job search, client work, and family contact available.', assumption: 'Current bill: $60/month.',
    },
    {
      key: 'food', name: 'Food bridge', category: 'essential', amountCents: 10_000,
      cadence: 'this week', includedIn: 'weekly stabilization',
      why: 'A buffer if food-stamp eligibility changes.', assumption: 'Food stamps currently provide about $300/month; this is not counted as permanent.',
    },
    {
      key: 'debt', name: 'Debt payment', category: 'essential', amountCents: 25_000,
      cadence: 'this week', includedIn: 'weekly stabilization',
      why: 'Prevents an immediate debt obligation from compounding.', assumption: 'Current payment: $250.',
    },
    {
      key: 'printing', name: 'Book printing', category: 'experiment', amountCents: 10_000,
      cadence: 'monthly cap', includedIn: 'month and 90-day runway',
      why: 'Creates physical inventory for signed direct sales and Kickstarter fulfillment.', assumption: '$5.60 per copy plus shipping; half for Kickstarter, half for new sales.',
    },
    {
      key: 'fulfillment', name: 'Kickstarter packing & shipping', category: 'experiment', amountCents: 1_040,
      cadence: 'per shipped book', includedIn: 'month and 90-day runway',
      why: 'Covers fulfilment for the Kickstarter-reserved half of the print run.', assumption: '$10.40 per shipped book.',
    },
    {
      key: 'ads', name: 'Advertising tests', category: 'experiment', amountCents: 40_000,
      cadence: '90-day test budget', includedIn: '90-day runway',
      why: 'Find acquisition costs and which offers move the needle before scaling.', assumption: 'Any spend above $100 or scaling needs Volunteer CFO approval.',
    },
    {
      key: 'coaching', name: 'Confirmed coaching', category: 'income', amountCents: 60_000,
      cadence: 'next month', includedIn: 'proposed income, not funding need',
      why: 'One active client for four weekly sessions.', assumption: '$150/session × four sessions; capacity is 4–5 weekly clients.',
    },
  ] satisfies BudgetLine[],
} as const

export type FamilyFinancialSnapshot = typeof FAMILY_FINANCIAL_SNAPSHOT

export const usd = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
