import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import { getActiveInstance } from '@/actions/instance'
import { drawDailyHand, getActorHand } from '@/actions/bar-deck'
import { DailyHandClient } from './DailyHandClient'
import type { BoundCard } from '@/features/bar-system/types'

export default async function DailyHandPage() {
  const { playerId } = await getCurrentPlayerSafe()
  if (!playerId) redirect('/login')

  const instance = await getActiveInstance()
  if (!instance) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <p className="text-zinc-400">No active campaign. Set an instance to use the daily hand.</p>
        <Link href="/" className="mt-4 text-purple-400 hover:text-purple-300">
          ← Dashboard
        </Link>
      </div>
    )
  }

  const drawResult = await drawDailyHand(playerId, instance.id)
  if ('error' in drawResult) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <p className="text-red-400">{drawResult.error}</p>
        <Link href="/" className="mt-4 text-purple-400 hover:text-purple-300">
          ← Dashboard
        </Link>
      </div>
    )
  }

  const handResult = await getActorHand(playerId, instance.id)
  const hand: BoundCard[] = 'success' in handResult ? handResult.hand : []

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-5xl mx-auto">
      <header className="mb-8">
        <Link href="/hand" className="text-zinc-500 hover:text-white text-sm">
          ← Quest Wallet
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">BARs Deck</h1>
        <p className="text-zinc-400 mt-1">
          Your 7 cards for {instance.name}. Draw once per day. Play to advance.
        </p>
        <div className="flex gap-4 mt-4">
          <Link
            href="/campaign/board"
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            Campaign Gameboard →
          </Link>
        </div>
      </header>

      <DailyHandClient
        hand={hand}
        instanceId={instance.id}
        instanceName={instance.name}
        playerId={playerId}
      />
    </div>
  )
}
