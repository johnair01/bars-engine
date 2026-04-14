'use client'

import { useCallback, useEffect, useState, startTransition } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'bb-donation-demo-v1'

export type BbDemoPersisted = {
  charge: string
  phase3: string
  phase2: string
  phase1: string
}

type StepId = 'welcome' | 'charge' | 'p3' | 'p2' | 'p1' | 'done'

const INITIAL: BbDemoPersisted = {
  charge: '',
  phase3: '',
  phase2: '',
  phase1: '',
}

function load(): BbDemoPersisted {
  if (typeof window === 'undefined') return INITIAL
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL
    const p = JSON.parse(raw) as Partial<BbDemoPersisted>
    return {
      charge: typeof p.charge === 'string' ? p.charge : '',
      phase3: typeof p.phase3 === 'string' ? p.phase3 : '',
      phase2: typeof p.phase2 === 'string' ? p.phase2 : '',
      phase1: typeof p.phase1 === 'string' ? p.phase1 : '',
    }
  } catch {
    return INITIAL
  }
}

function save(data: BbDemoPersisted) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota */
  }
}

/**
 * Public Bruised Banana **donation demo** — charge + 3→2→1 prompts (session only, no server persistence).
 * Spec: `.specify/specs/bruised-banana-donation-demo-bar/spec.md`
 */
