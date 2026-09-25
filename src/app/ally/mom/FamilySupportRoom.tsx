'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { askBudgetLineQuestion, saveVolunteerCfoAgreement, submitFamilyFundingDecision } from '@/actions/family-support'
import { usd, type FamilyFinancialSnapshot } from '@/lib/family-support/financial-snapshot'
import { Reflection321 } from './Reflection321'
import { ScenarioExplorer } from './ScenarioExplorer'
import { PaybackPaths } from './PaybackPaths'
import { DecisionReview } from './DecisionReview'
import { CheckOut } from './CheckOut'
import { latestPerParticipant } from '@/lib/family-support/decision-ledger'
import { decisionSavedNotice, dollarsToCents, type DecisionOption } from '@/lib/family-support/decision-review'
import { BudgetQuestionThread } from './BudgetQuestionThread'
import { WeeklyReview } from './WeeklyReview'
import { AltitudeCommitment } from './AltitudeCommitment'

type RoomState = Awaited<ReturnType<typeof import('@/actions/family-support').getFamilyRoomView>>
type View = 'story' | 'decision' | 'checkout' | 'walk' | 'budget' | 'scenario' | 'payback' | 'reflection' | 'cfo' | 'review'
const label: Record<string, string> = { essential: 'Essential', experiment: 'Planned experiment', covered: 'Covered', income: 'Proposed income' }

export function FamilySupportRoom({ snapshot, state }: { snapshot: FamilyFinancialSnapshot; state: RoomState }) {
  const router = useRouter()
  const [view, setView] = useState<View>('story')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [terms, setTerms] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const savedProposals = useMemo(() => latestPerParticipant(state.decisions).length, [state.decisions])
  const openQuestions = useMemo(() => state.questions.filter((q) => q.status === 'open').length, [state.questions])
  const decide = (option: DecisionOption) => startTransition(async () => {
    const amountCents = option === 'custom' ? dollarsToCents(customAmount) : 0
    const result = await submitFamilyFundingDecision({ option, amountCents, terms })
    setNotice(result.ok ? decisionSavedNotice(option, snapshot, customAmount) : result.error ?? 'Unable to save your decision.')
    if (result.ok) { router.refresh(); setView('checkout') }
  })
  const ask = (lineItemKey: string, body: string) => startTransition(async () => {
    const result = await askBudgetLineQuestion({ lineItemKey, body })
    setNotice(result.ok ? 'Your question is now visible in the shared room.' : result.error ?? 'Unable to share your question.')
    if (result.ok) router.refresh()
  })
  return <main className="min-h-screen bg-[radial-gradient(125%_85%_at_50%_-10%,#241932_0%,#100e14_62%)] px-4 py-7 text-[#f7f2e8]">
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4a017]">Family contribution · repayable plan</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">A path to a clear decision</h1></div>
        <p className="max-w-xs text-sm leading-5 text-[#c6c0ca]">You can skip any reflection, choose no, request changes, or return to the decision at any time.</p>
      </header>
      <nav aria-label="Room sections" className="mb-6 flex flex-wrap gap-2">{([['story', 'The story'], ['decision', 'Decision now'], ['checkout', `Check-out${savedProposals ? ` · ${savedProposals} saved` : ''}`], ['budget', `Architect map${openQuestions ? ` · ${openQuestions} open` : ''}`], ['scenario', 'What if?'], ['payback', 'Payback paths'], ['reflection', 'Private 3·2·1'], ['cfo', 'Volunteer CFO'], ['review', 'Weekly review']] as [View, string][]).map(([key, title]) => <button key={key} onClick={() => setView(key)} className={`rounded-full px-4 py-2 text-sm font-medium ${view === key ? 'bg-[#7452b8] text-white' : 'border border-white/15 text-[#d7d0da]'}`}>{title}</button>)}</nav>
      {notice && <p role="status" className="mb-5 rounded-xl border border-[#d4a017]/30 bg-[#d4a017]/10 px-4 py-3 text-sm text-[#f7e0a0]">{notice}</p>}
      {view === 'story' && <StoryJourney snapshot={snapshot} onDecision={() => setView('decision')} onBudget={() => setView('budget')} onScenario={() => setView('scenario')} onReflection={() => setView('reflection')} onCfo={() => setView('cfo')} />}
      {view === 'decision' && <Decision snapshot={snapshot} customAmount={customAmount} setCustomAmount={setCustomAmount} terms={terms} setTerms={setTerms} pending={pending} onDecide={decide} onBudget={() => setView('budget')} onPayback={() => setView('payback')} />}
      {view === 'checkout' && <CheckOut decisions={state.decisions} viewerId={state.participantId} onDecision={() => setView('decision')} />}
      {view === 'walk' && <Walk onDecision={() => setView('decision')} onBudget={() => setView('budget')} />}
      {view === 'budget' && <Budget snapshot={snapshot} expanded={expanded} setExpanded={setExpanded} questions={state.questions} pending={pending} onAsk={ask} />}
      {view === 'scenario' && <ScenarioExplorer snapshot={snapshot} scenarios={state.scenarios} />}
      {view === 'payback' && <PaybackPaths snapshot={snapshot} onDecision={() => setView('decision')} onBudget={() => setView('budget')} />}
      {view === 'reflection' && <Reflection321 initial={state.myReflection} shared={state.sharedSyntheses} />}
      {view === 'cfo' && <Cfo pending={pending} onAccept={() => startTransition(async () => { await saveVolunteerCfoAgreement(); setNotice('Volunteer CFO agreement saved.'); router.refresh() })} agreements={state.agreements.length} commitments={state.altitudeCommitments} participantId={state.participantId} />}
      {view === 'review' && <WeeklyReview reviews={state.reviews} />}
    </div>
  </main>
}

