import Link from 'next/link'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requestGameFork } from '@/actions/fork-game'

/**
 * @page /fork-game
 * @entity SYSTEM
 * @description Fork game BAR - request export of instance config for self-hosted deployment
 * @permissions authenticated
 * @relationships creates InstanceExportRequest for default instance, links to fork wizard and guide
 * @energyCost variable (completing fork BAR awards vibulon)
 * @dimensions WHO:playerId, WHAT:SYSTEM, WHERE:fork, ENERGY:fork_resistance, PERSONAL_THROUGHPUT:show_up
 * @example /fork-game
 * @agentDiscoverable false
 */
export default async function ForkGamePage() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/login')

  // Get the active (first) instance as default fork target
  const defaultInstance = await db.instance.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, slug: true },
  })

  // Check if player already has a pending request
  const existingRequest = defaultInstance
    ? await db.instanceExportRequest.findFirst({
        where: {
          instanceId: defaultInstance.id,
          requestedByPlayerId: playerId,
          status: 'pending',
        },
      })
    : null

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Brave Act of Resistance</p>
          <h1 className="text-2xl font-bold text-white">Fork This Game</h1>
          <p className="text-zinc-400 text-sm">
            Deploy your own copy of the BARs Engine. When you complete this BAR, you&apos;ll have
            your own game running on your own server.
          </p>
        </header>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">What forking means</h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex gap-2">
              <span className="text-emerald-500 mt-0.5">1.</span>
              You get your own copy of the BARs Engine codebase on GitHub.
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 mt-0.5">2.</span>
              You deploy it to Vercel with your own database.
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 mt-0.5">3.</span>
              You import a config bundle from this instance as your starting point.
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 mt-0.5">4.</span>
              Your game, your rules — run your own birthday campaigns, community events, or projects.
            </li>
          </ul>
        </div>

        {defaultInstance ? (
          <div className="space-y-3">
            {existingRequest ? (
              <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
                <p className="text-sm text-amber-300 font-medium">Fork request pending</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Your request to fork <span className="text-zinc-300">{defaultInstance.name}</span>{' '}
                  is waiting for host approval.
                </p>
              </div>
            ) : (
              <form
                action={async () => {
                  'use server'
                  await requestGameFork(defaultInstance.id)
                }}
              >
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-emerald-800/40 border border-emerald-700/50 text-emerald-300 text-sm font-medium hover:bg-emerald-700/40 transition"
                >
                  Request fork of {defaultInstance.name} →
                </button>
              </form>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No instances available to fork.</p>
        )}

        <div className="flex gap-3">
          <Link
            href="/wiki/fork-your-instance"
            className="flex-1 py-2.5 text-center rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition"
          >
            Read the fork guide →
          </Link>
          <Link
            href="/fork-wizard"
            className="flex-1 py-2.5 text-center rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition"
          >
            Start fork wizard →
          </Link>
        </div>
      </div>
    </div>
  )
}
