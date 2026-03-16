import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { dbBase } from '@/lib/db'
import { slugify } from '@/lib/spatial-world/utils'

export default async function WorldPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/')

  // Find player's active instance membership
  const membership = await dbBase.instanceMembership.findFirst({
    where: { playerId: player.id },
    include: {
      instance: {
        include: {
          spatialMap: {
            include: {
              rooms: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const spatialMap = membership?.instance?.spatialMap
  const firstRoom = spatialMap?.rooms?.[0]

  if (spatialMap && firstRoom && membership) {
    const instanceSlug = membership.instance.slug
    const roomSlug = firstRoom.slug || slugify(firstRoom.name)
    redirect(`/world/${instanceSlug}/${roomSlug}`)
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-zinc-500">No world configured for your instance.</p>
        <a href="/game-map" className="text-purple-400 hover:text-purple-300 text-sm">← Back to Game Map</a>
      </div>
    </div>
  )
}