type StoryBeat = {
  face: string
  title: string
  body: string
  choice: string
  aside: string
  asideTo: 'reflection' | 'budget' | 'scenario' | 'cfo'
}

// One voice throughout: Wendell, first person, to Mom and Stepdad. Every figure is read from the
// approved snapshot so this copy cannot drift from the Decision view.
// Beats 1, 2 and 4 draw on Wendell's 3·2·1 (2026-09-24). The part is left unnamed here; naming it
// (Martin) is his call to make for this room.
const storyBeats = (snapshot: FamilyFinancialSnapshot): StoryBeat[] => [
  { face: 'Shaman', title: 'The year that brought us here', body: `I finished the book, lost the tea-store job after three days, and left Portland. You know that part.\n\nHere is the part I haven't told you. There is a part of me that is small, anxious, and brave. It keeps showing up for the things it cares about even when people find them small and strange, and it has gotten smaller every time I've had to ask for help.\n\nI'm asking anyway. This week that means ${usd(snapshot.weeklyStabilizationCents)} to steady things, and then a plan for the 90 days after it.`, choice: 'Go on', aside: 'Take a private moment first (3·2·1)', asideTo: 'reflection' },
  { face: 'Sage', title: 'What we are all reaching for', body: `On the outside I'm reaching for a stable career that pays fairly for my skill and the work I've built, and for enough runway to get that work into the world. On the inside I'm reaching for peace, wonder, bliss, and triumph, in place of daily fear, shame, and the isolation of solving all of this alone.`, choice: 'That shared future makes sense', aside: 'Show me the numbers behind it', asideTo: 'budget' },
  { face: 'Challenger', title: 'The wall is real', body: `The tea-store job looked like the bridge and ended after three days. The job search is still underway. The book, coaching, events, and Flirtcraft each have real potential, and each needs time, focus, and a runway before it becomes dependable income. That runway has a ceiling: ${usd(snapshot.ninetyDayCeilingCents)} over 90 days, before any income I earn.`, choice: 'What is the way through?', aside: 'I want to test the assumptions', asideTo: 'budget' },
  { face: 'Diplomat', title: 'The epiphany: partnership', body: `I've figured a few things out and made some pretty good work. What I still need is runway to get it into the world.\n\nMy past asks have often landed as “please come save me,” because the small part of me doing the asking was bracing for the worst. This time the ask comes with the full context, a scope, and an end date, so your support becomes a partnership we both shape.`, choice: 'What would partnering look like?', aside: 'I need to name a concern first', asideTo: 'budget' },
  { face: 'Architect', title: 'The plan has more than one finish line', body: `I'm working two paths toward stability: a new job at $20 an hour or more, and coaching built into a full-time business. The book, events, Flirtcraft, and Patreon are supporting income experiments. The budget and scenario map put every assumption where you can inspect it.`, choice: 'How would this be run?', aside: 'Try a different scenario', asideTo: 'scenario' },
  { face: 'Regent', title: 'Make it a 90-day game with real governance', body: `I'm inviting you to become Volunteer CFOs: a weekly check-in on job applications, marketing, revenue, spending, and next commitments. You approve any new spending above $100 and any scaling of ads. Every dollar I earn goes toward paying down the family contribution.\n\nThe check-ins put me in touch every week, so you hear how it's going before anything breaks. Each one starts with me asking about your week, and then we get to the numbers.\n\nYou also get to say what working looks like. Tell me what you'd need to see at day 30, and I'll build the check-ins around it.`, choice: 'I am ready to see the options', aside: 'I want to negotiate the role', asideTo: 'cfo' },
  { face: 'Sage', title: 'Choose the next true step', body: `You can fund a week, a month, or 90 days; propose another shape; ask for a pause; or say no. Day 90 is an end date, and extending it takes a new yes from you.\n\nMoney is one kind of help. Reach is the other: an introduction to someone outside my circle can be worth a week of ads.\n\nWhichever you choose, the aim is shared context and an honest next move.`, choice: 'Go to the decision', aside: 'Return to the map before deciding', asideTo: 'budget' },
]

