'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { askBudgetLineQuestion, saveVolunteerCfoAgreement, submitFamilyFundingDecision } from '@/actions/family-support'
import { usd, type FamilyFinancialSnapshot } from '@/lib/family-support/financial-snapshot'
import { Reflection321 } from './Reflection321'
import { ScenarioExplorer } from './ScenarioExplorer'
import { BudgetQuestionThread } from './BudgetQuestionThread'
import { WeeklyReview } from './WeeklyReview'
import { AltitudeCommitment } from './AltitudeCommitment'

type RoomState = Awaited<ReturnType<typeof import('@/actions/family-support').getFamilyRoomView>>
type View = 'decision' | 'walk' | 'budget' | 'scenario' | 'reflection' | 'cfo' | 'review'
const label: Record<string, string> = { essential: 'Essential', experiment: 'Planned experiment', covered: 'Covered', income: 'Proposed income' }

export function FamilySupportRoom({ snapshot, state }: { snapshot: FamilyFinancialSnapshot; state: RoomState }) {
  const router = useRouter()
  const [view, setView] = useState<View>('decision')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [terms, setTerms] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const openQuestions = useMemo(() => state.questions.filter((q) => q.status === 'open').length, [state.questions])
  const decide = (option: 'week' | 'month' | 'ninety' | 'custom' | 'no') => startTransition(async () => {
    const amountCents = option === 'custom' ? Math.round(Number(customAmount || 0) * 100) : 0
    const result = await submitFamilyFundingDecision({ option, amountCents, terms })
    setNotice(result.ok ? 'Your decision was saved for the room.' : result.error)
    if (result.ok) router.refresh()
  })
  const ask = (lineItemKey: string, body: string) => startTransition(async () => {
    const result = await askBudgetLineQuestion({ lineItemKey, body })
    setNotice(result.ok ? 'Your question is now visible in the shared room.' : result.error)
    if (result.ok) router.refresh()
  })
  return <main className="min-h-screen bg-[radial-gradient(125%_85%_at_50%_-10%,#241932_0%,#100e14_62%)] px-4 py-7 text-[#f7f2e8]">
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4a017]">Family contribution · repayable plan</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">The room for a clear decision</h1></div>
        <p className="max-w-xs text-sm leading-5 text-[#c6c0ca]">No reflection is required. You may choose no, ask for a revision, or return to the numbers at any time.</p>
      </header>
      <nav aria-label="Room sections" className="mb-6 flex flex-wrap gap-2">{([['decision', 'Decision now'], ['walk', 'Walk through it'], ['budget', `Budget explorer${openQuestions ? ` · ${openQuestions} open` : ''}`], ['scenario', 'What if?'], ['reflection', 'Private 3·2·1'], ['cfo', 'Volunteer CFO'], ['review', 'Weekly review']] as [View, string][]).map(([key, title]) => <button key={key} onClick={() => setView(key)} className={`rounded-full px-4 py-2 text-sm font-medium ${view === key ? 'bg-[#7452b8] text-white' : 'border border-white/15 text-[#d7d0da]'}`}>{title}</button>)}</nav>
      {notice && <p role="status" className="mb-5 rounded-xl border border-[#d4a017]/30 bg-[#d4a017]/10 px-4 py-3 text-sm text-[#f7e0a0]">{notice}</p>}
      {view === 'decision' && <Decision snapshot={snapshot} customAmount={customAmount} setCustomAmount={setCustomAmount} terms={terms} setTerms={setTerms} pending={pending} onDecide={decide} onBudget={() => setView('budget')} />}
      {view === 'walk' && <Walk onDecision={() => setView('decision')} onBudget={() => setView('budget')} />}
      {view === 'budget' && <Budget snapshot={snapshot} expanded={expanded} setExpanded={setExpanded} questions={state.questions} pending={pending} onAsk={ask} />}
      {view === 'scenario' && <ScenarioExplorer snapshot={snapshot} scenarios={state.scenarios} />}
      {view === 'reflection' && <Reflection321 initial={state.myReflection} shared={state.sharedSyntheses} />}
      {view === 'cfo' && <Cfo pending={pending} onAccept={() => startTransition(async () => { const result = await saveVolunteerCfoAgreement(); setNotice(result.ok ? 'Volunteer CFO agreement saved.' : result.error); if (result.ok) router.refresh() })} agreements={state.agreements.length} commitments={state.altitudeCommitments} participantId={state.participantId} />}
      {view === 'review' && <WeeklyReview reviews={state.reviews} />}
    </div>
  </main>
}

