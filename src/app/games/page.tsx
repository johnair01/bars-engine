import Link from 'next/link'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

/**
 * @page /games
 * @entity PLAYER
 * @description Home Screen for the playable games: sign in once, then open a game. Admin sits at the bottom.
 * @permissions public (shows sign-in when no player is signed in)
 * @example /games
 * @agentDiscoverable false
 */
export const dynamic = 'force-dynamic'

const GAMES = [
  { href: '/ontology-game/between', title: 'The Between', blurb: 'A garden two people tend together, in a hollow under a great tree.' },
]

export default async function GamesHome() {
  const id = (await cookies()).get('bars_player_id')?.value
  const player = id ? await db.player.findUnique({ where: { id }, select: { id: true, name: true } }).catch(() => null) : null

  return (
    <main className="min-h-screen bg-black text-zinc-200 px-4 py-10 max-w-md mx-auto flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Games</h1>
        <p className="text-zinc-400 text-sm mt-1">{player ? `Signed in as ${player.name}.` : 'Sign in to open a game.'}</p>
      </header>

      {!player && (
        <section className="flex flex-col gap-3">
          <Link href="/login?returnTo=%2Fgames" className="rounded-lg bg-emerald-600 text-white text-center py-3 font-semibold">Sign in</Link>
          <Link href="/conclave" className="rounded-lg border border-zinc-700 text-center py-3">New here? Make an account</Link>
        </section>
      )}

      <section className="flex flex-col gap-3">
        {GAMES.map(g => (
          <Link key={g.href} href={g.href} className="rounded-lg border border-zinc-700 p-4 block">
            <span className="block font-semibold text-white">{g.title}</span>
            <span className="block text-sm text-zinc-400 mt-1">{g.blurb}</span>
          </Link>
        ))}
      </section>

      <footer className="mt-auto pt-8 text-sm text-zinc-500 flex gap-4">
        <Link href="/admin" className="underline">Admin</Link>
      </footer>
    </main>
  )
}