function StoryJourney({ snapshot, onDecision, onBudget, onScenario, onReflection, onCfo }: { snapshot: FamilyFinancialSnapshot; onDecision: () => void; onBudget: () => void; onScenario: () => void; onReflection: () => void; onCfo: () => void }) {
  const [beat, setBeat] = useState(0)
  const beats = storyBeats(snapshot)
  const current = beats[beat]
  const last = beat === beats.length - 1
  const advance = () => last ? onDecision() : setBeat((value) => value + 1)
  const asideRoutes = { reflection: onReflection, budget: onBudget, scenario: onScenario, cfo: onCfo }
  const aside = () => asideRoutes[current.asideTo]()
  return <div className="mx-auto max-w-2xl"><div className="mb-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[#aaa3af]"><span>The story</span><span>{beat + 1} / {beats.length}</span></div><div className="mb-5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#d4a017] transition-all" style={{ width: `${((beat + 1) / beats.length) * 100}%` }} /></div><Card><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">{current.face}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{current.title}</h2><p className="mt-5 whitespace-pre-line text-lg leading-8 text-[#e4dde8]">{current.body}</p><div className="mt-8 grid gap-3"><button onClick={advance} className="rounded-xl bg-[#7452b8] px-5 py-4 text-left text-sm font-semibold">{current.choice} <span aria-hidden="true">→</span></button><button onClick={aside} className="rounded-xl border border-white/20 px-5 py-4 text-left text-sm font-medium text-[#d7d0da]">{current.aside}</button></div><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm"><button onClick={onDecision} className="font-semibold text-[#e5bf4e]">Jump to the decision</button><button onClick={onBudget} className="font-semibold text-[#e5bf4e]">Open the Architect map</button>{beat > 0 && <button onClick={() => setBeat((value) => value - 1)} className="text-[#aaa3af]">Back</button>}</div></Card></div>
}

function Card({ children }: { children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5 shadow-xl">{children}</section> }
function Decision({ snapshot, customAmount, setCustomAmount, terms, setTerms, pending, onDecide, onBudget, onPayback }: { snapshot: FamilyFinancialSnapshot; customAmount: string; setCustomAmount: (v: string) => void; terms: string; setTerms: (v: string) => void; pending: boolean; onDecide: (o: DecisionOption) => void; onBudget: () => void; onPayback: () => void }) {
  const [review, setReview] = useState<DecisionOption | null>(null)
  const confirm = (option: DecisionOption) => { onDecide(option); setReview(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  if (review) return <DecisionReview option={review} snapshot={snapshot} customAmount={customAmount} terms={terms} pending={pending} onConfirm={() => confirm(review)} onBack={() => setReview(null)} onBudget={onBudget} onPayback={onPayback} />
  const options: ['week' | 'month' | 'ninety', string, number, string][] = [['week', 'Stabilize this week', snapshot.weeklyStabilizationCents, 'U-Haul, phone, food bridge, and debt payment.'], ['month', 'Fund one month', snapshot.monthRequestCents, 'Current approved runway, including the planned experiments.'], ['ninety', 'Fund 90 days', snapshot.ninetyDayCeilingCents, 'Current ceiling before proposed income.']]
  return <div className="grid gap-5"><Card><p className="text-sm leading-6 text-[#c6c0ca]">The ask is a family contribution intended to be paid back. Each month, revenue is recorded against it; the goal is three consecutive months at break-even without outside contribution.</p><div className="mt-4 flex flex-wrap gap-4"><button onClick={onBudget} className="text-sm font-semibold text-[#e5bf4e]">Inspect every line item →</button><a href="/ally/mom/budget" className="text-sm font-semibold text-[#e5bf4e]">Download full budget workbook →</a></div></Card><div className="grid gap-4 md:grid-cols-3">{options.map(([key, title, amount, detail]) => <Card key={key}><p className="text-xs uppercase tracking-wider text-[#d4a017]">{title}</p><p className="mt-2 text-3xl font-semibold">{usd(amount)}</p><p className="mt-3 min-h-12 text-sm leading-5 text-[#c6c0ca]">{detail}</p><button disabled={pending} onClick={() => setReview(key)} className="mt-5 w-full rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold disabled:opacity-60">Explore this option <span aria-hidden="true">→</span></button></Card>)}</div><Card><h2 className="text-lg font-semibold">Negotiate a different shape</h2><div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]"><label className="grid gap-1 text-sm">Amount<input inputMode="decimal" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="$0" className="rounded-xl border border-white/15 bg-black/20 px-3 py-2" /></label><label className="grid gap-1 text-sm">Terms or questions<textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="min-h-20 rounded-xl border border-white/15 bg-black/20 px-3 py-2" placeholder="What would make this workable?" /></label></div><div className="mt-4 flex flex-wrap gap-3"><button disabled={pending} onClick={() => setReview('custom')} className="rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold">Review my proposal</button><button disabled={pending} onClick={() => setReview('no')} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold">No financial contribution now</button></div></Card></div>
}
function Walk({ onDecision, onBudget }: { onDecision: () => void; onBudget: () => void }) { return <div className="grid gap-4"><Card><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Shaman → Challenger → Regent → Architect</p><h2 className="mt-2 text-2xl font-semibold">A path for understanding, not a trap.</h2><p className="mt-3 leading-7 text-[#c6c0ca]">You are welcome to name what this request brings up, question its assumptions, set boundaries, and decide what is workable. The Private 3·2·1 tab is an optional practice; it never unlocks the plan or pressures a yes.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={onBudget} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold">Start with questions</button><button onClick={onDecision} className="rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold">Go to Architect</button></div></Card></div> }
function Budget({ snapshot, expanded, setExpanded, questions, pending, onAsk }: { snapshot: FamilyFinancialSnapshot; expanded: string | null; setExpanded: (v: string | null) => void; questions: RoomState['questions']; pending: boolean; onAsk: (key: string, body: string) => void }) { const [draft, setDraft] = useState(''); return <div className="grid gap-4"><Card><h2 className="text-2xl font-semibold">Budget explorer</h2><p className="mt-2 text-sm leading-6 text-[#c6c0ca]">Snapshot {snapshot.version} · {snapshot.asOf}. Open a line to understand it or post a question. Questions are shared; they are not an approval or a commitment.</p></Card>{snapshot.lines.map((line) => { const isOpen = expanded === line.key; const lineQuestions = questions.filter((q) => q.lineItemKey === line.key); return <Card key={line.key}><button onClick={() => { setExpanded(isOpen ? null : line.key); setDraft('') }} className="flex w-full items-start justify-between gap-4 text-left"><span><span className="text-xs font-semibold uppercase tracking-wider text-[#d4a017]">{label[line.category]}</span><span className="mt-1 block text-lg font-semibold">{line.name}</span><span className="mt-1 block text-sm text-[#c6c0ca]">{usd(line.amountCents)} · {line.cadence}</span></span><span className="text-[#d4a017]">{isOpen ? '−' : '+'}</span></button>{isOpen && <div className="mt-5 grid gap-4 border-t border-white/10 pt-4"><dl className="grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-[#aaa3af]">Included in</dt><dd className="mt-1">{line.includedIn}</dd></div><div><dt className="text-[#aaa3af]">Why it exists</dt><dd className="mt-1 leading-5">{line.why}</dd></div><div><dt className="text-[#aaa3af]">Assumption</dt><dd className="mt-1 leading-5">{line.assumption}</dd></div></dl><div className="rounded-xl bg-black/20 p-4"><p className="text-sm font-semibold">Ask about this line</p><textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-white/15 bg-[#100e14] px-3 py-2 text-sm" placeholder="What would you like clarified or challenged?" /><button disabled={pending || draft.trim().length < 2} onClick={() => { onAsk(line.key, draft); setDraft('') }} className="mt-2 rounded-lg bg-[#7452b8] px-3 py-2 text-sm font-semibold disabled:opacity-60">Post question</button></div><BudgetQuestionThread questions={lineQuestions} /></div>}</Card> })}</div> }
function Cfo({ pending, onAccept, agreements, commitments, participantId }: { pending: boolean; onAccept: () => void; agreements: number; commitments: RoomState['altitudeCommitments']; participantId: string }) { return <Card><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Regent + Architect</p><h2 className="mt-2 text-2xl font-semibold">Volunteer Chief Financial Officer</h2><p className="mt-3 leading-7 text-[#c6c0ca]">This is an accountability role, not an unlimited obligation. It is recommended for one-month or 90-day support and is fully negotiable.</p><ul className="mt-5 grid gap-2 text-sm leading-6 text-[#e4dde8]"><li>Weekly review of spending, job search, revenue, and marketing.</li><li>Approval before new spending above $100.</li><li>Approval before an ad test scales.</li><li>Right to request a pause or revised plan.</li><li>Right to negotiate the funding structure.</li></ul><button disabled={pending} onClick={onAccept} className="mt-6 rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold disabled:opacity-60">{agreements ? 'Add my agreement' : 'Accept this role as drafted'}</button><AltitudeCommitment commitments={commitments} participantId={participantId} /></Card> }
