import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { loadDojoHome } from '@/actions/dojo-practice'
import { DojoShell } from './dojo-shell'
import { TrianglePractice } from './triangle-practice'

function safeReturnPath(value: string | undefined): string {
  return value === '/ontology-game/between' ? value : '/ontology-game/between'
}

export default async function TriangleWorkshopPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const { returnTo } = await searchParams
  const returnPath = safeReturnPath(returnTo)
  const home = await loadDojoHome()
  if ('error' in home) redirect('/login')

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-teal-950 to-zinc-950 px-5 py-10 text-zinc-100">
      <div className="mx-auto max-w-2xl rounded-2xl border border-teal-300/30 bg-zinc-950/80 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Mastering Alchemy Dojo</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Triangle Workshop</h1>
        <p className="mt-4 leading-7 text-zinc-300">
          A school and a forge. Learn how Thought Strings work on a safe wall, or bring something alive, something you want to make, or a BAR you are tending. Nothing here needs a BAR, a spirit, or a goal.
        </p>
        <DojoShell home={home} returnPath={returnPath} />
        <details className="mt-8 rounded-xl border border-zinc-700 p-1">
          <summary className="min-h-11 cursor-pointer list-none px-4 py-3 text-sm font-medium text-teal-100">Triangle worksheet: name a pattern, keep the gold, choose a next move</summary>
          <div className="px-3 pb-3"><TrianglePractice /></div>
        </details>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/dojo/triangle-workshop/prototype" className="inline-flex rounded-lg border border-teal-300/40 px-4 py-2 text-sm font-medium text-teal-100 transition hover:bg-teal-400/10">Explore constellation-wall prototype</Link>
          <Link href={returnPath} className="inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500">Return to Nook</Link>
        </div>
      </div>
    </main>
  )
}
