import { listSpatialMaps } from '@/actions/spatial-maps'
import { getCurrentPlayer } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ConclaveSpacePage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/conclave')

  const maps = await listSpatialMaps()
  const lobbyMaps = maps.filter((m) => m.mapType === 'lobby')
  const displayMaps = lobbyMaps.length > 0 ? lobbyMaps : maps

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-bold text-white">The Conclave</h1>
        <p className="text-zinc-400 text-sm mt-1">
          A shared space where avatars walk and offerings are made.
        </p>
      </header>

      {displayMaps.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">No spaces available yet.</p>
          <p className="text-zinc-600 text-sm mt-2">
            An admin can create spatial maps in Admin → Maps.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {displayMaps.map((m) => (
            <li key={m.id}>
              <Link
                href={`/conclave/space/${m.id}`}
                className="block bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-purple-600/50 transition"
              >
                <span className="font-medium text-white">{m.name}</span>
                <span className="ml-2 text-xs text-zinc-500">({m.mapType})</span>
                <span className="ml-2 text-xs text-zinc-500">{m.rooms.length} rooms</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-zinc-600">
        <Link href="/" className="text-zinc-500 hover:text-zinc-400">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  )
}
