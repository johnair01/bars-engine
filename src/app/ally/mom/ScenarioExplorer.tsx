'use client'

import { useMemo, useState, useTransition } from 'react'
import { saveBudgetScenario } from '@/actions/family-support'
import { usd, type FamilyFinancialSnapshot } from '@/lib/family-support/financial-snapshot'

type SavedScenario = { id: string; name: string | null; assumptionOverridesJson: string; calculatedTotalsJson: string; participant: { displayName: string | null } }

const integer = (value: string) => Math.max(0, Math.round(Number(value || 0) * 100))

export function ScenarioExplorer({ snapshot, scenarios }: { snapshot: FamilyFinancialSnapshot; scenarios: SavedScenario[] }) {
  const [horizonDays, setHorizonDays] = useState<7 | 30 | 90>(90)
  const [printBudget, setPrintBudget] = useState('100')
  const [adBudget, setAdBudget] = useState('400')
  const [income, setIncome] = useState('600')
  const [name, setName] = useState('')
  const [share, setShare] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const calculated = useMemo(() => {
    const baseline = horizonDays === 7 ? snapshot.weeklyStabilizationCents : horizonDays === 30 ? snapshot.monthRequestCents : snapshot.ninetyDayCeilingCents
    const months = horizonDays / 30
    const printDelta = integer(printBudget) * months - 10_000 * months
    const adBaseline = horizonDays === 90 ? 40_000 : 0
    return Math.max(0, Math.round(baseline + printDelta + integer(adBudget) - adBaseline - integer(income)))
  }, [adBudget, horizonDays, income, printBudget, snapshot])
  const save = () => startTransition(async () => {
    const result = await saveBudgetScenario({ name, horizonDays, printBudgetCents: integer(printBudget), adTestBudgetCents: integer(adBudget), expectedIncomeCents: integer(income), shared: share })
    setNotice(result.ok ? `Scenario saved. Estimated contribution: ${usd(result.familyContributionCents)}` : result.error)
  })
  return <div className="grid gap-4"><section className="rounded-2xl border border-[#d4a017]/30 bg-[#19151f] p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Architect sandbox</p><h2 className="mt-2 text-2xl font-semibold">What changes if…?</h2><p className="mt-3 text-sm leading-6 text-[#c6c0ca]">This is a scenario, not a budget edit or approval. It shows the contribution implied by these assumptions; it does not promise income or alter the official plan.</p></section><section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Horizon<select value={horizonDays} onChange={(event) => setHorizonDays(Number(event.target.value) as 7 | 30 | 90)} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2"><option value={7}>This week</option><option value={30}>One month</option><option value={90}>90 days</option></select></label><label className="grid gap-1 text-sm font-medium">Name <span className="font-normal text-[#aaa3af]">optional</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Conservative launch" className="rounded-xl border border-white/15 bg-black/20 px-3 py-2" /></label><Money label="Print budget per month" value={printBudget} setValue={setPrintBudget} /><Money label="Ad-test budget for this horizon" value={adBudget} setValue={setAdBudget} /><Money label="Expected income in this horizon" value={income} setValue={setIncome} /></div><div className="mt-5 rounded-xl bg-black/25 p-4"><p className="text-xs uppercase tracking-wider text-[#d4a017]">Estimated family contribution</p><p className="mt-1 text-3xl font-semibold">{usd(calculated)}</p><p className="mt-2 text-sm leading-6 text-[#aaa3af]">Assumes the entered income arrives. The official budget remains unchanged until a new agreement is recorded.</p></div><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} /> Share this scenario with the room</label><button disabled={pending} onClick={save} className="mt-4 rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold disabled:opacity-60">Save scenario</button>{notice && <p role="status" className="mt-3 text-sm text-[#f7e0a0]">{notice}</p>}</section>{scenarios.length > 0 && <section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5"><h3 className="text-lg font-semibold">Shared scenarios</h3><div className="mt-3 grid gap-3">{scenarios.map((scenario) => { const total = JSON.parse(scenario.calculatedTotalsJson) as { familyContributionCents: number }; return <div className="rounded-xl bg-black/20 p-3 text-sm" key={scenario.id}><p className="font-semibold">{scenario.name || 'Untitled scenario'} · {usd(total.familyContributionCents)}</p><p className="mt-1 text-xs text-[#aaa3af]">Shared by {scenario.participant.displayName || 'a room participant'}</p></div> })}</div></section>}</div>
}

function Money({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) { return <label className="grid gap-1 text-sm font-medium">{label}<input inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2" /></label> }
