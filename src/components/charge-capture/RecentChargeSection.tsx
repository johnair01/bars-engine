'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { run321FromCharge } from '@/actions/charge-capture'

type ChargeBar = {
  id: string
  title: string
  description: string
  createdAt: string
}

export function RecentChargeSection({ bars }: { bars: ChargeBar[] }) {
  const router = useRouter()

  const handleReflect = async (barId: string) => {
    const result = await run321FromCharge(barId)
    if ('success' in result) {
      router.push(result.redirectUrl)
    }
  }

  const handleExplore = (barId: string) => {
    router.push(`/capture/explore/${barId}`)
  }

  return (
    <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold">
          Recent Charge
        </h2>
        <Link
          href="/capture"
          className="text-xs text-purple-400 hover:text-purple-300 font-medium"
        >
          + Capture
        </Link>
      </div>
      {bars.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No charges yet.{' '}
          <Link href="/capture" className="text-purple-400 hover:text-purple-300">
            Capture one
          </Link>{' '}
          when something feels charged.
        </p>
      ) : (
      <ul className="space-y-3">
        {bars.slice(0, 5).map((bar) => (
          <li
            key={bar.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-200 truncate">{bar.title}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {new Date(bar.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={() => handleReflect(bar.id)}
                className="px-3 py-1.5 rounded-lg bg-purple-900/40 border border-purple-800/50 text-purple-200 hover:bg-purple-800/50 text-xs font-medium transition"
              >
                Reflect
              </button>
              <button
                onClick={() => handleExplore(bar.id)}
                className="px-3 py-1.5 rounded-lg bg-amber-900/40 border border-amber-800/50 text-amber-200 hover:bg-amber-800/50 text-xs font-medium transition"
              >
                Explore
              </button>
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:bg-zinc-700/50 text-xs font-medium transition"
              >
                Not now
              </Link>
            </div>
          </li>
        ))}
      </ul>
      )}
    </section>
  )
}
