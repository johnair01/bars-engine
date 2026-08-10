'use client'
import { useState, useTransition } from 'react'
import { captureBookTourHelpInterest } from '@/actions/book-tour-help'
import Link from 'next/link'
import { BOOK_TOUR_HELP_OPTIONS } from '@/lib/mastering-allyship/book-tour-help'
import { campaignForHelpOptions, CAMPAIGN_UNLOCK } from '@/lib/campaigns/twenty-one-day'
import type { BookTourHelpState } from '@/lib/mastering-allyship/book-tour-help-state'
const inputClass = 'min-h-11 w-full rounded-xl border border-zinc-700 bg-[#111110] px-4 text-sm text-[#e8e6e0] placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none'
export function BookTourHelpForm() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [location, setLocation] = useState(''); const [helpTypes, setHelpTypes] = useState<string[]>([]); const [note, setNote] = useState(''); const [consent, setConsent] = useState(false); const [state, setState] = useState<BookTourHelpState | null>(null); const [pending, startTransition] = useTransition()
  const toggle = (key: string) => setHelpTypes((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  // The confirmation names the campaign they just entered rather than thanking
  // them for a form submission. Same options, same routes — what changed is that
  // the next twenty-one days are legible at the moment of signing up.
  if (state?.ok) {
    const campaign = campaignForHelpOptions(helpTypes)
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-700/60 bg-emerald-950/30 p-5 sm:p-6">
        <p className="text-sm font-semibold text-emerald-100">{state.message}</p>
        {campaign ? (
          <>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                You just entered · {campaign.label}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">{campaign.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{campaign.blurb}</p>
            </div>
            <ol className="space-y-2">
              {campaign.weeks.map((week) => (
                <li key={week.n} className="flex gap-3 text-sm text-zinc-300">
                  <span className="font-mono text-xs tabular-nums text-zinc-500">W{week.n}</span>
                  <span className="leading-relaxed">{week.move}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm leading-relaxed text-zinc-400">{CAMPAIGN_UNLOCK}</p>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-300">
            Attending is not one of the twenty-one-day campaigns.{' '}
            <Link href="/campaigns" className="text-emerald-200 underline underline-offset-4">
              The four doors are here
            </Link>{' '}
            if you want one.
          </p>
        )}
      </div>
    )
  }
  return <form onSubmit={(event) => { event.preventDefault(); startTransition(async () => setState(await captureBookTourHelpInterest({ name, email, location, helpTypes, note, consent }))) }} className="space-y-5 rounded-2xl border border-zinc-800 bg-black/40 p-5 sm:p-6">
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-zinc-100">Name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={`${inputClass} mt-2`} placeholder="Your name" /></label><label className="text-sm font-semibold text-zinc-100">Email <span className="text-emerald-300">*</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={`${inputClass} mt-2`} placeholder="you@email.com" /></label></div>
    <label className="block text-sm font-semibold text-zinc-100">Where are you based?<span className="mt-1 block text-xs font-normal text-zinc-500">City / region is enough.</span><input value={location} onChange={(e) => setLocation(e.target.value)} autoComplete="address-level2" className={`${inputClass} mt-2`} placeholder="Portland, OR" /></label>
    <fieldset><legend className="text-sm font-semibold text-zinc-100">How would you like to help? <span className="text-emerald-300">*</span></legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{BOOK_TOUR_HELP_OPTIONS.map((option) => <label key={option.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300 hover:border-emerald-700/70"><input type="checkbox" checked={helpTypes.includes(option.key)} onChange={() => toggle(option.key)} className="mt-1 size-4 accent-emerald-500" /><span>{option.label}</span></label>)}</div></fieldset>
    <label className="block text-sm font-semibold text-zinc-100">Anything we should know?<span className="mt-1 block text-xs font-normal text-zinc-500">Optional: a venue, contact, city, capacity, or idea.</span><textarea value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass} mt-2 min-h-28 py-3`} placeholder="Tell us what you are imagining." /></label>
    <label className="flex items-start gap-3 text-xs leading-5 text-zinc-400"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4 accent-emerald-500" /><span>I’m happy for the Book Tour team to contact me about the help I selected. We’ll use this information only to follow up about the tour.</span></label>
    {state && !state.ok ? <p className="rounded-xl border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">{state.error}</p> : null}<button type="submit" disabled={pending} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-500 disabled:opacity-60">{pending ? 'Saving…' : 'I want to help the Book Tour'}</button>
  </form>
}
