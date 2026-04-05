'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { VibeulonMapData, VibeulonTimeWindow } from '@/actions/vibeulon-map'

const TIME_OPTIONS: { value: VibeulonTimeWindow; label: string }[] = [
  { value: null, label: 'All time' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

export function VibeulonMapClient({
  data,
  timeWindow,
}: {
  data: VibeulonMapData
  timeWindow: VibeulonTimeWindow
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTimeChange = (value: VibeulonTimeWindow) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) {
      params.delete('days')
    } else {
      params.set('days', String(value))
    }
    router.push(`/map?${params.toString()}`)
  }

  if (data.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <p className="text-zinc-500 mb-4">
          No vibeulon activity yet.
          {!data.isAdmin && ' Complete quests to see your energy flow!'}
        </p>
        <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm">
          ← Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Time:</span>
          <select
            value={timeWindow ?? 'all'}
            onChange={(e) =>
              handleTimeChange(e.target.value === 'all' ? null : (Number(e.target.value) as VibeulonTimeWindow))
            }
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? 'all'}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-green-400 font-mono">
          {data.totalEarned} ⓥ in period
        </span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {data.rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="text-white font-medium">{row.playerName}</span>
                <span className="text-zinc-500"> earned </span>
                <span className="text-green-400 font-mono">{row.amount} ⓥ</span>
                <span className="text-zinc-500"> for </span>
                <span className="text-zinc-300 truncate" title={row.forWhat}>
                  {row.forWhat}
                </span>
              </div>
              <div className="text-xs text-zinc-600 shrink-0">
                {new Date(row.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-zinc-800">
        <Link href="/wallet" className="text-purple-400 hover:text-purple-300 text-sm">
          ← Wallet
        </Link>
      </div>
    </div>
  )
}
