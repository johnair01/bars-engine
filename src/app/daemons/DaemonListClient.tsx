'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { summonDaemon, dismissDaemonSummon } from '@/actions/daemons'

type DaemonItem = {
  id: string
  name: string
  source: string
  level: number
  discoveredAt: Date
  summons: { id: string; expiresAt: Date; status: string }[]
}

export function DaemonListClient({
  daemons,
  playerId,
}: {
  daemons: DaemonItem[]
  playerId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSummon = (daemonId: string) => {
    startTransition(async () => {
      await summonDaemon(playerId, daemonId, 60)
      router.refresh()
    })
  }

  const handleDismiss = (summonId: string) => {
    startTransition(async () => {
      await dismissDaemonSummon(summonId)
      router.refresh()
    })
  }

  if (daemons.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
        <p className="text-zinc-500 text-sm">No daemons yet. Discover one via 321 Wake Up.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Your Daemons</h2>
      {daemons.map((p) => {
        const activeSummon = p.summons[0]
        const isActive = activeSummon && activeSummon.status === 'active' && new Date(activeSummon.expiresAt) > new Date()

        return (
          <div
            key={p.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <div className="font-medium text-white">{p.name}</div>
              <div className="text-xs text-zinc-500">
                {p.source === '321_wake_up' ? '321 Wake Up' : 'School'} · Level {p.level}
              </div>
              {isActive && activeSummon && (
                <div className="text-xs text-emerald-400 mt-1">
                  Summoned · expires {new Date(activeSummon.expiresAt).toLocaleTimeString()}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isActive && activeSummon ? (
                <button
                  type="button"
                  onClick={() => handleDismiss(activeSummon.id)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-sm disabled:opacity-50"
                >
                  Dismiss
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSummon(p.id)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-50"
                >
                  Summon
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