function Card({ children }: { children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5 shadow-xl">{children}</section> }
function Decision({ snapshot, customAmount, setCustomAmount, terms, setTerms, pending, onDecide, onBudget }: { snapshot: FamilyFinancialSnapshot; customAmount: string; setCustomAmount: (v: string) => void; terms: string; setTerms: (v: string) => void; pending: boolean; onDecide: (o: 'week' | 'month' | 'ninety' | 'custom' | 'no') => void; onBudget: () => void }) {
  const options: ['week' | 'month' | 'ninety', string, number, string][] = [['week', 'Stabilize this week', snapshot.weeklyStabilizationCents, 'U-Haul, phone, food bridge, and debt payment.'], ['month', 'Fund one month', snapshot.monthRequestCents, 'Current approved runway, including the planned experiments.'], ['ninety', 'Fund 90 days', snapshot.ninetyDayCeilingCents, 'Current ceiling before proposed income.']]
  return <div className="grid gap-5"><Card><p className="text-sm leading-6 text-[#c6c0ca]">The ask is a family contribution intended to be paid back. Each month, revenue is recorded against it; the goal is three consecutive months at break-even without outside contribution.</p><div className="mt-4 flex flex-wrap gap-4"><button onClick={onBudget} className="text-sm font-semibold text-[#e5bf4e]">Inspect every line item →</button><a href="/ally/mom/budget" className="text-sm font-semibold text-[#e5bf4e]">Download full budget workbook →</a></div></Card><div className="grid gap-4 md:grid-cols-3">{options.map(([key, title, amount, detail]) => <Card key={key}><p className="text-xs uppercase tracking-wider text-[#d4a017]">{title}</p><p className="mt-2 text-3xl font-semibold">{usd(amount)}</p><p className="mt-3 min-h-12 text-sm leading-5 text-[#c6c0ca]">{detail}</p><button disabled={pending} onClick={() => onDecide(key)} className="mt-5 w-full rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold disabled:opacity-60">Choose this</button></Card>)}</div><Card><h2 className="text-lg font-semibold">Negotiate a different shape</h2><div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]"><label className="grid gap-1 text-sm">Amount<input inputMode="decimal" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="$0" className="rounded-xl border border-white/15 bg-black/20 px-3 py-2" /></label><label className="grid gap-1 text-sm">Terms or questions<textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="min-h-20 rounded-xl border border-white/15 bg-black/20 px-3 py-2" placeholder="What would make this workable?" /></label></div><div className="mt-4 flex flex-wrap gap-3"><button disabled={pending} onClick={() => onDecide('custom')} className="rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold">Save custom proposal</button><button disabled={pending} onClick={() => onDecide('no')} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold">No financial contribution now</button></div></Card></div>
}
function Walk({ onDecision, onBudget }: { onDecision: () => void; onBudget: () => void }) { return <div className="grid gap-4"><Card><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Shaman → Challenger → Regent → Architect</p><h2 className="mt-2 text-2xl font-semibold">A path for understanding, not a trap.</h2><p className="mt-3 leading-7 text-[#c6c0ca]">You are welcome to name what this request brings up, question its assumptions, set boundaries, and decide what is workable. The Private 3·2·1 tab is an optional practice; it never unlocks the plan or pressures a yes.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={onBudget} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold">Start with questions</button><button onClick={onDecision} className="rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold">Go to Architect</button></div></Card></div> }
function Budget({ snapshot, expanded, setExpanded, questions, pending, onAsk }: { snapshot: FamilyFinancialSnapshot; expanded: string | null; setExpanded: (v: string | null) => void; questions: RoomState['questions']; pending: boolean; onAsk: (key: string, body: string) => void }) { const [draft, setDraft] = useState(''); return <div className="grid gap-4"><Card><h2 className="text-2xl font-semibold">Budget explorer</h2><p className="mt-2 text-sm leading-6 text-[#c6c0ca]">Snapshot {snapshot.version} · {snapshot.asOf}. Open a line to understand it or post a question. Questions are shared; they are not an approval or a commitment.</p></Card>{snapshot.lines.map((line) => { const isOpen = expanded === line.key; const lineQuestions = questions.filter((q) => q.lineItemKey === line.key); return <Card key={line.key}><button onClick={() => { setExpanded(isOpen ? null : line.key); setDraft('') }} className="flex w-full items-start justify-between gap-4 text-left"><span><span className="text-xs font-semibold uppercase tracking-wider text-[#d4a017]">{label[line.category]}</span><span className="mt-1 block text-lg font-semibold">{line.name}</span><span className="mt-1 block text-sm text-[#c6c0ca]">{usd(line.amountCents)} · {line.cadence}</span></span><span className="text-[#d4a017]">{isOpen ? '−' : '+'}</span></button>{isOpen && <div className="mt-5 grid gap-4 border-t border-white/10 pt-4"><dl className="grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-[#aaa3af]">Included in</dt><dd className="mt-1">{line.includedIn}</dd></div><div><dt className="text-[#aaa3af]">Why it exists</dt><dd className="mt-1 leading-5">{line.why}</dd></div><div><dt className="text-[#aaa3af]">Assumption</dt><dd className="mt-1 leading-5">{line.assumption}</dd></div></dl><div className="rounded-xl bg-black/20 p-4"><p className="text-sm font-semibold">Ask about this line</p><textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-white/15 bg-[#100e14] px-3 py-2 text-sm" placeholder="What would you like clarified or challenged?" /><button disabled={pending || draft.trim().length < 2} onClick={() => { onAsk(line.key, draft); setDraft('') }} className="mt-2 rounded-lg bg-[#7452b8] px-3 py-2 text-sm font-semibold disabled:opacity-60">Post question</button></div><BudgetQuestionThread questions={lineQuestions} /></div>}</Card> })}</div> }
function Cfo({ pending, onAccept, agreements, commitments, participantId }: { pending: boolean; onAccept: () => void; agreements: number; commitments: RoomState['altitudeCommitments']; participantId: string }) { return <Card><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Regent + Architect</p><h2 className="mt-2 text-2xl font-semibold">Volunteer Chief Financial Officer</h2><p className="mt-3 leading-7 text-[#c6c0ca]">This is an accountability role, not an unlimited obligation. It is recommended for one-month or 90-day support and is fully negotiable.</p><ul className="mt-5 grid gap-2 text-sm leading-6 text-[#e4dde8]"><li>Weekly review of spending, job search, revenue, and marketing.</li><li>Approval before new spending above $100.</li><li>Approval before an ad test scales.</li><li>Right to request a pause or revised plan.</li><li>Right to negotiate the funding structure.</li></ul><button disabled={pending} onClick={onAccept} className="mt-6 rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold disabled:opacity-60">{agreements ? 'Add my agreement' : 'Accept this role as drafted'}</button><AltitudeCommitment commitments={commitments} participantId={participantId} /></Card> }
