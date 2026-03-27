import { getSpatialMap } from '@/actions/spatial-maps'
import { getCurrentPlayer } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { ConclaveSpaceClient } from './ConclaveSpaceClient'

/**
 * @page /conclave/space/:mapId
 * @entity SYSTEM
 * @description Shared spatial conclave space where avatars walk and make offerings
 * @permissions authenticated
 * @params mapId:string (path, required) - Spatial map identifier
 * @relationships displays spatial map with rooms and player avatars
 * @energyCost 0 (read-only view, presence tracking)
 * @dimensions WHO:playerId+playerName+avatarConfig, WHAT:SYSTEM, WHERE:conclave, ENERGY:presence, PERSONAL_THROUGHPUT:gather
 * @example /conclave/space/lobby_001
 * @agentDiscoverable false
 */
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
