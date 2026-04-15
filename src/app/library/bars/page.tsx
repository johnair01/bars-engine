import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import { getPublicBars } from '@/actions/library'

const TRUNCATE_LEN = 120

function truncate(s: string, len: number): string {
  if (s.length <= len) return s
  return s.slice(0, len).trim() + '…'
}

export default async function LibraryBarsPage() {
  const { playerId } = await getCurrentPlayerSafe()
  if (!playerId) redirect('/login')

  const bars = await getPublicBars()

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/library" className="text-sm text-zinc-500 hover:text-white transition">
            ← Library
          </Link>
          <div className="text-[11px] uppercase tracking-[0.16em] font-mono text-zinc-600">
            Public BARs — Wake Up
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Public BARs
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl">
            Browse BARs shared by the collective. This is for discovery—not the marketplace. Use these as inspiration or context for your own work.
          </p>
        </header>

        {bars.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
            <p className="text-sm">No public BARs yet. Create and share a BAR to contribute.</p>
            <Link href="/bars/create" className="mt-4 inline-block text-amber-400 hover:text-amber-300 text-sm font-medium">
              Create a BAR →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bars.map((bar) => (
              <Link
                key={bar.id}
                href={`/bars/${bar.id}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-amber-500/40 transition-colors group"
              >
                <h2 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {bar.title}
                </h2>
                <p className="text-sm text-zinc-400 line-clamp-2">
                  {truncate(bar.description, TRUNCATE_LEN)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  {bar.creator && (
                    <span>by {bar.creator.name}</span>
                  )}
                  {bar.allyshipDomain && (
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {bar.allyshipDomain}
                    </span>
                  )}
                  {bar.storyContent && (
                    <span className="text-zinc-600">
                      {bar.storyContent.split(',').slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/library" className="text-zinc-500 hover:text-white transition">
            ← Library
          </Link>
          <Link href="/game-map" className="text-zinc-500 hover:text-white transition">
            Game Map
          </Link>
          <Link href="/bars/create" className="text-amber-400 hover:text-amber-300 font-medium">
            Create a BAR →
          </Link>
        </div>
      </div>
    </div>
  )
}
