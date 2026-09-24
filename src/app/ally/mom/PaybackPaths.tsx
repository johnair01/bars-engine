'use client'

import { usd, type FamilyFinancialSnapshot } from '@/lib/family-support/financial-snapshot'
import { coachingPace, evenMix, formatRange, PAYBACK_CHANNELS, unitsToRepay } from '@/lib/family-support/payback'

export function PaybackPaths({ snapshot, onDecision, onBudget }: { snapshot: FamilyFinancialSnapshot; onDecision: () => void; onBudget: () => void }) {
  const asks = [
    { label: 'This week', cents: snapshot.weeklyStabilizationCents },
    { label: 'One month', cents: snapshot.monthRequestCents },
    { label: '90-day ceiling', cents: snapshot.ninetyDayCeilingCents },
  ]
  const noun = (range: { max: number }, unit: { one: string; many: string }) => (range.max === 1 ? unit.one : unit.many)
  const perUnit = (low: number, high: number) => (low === high ? `${usd(low)} each` : `${usd(low)}–${usd(high)} each`)
  const paceLines = asks.slice(1).map((ask) => {
    const sessions = unitsToRepay(ask.cents, PAYBACK_CHANNELS[2]).max
    const pace = coachingPace(sessions)
    return `${ask.label}: ${sessions} sessions is ${pace.monthsAtOneClient} months at one client, or ${formatRange(pace.weeksAtCapacity)} weeks at 4–5 sessions a week.`
  })
  return <div className="grid gap-4">
    <section className="rounded-2xl border border-[#d4a017]/30 bg-[#19151f] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Payback paths</p>
      <h2 className="mt-2 text-2xl font-semibold">Ways the contribution comes back</h2>
      <p className="mt-3 text-sm leading-6 text-[#c6c0ca]">Every dollar I earn goes toward paying down the family contribution. This table counts the books, coaching sessions, or events that repay each amount, using figures from the approved budget dated {snapshot.asOf}. The counts are arithmetic, and the pace I reach decides which path comes first.</p>
    </section>
    <section className="overflow-x-auto rounded-2xl border border-white/10 bg-[#19151f]/90 p-5">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">Units needed to repay each amount, by path</caption>
        <thead><tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-[#aaa3af]">
          <th scope="col" className="pb-3 pr-4 font-semibold">Path</th>
          {asks.map((ask) => <th key={ask.label} scope="col" className="pb-3 pr-4 font-semibold">{ask.label}<span className="block text-sm normal-case tracking-normal text-[#e5bf4e]">{usd(ask.cents)}</span></th>)}
        </tr></thead>
        <tbody>
          {PAYBACK_CHANNELS.map((channel) => <tr key={channel.key} className="border-b border-white/5 align-top">
            <th scope="row" className="py-4 pr-4 font-medium">{channel.label}{channel.estimate && <span className="ml-2 rounded-full border border-[#d4a017]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#e5bf4e]">Planned estimate</span>}
              <span className="mt-1 block text-xs font-normal leading-5 text-[#aaa3af]">{perUnit(channel.lowCents, channel.highCents)}. {channel.basis}</span></th>
            {asks.map((ask) => <td key={ask.label} className="py-4 pr-4 text-lg font-semibold">{formatRange(unitsToRepay(ask.cents, channel))} <span className="text-sm font-normal text-[#aaa3af]">{noun(unitsToRepay(ask.cents, channel), channel.unit)}</span></td>)}
          </tr>)}
          <tr className="align-top">
            <th scope="row" className="py-4 pr-4 font-medium">An even mix<span className="mt-1 block text-xs font-normal leading-5 text-[#aaa3af]">One third of each amount from books sold by hand, coaching, and events.</span></th>
            {asks.map((ask) => { const mix = evenMix(ask.cents); return <td key={ask.label} className="py-4 pr-4 text-sm leading-6">{formatRange(mix.books)} {noun(mix.books, PAYBACK_CHANNELS[0].unit)}<br />{formatRange(mix.coaching)} {noun(mix.coaching, PAYBACK_CHANNELS[2].unit)}<br />{formatRange(mix.events)} {noun(mix.events, PAYBACK_CHANNELS[3].unit)}</td> })}
          </tr>
        </tbody>
      </table>
      <div className="mt-4 grid gap-2 text-sm leading-6 text-[#c6c0ca]">
        {paceLines.map((line) => <p key={line}>{line}</p>)}
        <p className="text-xs leading-5 text-[#aaa3af]">Counts are gross receipts before taxes and before my time. Event counts run from the best case ($50 tickets) to the worst case ($25 tickets) and come before venue and materials costs.</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <button onClick={onDecision} className="font-semibold text-[#e5bf4e]">Go to the decision</button>
        <button onClick={onBudget} className="font-semibold text-[#e5bf4e]">Ask a question about a figure</button>
      </div>
    </section>
  </div>
}
