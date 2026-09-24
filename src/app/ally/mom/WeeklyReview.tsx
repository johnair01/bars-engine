'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveWeeklyReview } from '@/actions/family-support'
import { usd } from '@/lib/family-support/financial-snapshot'

type Review = { id: string; weekOf: string; jobApplications: number; marketingActions: number; revenueCents: number; spendingCents: number; notes: string | null; decisions: string | null; participant: { displayName: string | null } }
const today = () => new Date().toISOString().slice(0, 10)
const moneyToCents = (value: string) => Math.max(0, Math.round(Number(value || 0) * 100))

export function WeeklyReview({ reviews }: { reviews: Review[] }) {
  const router = useRouter()
  const [weekOf, setWeekOf] = useState(today)
  const [jobApplications, setJobApplications] = useState('0')
  const [marketingActions, setMarketingActions] = useState('0')
  const [revenue, setRevenue] = useState('0')
  const [spending, setSpending] = useState('0')
  const [notes, setNotes] = useState('')
  const [decisions, setDecisions] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const save = () => startTransition(async () => {
    const result = await saveWeeklyReview({ weekOf, jobApplications: Number(jobApplications || 0), marketingActions: Number(marketingActions || 0), revenueCents: moneyToCents(revenue), spendingCents: moneyToCents(spending), notes, decisions })
    setNotice(result.ok ? 'Weekly review saved for the room.' : result.error)
    if (result.ok) router.refresh()
  })
  return <div className="grid gap-4"><section className="rounded-2xl border border-[#d4a017]/30 bg-[#19151f] p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Regent rhythm</p><h2 className="mt-2 text-2xl font-semibold">Weekly review</h2><p className="mt-3 text-sm leading-6 text-[#c6c0ca]">A short shared record of job search, marketing, revenue, spending, and the next decision. This is the operating rhythm behind the Volunteer CFO role.</p></section><section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5"><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1 text-sm font-medium">Week of<input type="date" value={weekOf} onChange={(event) => setWeekOf(event.target.value)} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2" /></label><label className="grid gap-1 text-sm font-medium">Job applications<input inputMode="numeric" value={jobApplications} onChange={(event) => setJobApplications(event.target.value)} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2" /></label><label className="grid gap-1 text-sm font-medium">Marketing actions<input inputMode="numeric" value={marketingActions} onChange={(event) => setMarketingActions(event.target.value)} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2" /></label><Money label="Revenue received" value={revenue} setValue={setRevenue} /><Money label="Spending" value={spending} setValue={setSpending} /></div><label className="mt-4 grid gap-1 text-sm font-medium">What happened?<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20 rounded-xl border border-white/15 bg-black/20 px-3 py-2 font-normal" /></label><label className="mt-4 grid gap-1 text-sm font-medium">What is the next decision or commitment?<textarea value={decisions} onChange={(event) => setDecisions(event.target.value)} className="min-h-20 rounded-xl border border-white/15 bg-black/20 px-3 py-2 font-normal" /></label><button disabled={pending} onClick={save} className="mt-4 rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold disabled:opacity-60">Save weekly review</button>{notice && <p role="status" className="mt-3 text-sm text-[#f7e0a0]">{notice}</p>}</section>{reviews.length > 0 && <section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5"><h3 className="text-lg font-semibold">Review history</h3><div className="mt-3 grid gap-3">{reviews.map((review) => <article className="rounded-xl bg-black/20 p-4 text-sm" key={review.id}><p className="font-semibold">Week of {new Date(review.weekOf).toLocaleDateString()} · {review.participant.displayName || 'Room participant'}</p><p className="mt-2 text-[#d7d0da]">{review.jobApplications} applications · {review.marketingActions} marketing actions · {usd(review.revenueCents)} received · {usd(review.spendingCents)} spent</p>{review.notes && <p className="mt-3 leading-6 text-[#c6c0ca]">{review.notes}</p>}{review.decisions && <p className="mt-3 border-l-2 border-[#d4a017]/50 pl-3 leading-6">Next: {review.decisions}</p>}</article>)}</div></section>}</div>
}

function Money({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) { return <label className="grid gap-1 text-sm font-medium">{label}<input inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2" /></label> }
