import { getSpatialMap } from '@/actions/spatial-maps'
import { dbBase } from '@/lib/db'
import { slugify } from '@/lib/spatial-world/utils'
import { MapEditorClient } from '@/components/spatial-map-editor/MapEditorClient'
import { notFound } from 'next/navigation'

export default async function MapEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const map = await getSpatialMap(id)
  if (!map) notFound()

  const roomsWithAnchors = await dbBase.mapRoom.findMany({
    where: { mapId: id },
    include: { anchors: true },
    orderBy: { sortOrder: 'asc' },
  })

  const rooms = roomsWithAnchors.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug || slugify(r.name),
  }))

  const initialAnchors = roomsWithAnchors.flatMap(r =>
    r.anchors.map(a => ({
      id: a.id,
      roomId: a.roomId,
      anchorType: a.anchorType,
      tileX: a.tileX,
      tileY: a.tileY,
      label: a.label,
      linkedId: a.linkedId,
      linkedType: a.linkedType,
      config: a.config,
    }))
  )

  return (
    <MapEditorClient
      mapId={map.id}
      mapName={map.name}
      initialRealmData={map.realmData}
      rooms={rooms}
      initialAnchors={initialAnchors}
    />
  )
}
