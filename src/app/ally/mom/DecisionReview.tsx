'use client'

import { usd, type FamilyFinancialSnapshot } from '@/lib/family-support/financial-snapshot'
import { decisionAmountCents, DECISION_TITLES, type DecisionOption } from '@/lib/family-support/decision-review'
import { formatRange, PAYBACK_CHANNELS, unitsToRepay } from '@/lib/family-support/payback'

const detail: Partial<Record<DecisionOption, string>> = {
  month: 'The current approved runway, including the planned experiments.',
  ninety: 'The current ceiling, before any income I earn.',
}

const agreements: Record<'week' | 'month' | 'ninety', string[]> = {
  week: [
    'Choosing this week leaves the month and the 90 days open for a later yes.',
    'It is meant to be paid back, and every dollar I earn goes toward it.',
  ],
  month: [
    'A contribution meant to be paid back. Every dollar I earn goes toward it.',
    'You become Volunteer CFOs: a weekly check-in that starts with your week, and your approval on new spending above $100 and on scaling ads.',
    'Day 90 is an end date, and extending it takes a new yes from you.',
  ],
  ninety: [
    'A contribution meant to be paid back. Every dollar I earn goes toward it.',
    'You become Volunteer CFOs: a weekly check-in that starts with your week, and your approval on new spending above $100 and on scaling ads.',
    'Day 90 is an end date, and extending it takes a new yes from you.',
  ],
}

export function DecisionReview({ option, snapshot, customAmount, terms, pending, onConfirm, onBack, onBudget, onPayback }: {
  option: DecisionOption
  snapshot: FamilyFinancialSnapshot
  customAmount: string
  terms: string
  pending: boolean
  onConfirm: () => void
  onBack: () => void
  onBudget: () => void
  onPayback: () => void
}) {
  const amount = decisionAmountCents(option, snapshot, customAmount)
  const standard = option === 'week' || option === 'month' || option === 'ninety'
  const weekLines = option === 'week' ? snapshot.lines.filter((line) => line.includedIn.includes('weekly')) : []
  const [hand, , coaching, events] = PAYBACK_CHANNELS
  const confirmLabel = option === 'no' ? 'Save my answer' : standard ? 'Save this as my proposal' : 'Save my proposal'
  return <section className="mx-auto grid max-w-2xl gap-5 rounded-2xl border border-white/10 bg-[#19151f]/90 p-5 shadow-xl">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Look closer before you decide</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{DECISION_TITLES[option]}{amount > 0 && <span className="text-[#e5bf4e]"> · {usd(amount)}</span>}</h2>
    </div>
    {standard && <>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#aaa3af]">What it covers</h3>
        {option === 'week'
          ? <ul className="mt-2 grid gap-1 text-sm leading-6 text-[#e4dde8]">{weekLines.map((line) => <li key={line.key}>{line.name}: {usd(line.amountCents)}</li>)}</ul>
          : <p className="mt-2 text-sm leading-6 text-[#e4dde8]">{detail[option]} <button onClick={onBudget} className="font-semibold text-[#e5bf4e]">See every line item →</button></p>}
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#aaa3af]">How it comes back</h3>
        <p className="mt-2 text-sm leading-6 text-[#e4dde8]">Repaying {usd(amount)} takes about {formatRange(unitsToRepay(amount, hand))} books sold by hand, or {formatRange(unitsToRepay(amount, coaching))} coaching sessions, or {formatRange(unitsToRepay(amount, events))} {unitsToRepay(amount, events).max === 1 ? 'event' : 'events'}. <button onClick={onPayback} className="font-semibold text-[#e5bf4e]">See every payback path →</button></p>
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#aaa3af]">What you would be agreeing to</h3>
        <ul className="mt-2 grid list-disc gap-2 pl-5 text-sm leading-6 text-[#e4dde8]">{agreements[option].map((line) => <li key={line}>{line}</li>)}</ul>
      </div>
    </>}
    {option === 'custom' && <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#aaa3af]">Your proposal</h3>
      <p className="mt-2 text-sm leading-6 text-[#e4dde8]">Amount: {amount > 0 ? usd(amount) : 'to be discussed'}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#e4dde8]">Terms or questions: {terms.trim() || 'to be discussed'}</p>
    </div>}
    {option === 'no' && <p className="text-sm leading-6 text-[#e4dde8]">This records a no for now. An introduction to someone outside my circle is still a way to help.</p>}
    <p className="text-sm leading-6 text-[#c6c0ca]">Saving records this as a proposal for the room. You can save a different proposal afterward.</p>
    <div className="flex flex-wrap gap-3">
      <button disabled={pending} onClick={onConfirm} className="rounded-xl bg-[#7452b8] px-5 py-3 text-sm font-semibold disabled:opacity-60">{confirmLabel}</button>
      <button onClick={onBack} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-[#d7d0da]">Back to the options</button>
    </div>
  </section>
}
