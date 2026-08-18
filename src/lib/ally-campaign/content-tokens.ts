/**
 * Ally Campaign — content tokens.
 *
 * The mechanism behind one rule: **different allies get different messaging,
 * relying on the same data.**
 *
 * Authored prose in `workstreams.ts` and `allies.ts` interpolates live figures
 * with template literals, so it always tracks `economics.ts`. Admin-authored
 * overrides could not — an override was a stored string, frozen at the moment it
 * was typed. That made the two requirements mutually exclusive: per-ally
 * messaging needed overrides, and overrides lost the shared data.
 *
 * Tokens close that. Override text carries `{{carLoan}}`; this module resolves it
 * at render from the same `economics.ts` values the authored templates use. A
 * per-ally letter can say anything it likes about the print run and still move
 * when `INPUTS.printRunUnits` changes.
 *
 * ONE REGISTRY, BOTH CONSUMERS. Everything an override may reference is declared
 * here exactly once, with the label and description the editor's palette shows.
 * A token cannot exist for the renderer and not for the palette, or vice versa.
 *
 * The companion rule — an override may never contain a *literal* number — is
 * enforced in `content-overrides.ts`, which rejects text carrying a figure that
 * should have been one of these.
 */

import {
  INPUTS,
  campaignTotals,
  printEconomics,
  repaymentPlan,
  usd,
  workshopEconomics,
  type CampaignInputs,
} from './economics'

export interface ContentToken {
  /** What an author types, without the braces. */
  key: string
  /** Short human name for the editor palette. */
  label: string
  /** What it means, in the palette. */
  description: string
  /** Rendered string. */
  resolve: (i: CampaignInputs) => string
  /**
   * The bare numeric value behind this token, when it has one. Used to catch an
   * author typing `2500` or `$2,500` instead of the token — see
   * `findLiteralFigure`. Null for tokens with no single number.
   */
  numeric: (i: CampaignInputs) => number | null
  /** Money renders with a currency symbol; counts do not. */
  kind: 'currency' | 'count'
}

/** Group headings in the editor palette. */
export type TokenGroup = 'The car' | 'The print run' | 'Reach' | 'Totals'

interface TokenDef extends ContentToken {
  group: TokenGroup
}

