import { listSpatialMaps } from '@/actions/spatial-maps'
import Link from 'next/link'
import { CreateMapForm } from './CreateMapForm'

/**
 * @page /admin/maps
 * @entity SYSTEM
 * @description Create and manage tile-based spatial maps for campaign regions, encounter spaces, and lobby navigation
 * @permissions admin
 * @relationships CONTAINS (map rooms with anchors)
 * @dimensions WHO:admin, WHAT:SYSTEM, WHERE:mapType, PERSONAL_THROUGHPUT:grow-up
 * @example /admin/maps
 * @agentDiscoverable false
 */
export default async function AdminMapsPage() {
  const maps = await listSpatialMaps()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Spatial Maps</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Tile-based maps for campaign regions, encounter spaces, and lobby navigation. Spatial rooms link to graph nodes.
        </p>
      </div>

      <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Create Map</h2>
        <CreateMapForm />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Maps ({maps.length})</h2>
        {maps.length === 0 ? (
          <p className="text-zinc-500 text-sm">No maps yet. Create one above.</p>
        ) : (
          <ul className="space-y-2">
            {maps.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-lg p-4"
              >
                <div>
                  <span className="font-medium text-white">{m.name}</span>
                  <span className="ml-2 text-xs text-zinc-500">({m.mapType})</span>
                  <span className="ml-2 text-xs text-zinc-500">{m.rooms.length} rooms</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/maps/${m.id}/editor`}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Editor
                  </Link>
                  <Link
                    href={`/admin/maps/${m.id}`}
                    className="text-sm text-zinc-500 hover:text-zinc-400"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-zinc-600">
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-400">
          ← Back to Admin
        </Link>
      </p>
    </div>
  )
}
