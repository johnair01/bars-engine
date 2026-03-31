import { getCurrentPlayer } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getById } from '@/services/daemon-seed-service'

export default async function DaemonSeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const seed = await getById(id)
  if (!seed) notFound()
  if (seed.playerId !== player.id) notFound()

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/hand"
            className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-sm"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{seed.name}</h1>
            <span className="text-xs text-amber-400/80 uppercase tracking-wider">
              {seed.source} · L{seed.level}
            </span>
          </div>
        </div>

        <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-4">
          {seed.voice && (
            <p className="text-zinc-300 whitespace-pre-wrap">{seed.voice}</p>
          )}
          {seed.shadow && (
            <div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Shadow</span>
              <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">{seed.shadow}</p>
            </div>
          )}
          {seed.desire && (
            <div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Desire</span>
              <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">{seed.desire}</p>
            </div>
          )}
          {seed.fear && (
            <div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Fear</span>
              <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">{seed.fear}</p>
            </div>
          )}
        </section>

        {seed.sourceBar && (
          <section>
            <h2 className="text-zinc-600 uppercase tracking-widest text-xs font-bold mb-3">
              Source BAR
            </h2>
            <Link
              href={`/bars/${seed.sourceBar.id}`}
              className="block p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:border-amber-500/50 transition-colors"
            >
              <h3 className="font-medium text-white">{seed.sourceBar.title}</h3>
              {seed.sourceBar.description && (
                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{seed.sourceBar.description}</p>
              )}
              <span className="text-xs text-zinc-500 mt-2 inline-block">View BAR →</span>
            </Link>
          </section>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-zinc-500 pt-4 border-t border-zinc-800">
          <Link href="/hand" className="hover:text-white transition">Hand</Link>
          <Link href="/bars" className="hover:text-white transition">My BARs</Link>
        </div>
      </div>
    </div>
  )
}
