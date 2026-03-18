'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { run321FromCharge } from '@/actions/charge-capture'

type ChargeBar = {
  id: string
  title: string
  description: string
  createdAt: string
}

type ArchiveItem = { id: string; title: string; createdAt: string }

export function RecentChargeSection({ todayCharge, archive = [] }: { todayCharge: ChargeBar | null; archive?: ArchiveItem[] }) {
  const [archiveOpen, setArchiveOpen] = useState(false)
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
          Today&apos;s Charge
        </h2>
        {!todayCharge && (
          <Link
            href="/capture"
            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            + Capture
          </Link>
        )}
      </div>
      {!todayCharge ? (
        <p className="text-sm text-zinc-500">
          Ready for today&apos;s charge.{' '}
          <Link href="/capture" className="text-purple-400 hover:text-purple-300">
            Capture one
          </Link>{' '}
          when something feels charged.
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-200 truncate">{todayCharge.title}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {new Date(todayCharge.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={() => handleReflect(todayCharge.id)}
                className="px-3 py-1.5 rounded-lg bg-purple-900/40 border border-purple-800/50 text-purple-200 hover:bg-purple-800/50 text-xs font-medium transition"
              >
                Reflect
              </button>
              <button
                onClick={() => handleExplore(todayCharge.id)}
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
          </div>
      )}

      {/* Archive */}
      {archive.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setArchiveOpen(!archiveOpen)}
            className="text-xs text-zinc-500 hover:text-zinc-400 transition flex items-center gap-1"
          >
            {archiveOpen ? '▼' : '▶'} Archive ({archive.length})
          </button>
          {archiveOpen && (
            <ul className="mt-2 space-y-2">
              {archive.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 py-1.5">
                  <p className="text-sm text-zinc-500 truncate flex-1">{item.title}</p>
                  <span className="text-[10px] text-zinc-600 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReflect(item.id)}
                      className="text-[10px] text-purple-400 hover:text-purple-300"
                    >
                      Reflect
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExplore(item.id)}
                      className="text-[10px] text-amber-400 hover:text-amber-300"
                    >
                      Explore
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