export function BbDonationDemoWizard() {
  const [data, setData] = useState<BbDemoPersisted>(INITIAL)
  const [step, setStep] = useState<StepId>('welcome')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    startTransition(() => {
      setData(load())
      setHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (hydrated) save(data)
  }, [data, hydrated])

  const update = useCallback((patch: Partial<BbDemoPersisted>) => {
    setData((d) => ({ ...d, ...patch }))
  }, [])

  const reset = useCallback(() => {
    setData(INITIAL)
    save(INITIAL)
    setStep('welcome')
  }, [])

  if (!hydrated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-zinc-500 text-sm">Loading…</div>
    )
  }

  const wikiHome = '/wiki/campaign/bruised-banana'
  const wiki321 = '/wiki/321-shadow-process'
  const donateWizard = '/event/donate/wizard?ref=bruised-banana'
  const loginInitiation = `/login?returnTo=${encodeURIComponent('/campaign/initiation?segment=player')}`

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="space-y-2 border-b border-zinc-800 pb-6">
        <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Bruised Banana · donation demo</p>
        <h1 className="text-2xl font-bold text-white">Before you give — make room for what you feel</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          This is a short ritual: name your charge about fundraisers, walk a{' '}
          <span className="text-zinc-300">three-part witness pass</span> (third → second → first person).{' '}
          <Link href={wiki321} className="text-emerald-500/90 hover:text-emerald-400 underline underline-offset-2">
            What &quot;321&quot; means
          </Link>
          . Nothing here is saved on our servers until you sign in elsewhere.
        </p>
      </header>

      {step === 'welcome' && (
        <section className="space-y-4">
          <p className="text-zinc-300 text-sm leading-relaxed">
            The <strong className="text-zinc-200">Bruised Banana</strong> residency runs on care, art, and collective support.
            If someone sent you here, they trust your honesty more than a pitch.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep('charge')}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition"
            >
              Begin
            </button>
            <Link
              href={wikiHome}
              className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition"
            >
              Read about the campaign first
            </Link>
            <Link
              href={donateWizard}
              className="px-4 py-2 rounded-xl border border-emerald-900/50 text-emerald-400/90 hover:text-emerald-300 text-sm transition"
            >
              Skip to donate
            </Link>
          </div>
        </section>
      )}

      {step === 'charge' && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Charge — fundraisers in general</h2>
          <p className="text-zinc-500 text-sm">
            Not guilt — just signal. What comes up when someone asks for money for a project like this?
          </p>
          <textarea
            value={data.charge}
            onChange={(e) => update({ charge: e.target.value })}
            rows={5}
            placeholder="Tight chest, skepticism, overwhelm, joy to help — whatever is true…"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 text-sm placeholder:text-zinc-600 focus:border-emerald-600 outline-none resize-y min-h-[120px]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={data.charge.trim().length < 3}
              onClick={() => setStep('p3')}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-semibold transition"
            >
              Continue → 3rd person
            </button>
            <button type="button" onClick={() => setStep('welcome')} className="text-sm text-zinc-500 hover:text-zinc-300">
              ← Back
            </button>
            <ExitRow wikiHome={wikiHome} donateWizard={donateWizard} />
          </div>
        </section>
      )}

      {step === 'p3' && (
        <section className="space-y-4">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">3rd person — witness</p>
          <h2 className="text-lg font-bold text-white">What do you notice?</h2>
          <p className="text-zinc-500 text-sm">Describe it as if you&apos;re watching yourself with kindness.</p>
          <textarea
            value={data.phase3}
            onChange={(e) => update({ phase3: e.target.value })}
            rows={4}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:border-emerald-600 outline-none"
          />
          <NavRow
            onBack={() => setStep('charge')}
            onNext={() => setStep('p2')}
            nextDisabled={data.phase3.trim().length < 3}
            nextLabel="Continue → 2nd person"
          />
          <ExitRow wikiHome={wikiHome} donateWizard={donateWizard} />
        </section>
      )}

      {step === 'p2' && (
        <section className="space-y-4">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">2nd person — address the feeling</p>
          <h2 className="text-lg font-bold text-white">If that part of you could speak…</h2>
          <p className="text-zinc-500 text-sm">What does it want you to hear? (Write in second person: &quot;you…&quot;)</p>
          <textarea
            value={data.phase2}
            onChange={(e) => update({ phase2: e.target.value })}
            rows={4}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:border-emerald-600 outline-none"
          />
          <NavRow
            onBack={() => setStep('p3')}
            onNext={() => setStep('p1')}
            nextDisabled={data.phase2.trim().length < 3}
            nextLabel="Continue → 1st person"
          />
          <ExitRow wikiHome={wikiHome} donateWizard={donateWizard} />
        </section>
      )}

      {step === 'p1' && (
        <section className="space-y-4">
          <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">1st person — own it</p>
          <h2 className="text-lg font-bold text-white">What&apos;s true for you now?</h2>
          <p className="text-zinc-500 text-sm">First person. No performance.</p>
          <textarea
            value={data.phase1}
            onChange={(e) => update({ phase1: e.target.value })}
            rows={4}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:border-emerald-600 outline-none"
          />
          <NavRow
            onBack={() => setStep('p2')}
            onNext={() => setStep('done')}
            nextDisabled={data.phase1.trim().length < 3}
            nextLabel="Complete this pass"
          />
          <ExitRow wikiHome={wikiHome} donateWizard={donateWizard} />
        </section>
      )}

      {step === 'done' && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-6 space-y-2">
            <h2 className="text-lg font-bold text-emerald-200">You completed this pass</h2>
            <p className="text-zinc-400 text-sm">
              Staying curious is enough. Donating, learning more, or walking away are all valid — no scoreboard here.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href={donateWizard}
              className="text-center px-5 py-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition"
            >
              Support the residency
            </Link>
            <Link
              href={wikiHome}
              className="text-center px-5 py-4 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-900/50 transition"
            >
              Learn more (wiki)
            </Link>
            <Link
              href={loginInitiation}
              className="text-center px-5 py-4 rounded-xl border border-purple-800/60 text-purple-200 hover:bg-purple-950/30 transition sm:col-span-2"
            >
              Sign in to continue campaign initiation
            </Link>
          </div>
          <p className="text-zinc-600 text-xs text-center">
            Full <strong className="text-zinc-500">321 shadow process</strong> with quest hooks lives in the app after
            sign-in: <Link href="/shadow/321" className="text-emerald-500/90 hover:text-emerald-400 underline">/shadow/321</Link>
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button type="button" onClick={reset} className="text-sm text-zinc-500 hover:text-zinc-300">
              Clear session & start over
            </button>
            <Link href={wikiHome} className="text-sm text-zinc-500 hover:text-zinc-300">
              Leave — back to wiki
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

function NavRow({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onBack: () => void
  onNext: () => void
  nextDisabled: boolean
  nextLabel: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-semibold transition"
      >
        {nextLabel}
      </button>
      <button type="button" onClick={onBack} className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Back
      </button>
    </div>
  )
}

function ExitRow({ wikiHome, donateWizard }: { wikiHome: string; donateWizard: string }) {
  return (
    <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-800/80 mt-2">
      <span className="text-xs text-zinc-600 w-full">Not now — you can leave anytime:</span>
      <Link href={wikiHome} className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2">
        Campaign wiki
      </Link>
      <Link href={donateWizard} className="text-xs text-emerald-600/80 hover:text-emerald-400 underline underline-offset-2">
        Contribution wizard
      </Link>
    </div>
  )
}