const TOKEN_DEFS: readonly TokenDef[] = [
  // ── The car ───────────────────────────────────────────────────────────────
  {
    key: 'carLoan',
    label: 'Car — the loan',
    description: 'What is actually being borrowed, and what the repayment schedule is built on.',
    group: 'The car',
    kind: 'currency',
    resolve: (i) => usd(i.carLoanCents),
    numeric: (i) => i.carLoanCents,
  },
  {
    key: 'carBudget',
    label: 'Car — full price',
    description: 'What the vehicle costs. May exceed the loan; the difference is self-funded.',
    group: 'The car',
    kind: 'currency',
    resolve: (i) => usd(i.carBudgetCents),
    numeric: (i) => i.carBudgetCents,
  },
  {
    key: 'monthly',
    label: 'Monthly repayment',
    description: 'The monthly figure the loan is repaid at.',
    group: 'The car',
    kind: 'currency',
    resolve: (i) => usd(repaymentPlan(i).monthlyCents),
    numeric: (i) => repaymentPlan(i).monthlyCents,
  },
  {
    key: 'repaymentMonths',
    label: 'Repayment window',
    description: 'Months the loan is repaid over.',
    group: 'The car',
    kind: 'count',
    resolve: (i) => String(i.repaymentMonths),
    numeric: (i) => i.repaymentMonths,
  },
  {
    key: 'workshopsNeeded',
    label: 'Workshops to repay',
    description: 'Workshops required to cover the workshop half of the loan.',
    group: 'The car',
    kind: 'count',
    resolve: (i) => String(repaymentPlan(i).workshopsNeeded),
    numeric: (i) => repaymentPlan(i).workshopsNeeded,
  },
  {
    key: 'booksNeeded',
    label: 'Books to repay',
    description: 'Books required to cover the book half, at the run’s blended margin.',
    group: 'The car',
    kind: 'count',
    resolve: (i) => String(repaymentPlan(i).booksNeeded),
    numeric: (i) => repaymentPlan(i).booksNeeded,
  },

  // ── The print run ─────────────────────────────────────────────────────────
  {
    key: 'printRun',
    label: 'Copies printed',
    description: 'Total copies in the run.',
    group: 'The print run',
    kind: 'count',
    resolve: (i) => String(i.printRunUnits),
    numeric: (i) => i.printRunUnits,
  },
  {
    key: 'eventCopies',
    label: 'Copies held for events',
    description: 'Copies carried to conferences and sold hand to hand.',
    group: 'The print run',
    kind: 'count',
    resolve: (i) => String(i.unitsHeldForEvents),
    numeric: (i) => i.unitsHeldForEvents,
  },
  {
    key: 'printLanded',
    label: 'Print run — landed cost',
    description: 'Printing plus shipping for the whole run.',
    group: 'The print run',
    kind: 'currency',
    resolve: (i) => usd(printEconomics(i).landedTotalCents),
    numeric: (i) => printEconomics(i).landedTotalCents,
  },
  {
    key: 'breakEven',
    label: 'Break-even copies',
    description: 'Copies that must sell to make the run whole.',
    group: 'The print run',
    kind: 'count',
    resolve: (i) => String(printEconomics(i).breakEvenUnits),
    numeric: (i) => printEconomics(i).breakEvenUnits,
  },
  {
    key: 'bookPrice',
    label: 'Cover price',
    description: 'Retail price of the physical book.',
    group: 'The print run',
    kind: 'currency',
    resolve: (i) => usd(i.bookRetailPriceCents),
    numeric: (i) => i.bookRetailPriceCents,
  },

  // ── Reach ─────────────────────────────────────────────────────────────────
  {
    key: 'dream100',
    label: 'Dream 100 target',
    description: 'Named people or organisations worth a real relationship.',
    group: 'Reach',
    kind: 'count',
    resolve: (i) => String(i.dream100Target),
    numeric: (i) => i.dream100Target,
  },
  {
    key: 'tourEvents',
    label: 'Events to book',
    description: 'Target number of tour events.',
    group: 'Reach',
    kind: 'count',
    resolve: (i) => String(i.tourEventTarget),
    numeric: (i) => i.tourEventTarget,
  },
  {
    key: 'adMonthly',
    label: 'Monthly ad budget',
    description: 'Paid-ad spend per month during the test.',
    group: 'Reach',
    kind: 'currency',
    resolve: (i) => usd(i.adMonthlyBudgetCents),
    numeric: (i) => i.adMonthlyBudgetCents,
  },
  {
    key: 'workshopSeat',
    label: 'Workshop seat price',
    description: 'Price of a single workshop seat.',
    group: 'Reach',
    kind: 'currency',
    resolve: (i) => usd(i.workshopSeatPriceCents),
    numeric: (i) => i.workshopSeatPriceCents,
  },
  {
    key: 'workshopNet',
    label: 'Workshop net',
    description: 'What one full workshop nets after venue, materials and travel.',
    group: 'Reach',
    kind: 'currency',
    resolve: (i) => usd(workshopEconomics(i).netPerRunCents),
    numeric: (i) => workshopEconomics(i).netPerRunCents,
  },

  // ── Totals ────────────────────────────────────────────────────────────────
  {
    key: 'capitalNeeded',
    label: 'Capital up front',
    description: 'Money that has to exist before any of it comes back. Never quote alone.',
    group: 'Totals',
    kind: 'currency',
    resolve: (i) => usd(campaignTotals(i).capitalNeededCents),
    numeric: (i) => campaignTotals(i).capitalNeededCents,
  },
  {
    key: 'repaid',
    label: 'Comes back to the lender',
    description: 'The portion repaid on a schedule.',
    group: 'Totals',
    kind: 'currency',
    resolve: (i) => usd(campaignTotals(i).repaidCents),
    numeric: (i) => campaignTotals(i).repaidCents,
  },
  {
    key: 'recouped',
    label: 'Comes back from sales',
    description: 'The portion recovered out of revenue.',
    group: 'Totals',
    kind: 'currency',
    resolve: (i) => usd(campaignTotals(i).recoupedCents),
    numeric: (i) => campaignTotals(i).recoupedCents,
  },
  {
    key: 'spent',
    label: 'Genuinely spent',
    description: 'The real cost of the year — the honest headline.',
    group: 'Totals',
    kind: 'currency',
    resolve: (i) => usd(campaignTotals(i).spentCents),
    numeric: (i) => campaignTotals(i).spentCents,
  },
]

export const CONTENT_TOKENS: readonly ContentToken[] = TOKEN_DEFS

const BY_KEY = new Map(TOKEN_DEFS.map((t) => [t.key, t]))

export function findToken(key: string): ContentToken | undefined {
  return BY_KEY.get(key)
}

/** Tokens grouped for the editor palette, in declaration order. */
export function tokensByGroup(
  i: CampaignInputs = INPUTS,
): { group: TokenGroup; tokens: { key: string; label: string; description: string; preview: string }[] }[] {
  const groups: TokenGroup[] = []
  for (const t of TOKEN_DEFS) if (!groups.includes(t.group)) groups.push(t.group)
  return groups.map((group) => ({
    group,
    tokens: TOKEN_DEFS.filter((t) => t.group === group).map((t) => ({
      key: t.key,
      label: t.label,
      description: t.description,
      preview: t.resolve(i),
    })),
  }))
}

