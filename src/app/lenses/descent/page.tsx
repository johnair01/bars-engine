import Link from 'next/link'
import { redirect } from 'next/navigation'
import { loadLensesDescentState } from '@/lib/lenses/onboarding-data'
import { LensesDescentClient } from './LensesDescentClient'

export default async function LensesDescentPage() {
  const initialState = await loadLensesDescentState()
  if (!initialState) redirect('/login')

  if (initialState.parents.length === 0) {
    return (
      <main className="min-h-screen bg-[#0a0908] px-4 py-10 text-[#e8e6e0]">
        <div className="mx-auto max-w-xl space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#a855f7]">Lenses descent</p>
          <h1 className="text-3xl font-black leading-tight">Create a year frame first.</h1>
          <p className="text-sm leading-7 text-[#a09e98]">
            Quarterly, monthly, and weekly goals need a parent goal to serve.
          </p>
          <Link
            href="/lenses/onboarding"
            className="inline-flex rounded-lg bg-[#7c3aed] px-5 py-3 font-bold text-white"
          >
            Begin Lenses
          </Link>
        </div>
      </main>
    )
  }

  return <LensesDescentClient initialState={initialState} />
}

