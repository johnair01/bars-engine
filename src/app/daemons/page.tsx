import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPlayerDaemons } from '@/actions/daemons'
import { DaemonListClient } from './DaemonListClient'

export default async function DaemonsPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const daemons = await getPlayerDaemons(player.id)

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/"
          className="text-zinc-500 hover:text-white transition text-xs uppercase tracking-widest flex items-center gap-2 mb-8"
        >
          ← Dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Daemons</h1>
          <p className="text-zinc-400 text-sm">
            Collectible entities that extend your move set. Discover them through 321 Wake Up, summon via ritual, use their moves when completing quests.
          </p>
        </div>

        <Link
          href="/daemons/321-wake-up"
          className="block p-4 rounded-xl border border-purple-500/50 bg-purple-900/20 hover:bg-purple-900/30 transition-colors"
        >
          <div className="font-medium text-purple-300">321 Wake Up</div>
          <div className="text-sm text-zinc-500">Discover daemons through inner work</div>
        </Link>

        <DaemonListClient daemons={daemons} playerId={player.id} />
      </div>
    </div>
  )
}
