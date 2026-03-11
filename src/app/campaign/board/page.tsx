import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import { getOrCreateGameboardSlots, getDeclinedAidOffersForOfferer } from '@/actions/gameboard'
import { GameboardClient } from './GameboardClient'

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

export default async function GameboardPage(props: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref: urlRef } = await props.searchParams
  const campaignRef = urlRef ?? DEFAULT_CAMPAIGN_REF

  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  if (!playerId) redirect('/login')

  const [result, declinedOffers] = await Promise.all([
    getOrCreateGameboardSlots(campaignRef),
    getDeclinedAidOffersForOfferer(playerId),
  ])
  if ('error' in result) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <p className="text-red-400">{result.error}</p>
        <Link href="/" className="mt-4 text-purple-400 hover:text-purple-300">
          ← Dashboard
        </Link>
      </div>
    )
  }

  const { slots, period, message } = result

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col font-sans tracking-tight">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
          <Link
            href="/game-map"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            ← Game Map
          </Link>
          <div className="flex gap-4">
            <Link
              href="/event"
              className="text-sm text-zinc-500 hover:text-green-400 transition-colors"
            >
              Support the Residency →
            </Link>
            <Link
              href="/campaign/twine?ref=bruised-banana"
              className="text-sm text-zinc-500 hover:text-purple-400 transition-colors"
            >
              Begin the Journey
            </Link>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Campaign Gameboard</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Complete campaign quests here. Period {period}. Each completion draws a new quest.
        </p>

        {message && (
          <div className="mb-6 p-4 bg-amber-900/20 border border-amber-800/50 rounded-xl text-amber-300 text-sm">
            {message}
          </div>
        )}

        <GameboardClient
          slots={slots}
          campaignRef={campaignRef}
          isAdmin={isAdmin}
          playerId={playerId}
          declinedOffers={declinedOffers}
        />
      </div>
    </div>
  )
}
