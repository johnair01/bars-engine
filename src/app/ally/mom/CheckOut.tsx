'use client'

import { usd } from '@/lib/family-support/financial-snapshot'
import { agreement, decisionTitle, earlierProposals, latestPerParticipant, proposerName, type SavedDecision } from '@/lib/family-support/decision-ledger'

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

const summary = (decision: SavedDecision) =>
  decision.amountCents > 0 ? `${decisionTitle(decision.fundingOption)} · ${usd(decision.amountCents)}` : decisionTitle(decision.fundingOption)

const agreementLine = {
  match: 'The latest proposals match.',
  differ: 'The latest proposals differ, which is worth a conversation.',
} as const

export function CheckOut({ decisions, viewerId, onDecision }: { decisions: SavedDecision[]; viewerId: string; onDecision: () => void }) {
  const latest = latestPerParticipant(decisions)
  const state = agreement(latest)
  const mine = latest.some((decision) => decision.participantId === viewerId)
  return <div className="mx-auto grid max-w-2xl gap-4">
    <section className="rounded-2xl border border-[#d4a017]/30 bg-[#19151f] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Check-out</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">What has been chosen</h2>
      <p className="mt-3 text-sm leading-6 text-[#c6c0ca]">Every proposal saved in this room appears here for everyone in it, newest first. A proposal starts a conversation, and any of us can save a new one.</p>
      {(state === 'match' || state === 'differ') && <p role="status" className="mt-3 text-sm font-semibold text-[#f7e0a0]">{agreementLine[state]}</p>}
    </section>
    {latest.length === 0 && <section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5">
      <p className="text-sm leading-6 text-[#e4dde8]">Nothing has been saved yet. When someone saves a proposal, it appears here.</p>
    </section>}
    {latest.map((decision) => {
      const earlier = earlierProposals(decisions, decision.participantId)
      return <section key={decision.id} className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">{proposerName(decision, viewerId)}</h3>
          <span className="rounded-full border border-[#d4a017]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#e5bf4e]">{decision.status === 'proposed' ? 'Proposed' : decision.status}</span>
        </div>
        <p className="mt-2 text-xl font-semibold text-[#e5bf4e]">{summary(decision)}</p>
        {decision.terms && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#e4dde8]">Terms or questions: {decision.terms}</p>}
        <p className="mt-2 text-xs text-[#aaa3af]">Saved {when(decision.createdAt)}</p>
        {earlier.length > 0 && <details className="mt-3 text-sm text-[#c6c0ca]">
          <summary className="cursor-pointer font-semibold text-[#d7d0da]">Earlier proposals ({earlier.length})</summary>
          <ul className="mt-2 grid gap-1">{earlier.map((item) => <li key={item.id}>{summary(item)} <span className="text-[#aaa3af]">· {when(item.createdAt)}</span></li>)}</ul>
        </details>}
      </section>
    })}
    <div className="flex flex-wrap gap-3">
      <button onClick={onDecision} className="rounded-xl bg-[#7452b8] px-5 py-3 text-sm font-semibold">{mine ? 'Change my proposal' : 'Go to the decision'}</button>
    </div>
  </div>
}
