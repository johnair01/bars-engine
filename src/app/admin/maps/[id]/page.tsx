import { getSpatialMap } from '@/actions/spatial-maps'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function MapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const map = await getSpatialMap(id)
  if (!map) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{map.name}</h1>
        <div className="flex gap-4">
          <Link
            href={`/admin/maps/${id}/editor`}
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            Editor
          </Link>
          <Link href="/admin/maps" className="text-zinc-500 hover:text-zinc-400 text-sm">
            ← Maps
          </Link>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-4">
        <p className="text-zinc-400">
          <span className="text-zinc-500">Type:</span> {map.mapType}
        </p>
        <p className="text-zinc-400">
          <span className="text-zinc-500">Rooms:</span> {map.realmData.rooms.length}
        </p>
        <p className="text-zinc-400">
          <span className="text-zinc-500">Spawnpoint:</span>{' '}
          <code className="bg-zinc-800 px-1 rounded text-xs">
            {JSON.stringify(map.realmData.spawnpoint)}
          </code>
        </p>
        <div>
          <p className="text-zinc-500 mb-2">Rooms (graph node links):</p>
          <ul className="space-y-1">
            {map.rooms.map((r) => (
              <li key={r.id} className="text-sm text-zinc-400">
                {r.name}
                {r.graphNodeId && (
                  <span className="ml-2 text-purple-400">→ {r.graphNodeId}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
