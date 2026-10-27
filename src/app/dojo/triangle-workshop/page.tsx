import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-teal-950 to-zinc-950 px-5 py-10 text-zinc-100">
      <div className="mx-auto max-w-2xl rounded-2xl border border-teal-300/30 bg-zinc-950/80 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Mastering Alchemy Dojo</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Triangle Workshop</h1>
        <p className="mt-4 leading-7 text-zinc-300">
          A private practice room for making a disempowering triangle visible, finding the value worth keeping, and choosing one clean next move.
        </p>
        <section className="mt-7 rounded-xl border border-zinc-700 bg-zinc-900/70 p-5">
          <h2 className="text-lg font-medium text-teal-100">First practice</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">Name the three positions without making any one person the problem. Then look for what each position is trying to preserve.</p>
          <p className="mt-4 text-xs text-zinc-500">Triangle mapping, 8th-Ray operations, and rehearsal are the next layer of this room.</p>
        </section>
        <Link href={returnPath} className="mt-7 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500">Return to Nook</Link>
      </div>
    </main>
  )
}
