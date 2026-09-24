/**
 * What a reader sees between choosing a funding option and saving it. Pure helpers so the amount
 * shown in the review is always the amount that is saved.
 */
import { usd, type FamilyFinancialSnapshot } from './financial-snapshot'

export type DecisionOption = 'week' | 'month' | 'ninety' | 'custom' | 'no'

export const DECISION_TITLES: Record<DecisionOption, string> = {
  week: 'Stabilize this week',
  month: 'Fund one month',
  ninety: 'Fund 90 days',
  custom: 'Custom proposal',
  no: 'No financial contribution now',
}

/** Accepts "500", "$500", "1,250.50". Anything unreadable is 0. */
export function dollarsToCents(value: string): number {
  const parsed = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

export function decisionAmountCents(option: DecisionOption, snapshot: FamilyFinancialSnapshot, customAmount: string): number {
  if (option === 'week') return snapshot.weeklyStabilizationCents
  if (option === 'month') return snapshot.monthRequestCents
  if (option === 'ninety') return snapshot.ninetyDayCeilingCents
  if (option === 'custom') return dollarsToCents(customAmount)
  return 0
}

export function decisionSavedNotice(option: DecisionOption, snapshot: FamilyFinancialSnapshot, customAmount: string): string {
  const amount = decisionAmountCents(option, snapshot, customAmount)
  if (option === 'no') return `Saved for the room: ${DECISION_TITLES.no}.`
  return amount > 0
    ? `Saved as a proposal for the room: ${DECISION_TITLES[option]}, ${usd(amount)}.`
    : `Saved as a proposal for the room: ${DECISION_TITLES[option]}.`
}
