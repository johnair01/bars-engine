import { getSpatialMap } from '@/actions/spatial-maps'
import { getCurrentPlayer } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { ConclaveSpaceClient } from './ConclaveSpaceClient'

export default async function ConclaveSpaceMapPage({
  params,
}: {
  params: Promise<{ mapId: string }>
}) {
  const { mapId } = await params
  const player = await getCurrentPlayer()
  if (!player) redirect('/conclave')

  const map = await getSpatialMap(mapId)
  if (!map) notFound()

  return (
    <ConclaveSpaceClient
      mapId={mapId}
      mapName={map.name}
      realmData={map.realmData}
      playerId={player.id}
      playerName={player.name}
      playerAvatarConfig={player.avatarConfig}
    />
  )
}
