'use client'

import { usd, type FamilyFinancialSnapshot } from '@/lib/family-support/financial-snapshot'
import { coachingPace, evenMix, formatRange, PAYBACK_CHANNELS, unitsToRepay } from '@/lib/family-support/payback'

const sellingNotes = [
  { title: 'Books', sells: 'Sell when strangers find them.', blocker: 'Only people in my friend group know the book exists.', doing: 'Podcasts, ad tests, and events, where I sell books alongside admission.' },
  { title: 'Coaching', sells: 'Sells when the people who need it find me.', blocker: 'Awareness. The coaching website is live and needs visitors.', doing: 'Books lead to coaching. So do the apps and tools I can run ads to: Flirtcraft, Friendcraft, and 321s.' },
  { title: 'Events', sells: 'Sell in a room of about 20.', blocker: 'Filling the room. In-person events cost a venue, and digital events cost ads.', doing: 'Admission on a $25 to $50 sliding scale, plus books at the door.' },
  { title: 'Apps and tools', sells: 'Flirtcraft, Friendcraft, 321s, and the ontology game give a stranger a first step.', blocker: 'The same reach problem: someone has to see them.', doing: 'Each one can carry ads and lead a person toward coaching.' },
] as const

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
    <section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5">
      <div className="grid gap-3">
        {PAYBACK_CHANNELS.map((channel) => <article key={channel.key} className="rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="font-semibold">{channel.label}{channel.estimate && <span className="ml-2 rounded-full border border-[#d4a017]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#e5bf4e]">Planned estimate</span>}</h3>
          <p className="mt-1 text-xs leading-5 text-[#aaa3af]">{perUnit(channel.lowCents, channel.highCents)}. {channel.basis}</p>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            {asks.map((ask) => { const range = unitsToRepay(ask.cents, channel); return <div key={ask.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#aaa3af]">{ask.label}<span className="block text-sm normal-case tracking-normal text-[#e5bf4e]">{usd(ask.cents)}</span></dt>
              <dd className="mt-1"><span className="block text-xl font-semibold">{formatRange(range)}</span><span className="block text-xs text-[#aaa3af]">{noun(range, channel.unit)}</span></dd>
            </div> })}
          </dl>
        </article>)}
        <article className="rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="font-semibold">An even mix</h3>
          <p className="mt-1 text-xs leading-5 text-[#aaa3af]">One third of each amount from books sold by hand, coaching, and events.</p>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            {asks.map((ask) => { const mix = evenMix(ask.cents); return <div key={ask.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#aaa3af]">{ask.label}<span className="block text-sm normal-case tracking-normal text-[#e5bf4e]">{usd(ask.cents)}</span></dt>
              <dd className="mt-1 text-sm leading-6">{formatRange(mix.books)} {noun(mix.books, PAYBACK_CHANNELS[0].unit)}<br />{formatRange(mix.coaching)} {noun(mix.coaching, PAYBACK_CHANNELS[2].unit)}<br />{formatRange(mix.events)} {noun(mix.events, PAYBACK_CHANNELS[3].unit)}</dd>
            </div> })}
          </dl>
        </article>
      </div>
      <div className="mt-4 grid gap-2 text-sm leading-6 text-[#c6c0ca]">
        {paceLines.map((line) => <p key={line}>{line}</p>)}
        <p className="text-xs leading-5 text-[#aaa3af]">Counts are gross receipts before taxes and before my time. Event counts run from the best case ($50 tickets) to the worst case ($25 tickets) and come before the venue cost. Books I sell at an event count toward the books rows.</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <button onClick={onDecision} className="font-semibold text-[#e5bf4e]">Go to the decision</button>
        <button onClick={onBudget} className="font-semibold text-[#e5bf4e]">Ask a question about a figure</button>
      </div>
    </section>
    <section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">What sells</p>
      <h2 className="mt-2 text-2xl font-semibold">What sells, and what stands in the way</h2>
      <p className="mt-3 text-sm leading-6 text-[#c6c0ca]">Books, coaching, and events sell the same way: someone outside my circle learns I exist, and something gives them a reason to come closer. Reach limits all three, which is why my time goes to podcasts, events, and ad tests.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {sellingNotes.map((note) => <article key={note.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
          <h3 className="font-semibold">{note.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#e4dde8]">{note.sells}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#aaa3af]">In the way</p>
          <p className="text-sm leading-6 text-[#c6c0ca]">{note.blocker}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#aaa3af]">What I am doing</p>
          <p className="text-sm leading-6 text-[#c6c0ca]">{note.doing}</p>
        </article>)}
      </div>
      <p className="mt-4 text-sm leading-6 text-[#c6c0ca]">That is also why ad spending above $100 needs your approval. Ads are the test of how cheaply strangers can be reached.</p>
    </section>
  </div>
}