// ── Rendering ───────────────────────────────────────────────────────────────

const TOKEN_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*\}\}/g

/**
 * Replace `{{token}}` with its current value.
 *
 * An UNKNOWN token is left visible rather than stripped. A page reading
 * `{{carLon}}` is obviously broken and gets fixed within the hour; a page that
 * silently swallowed it reads as a finished sentence with a hole in it, and can
 * sit wrong in front of readers indefinitely. Loud beats tidy here.
 */
export function renderTokens(text: string, i: CampaignInputs = INPUTS): string {
  return text.replace(TOKEN_RE, (whole, key: string) => {
    const token = BY_KEY.get(key)
    return token ? token.resolve(i) : whole
  })
}

/** Every token key referenced by a string, in order of appearance. */
export function tokensUsed(text: string): string[] {
  return [...text.matchAll(TOKEN_RE)].map((m) => m[1])
}

/** Referenced keys that do not exist — what the editor warns about on save. */
export function unknownTokens(text: string): string[] {
  return [...new Set(tokensUsed(text))].filter((k) => !BY_KEY.has(k))
}

// ── The no-literal-numbers invariant ────────────────────────────────────────

/** Any currency literal: `$30`, `$2,500`, `$1,234.56`. */
const CURRENCY_RE = /\$\s?\d[\d,]*(\.\d+)?/

/**
 * Below this, a bare integer is left alone.
 *
 * Small derived values collide constantly with ordinary writing — `workshopsNeeded`
 * is currently **1**, so enforcing it would reject "Chapter 1 is free", "one
 * imperfect move", "a date and 8 people". The cost of that false positive is an
 * admin who cannot write a normal sentence; the benefit of catching a stale "1"
 * is close to nothing.
 *
 * Above it, a bare integer that exactly matches a derived value is almost
 * certainly that value wearing a disguise — `500` is the print run, `251` is the
 * break-even — and those are the ones that go quietly wrong.
 *
 * KNOWN GAP, stated rather than hidden: derived counts under this threshold
 * (`repaymentMonths`, `tourEvents`, `workshopsNeeded`) are not enforced. Currency
 * is enforced at every magnitude, and currency is where the real risk lives.
 */
const MIN_ENFORCEABLE_COUNT = 25

export interface LiteralFigure {
  /** The offending text, e.g. `"$2,500"` or `"500"`. */
  found: string
  /** The token that should have been used, when one matches. */
  suggestion?: string
  reason: 'currency' | 'derived-count'
}

/**
 * Find a hard-coded figure that should have been a token.
 *
 * Two classes, deliberately different in strictness:
 *
 *  - **Any currency literal is refused.** There is no case for a dollar figure in
 *    campaign prose that should not track `economics.ts`, and the ambiguity cost
 *    of guessing is zero.
 *  - **A bare integer is refused only when it exactly matches a derived value.**
 *    "four years" and "eight people" are ordinary prose; `500` is the print run
 *    wearing a disguise, and it will be wrong the first time the run changes.
 *
 * Returns the first offence, so the error can name one concrete fix.
 */
export function findLiteralFigure(
  text: string,
  i: CampaignInputs = INPUTS,
): LiteralFigure | null {
  const currency = CURRENCY_RE.exec(text)
  if (currency) {
    const cents = Math.round(Number(currency[0].replace(/[$,\s]/g, '')) * 100)
    const match = TOKEN_DEFS.find((t) => t.kind === 'currency' && t.numeric(i) === cents)
    return { found: currency[0], suggestion: match?.key, reason: 'currency' }
  }

  // Bare integers, only where they are large enough to be unambiguous AND
  // collide with a derived count.
  for (const m of text.matchAll(/\b\d[\d,]*\b/g)) {
    const n = Number(m[0].replace(/,/g, ''))
    if (!Number.isFinite(n) || n < MIN_ENFORCEABLE_COUNT) continue
    const match = TOKEN_DEFS.find((t) => t.kind === 'count' && t.numeric(i) === n)
    if (match) return { found: m[0], suggestion: match.key, reason: 'derived-count' }
  }

  return null
}

/** The message an admin sees when they type a number instead of a token. */
export function literalFigureMessage(f: LiteralFigure): string {
  if (f.suggestion) {
    return `“${f.found}” is a live figure — write {{${f.suggestion}}} instead, so this text follows the numbers when they change.`
  }
  return `“${f.found}” is a hard-coded amount. Use a token from the palette so it stays in step with the plan.`
}
