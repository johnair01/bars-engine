import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'

export default async function DojosPage() {
  const { playerId } = await getCurrentPlayerSafe()
  if (!playerId) redirect('/login')

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/game-map" className="text-sm text-zinc-500 hover:text-white transition">
            ← Game Map
          </Link>
          <div className="text-[11px] uppercase tracking-[0.16em] font-mono text-zinc-600">
            Schools / Dojos
          </div>
        </div>

        <div className="rounded-xl border border-purple-800/50 bg-purple-950/20 p-8 sm:p-12 text-center space-y-6">
          <div className="text-5xl">🏯</div>
          <h1 className="text-2xl font-bold text-white">
            Schools / Dojos
          </h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Game Master Schools and developmental quests are coming soon. This is where you Grow Up—build skill capacity.
          </p>
          <Link
            href="/game-map"
            className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg transition-colors"
          >
            Back to Game Map
          </Link>
        </div>
      </div>
    </div>
  )
}
