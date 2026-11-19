import { getCurrentPlayer } from '@/lib/auth'
import { ClaimCarry } from './ClaimCarry'

/**
 * @page /claim
 * @description Carry page for the ontology game's claim code. The code lives in the URL fragment, so no server log sees it.
 * @permissions signed-in player
 */
export default async function ClaimPage() {
  const player = await getCurrentPlayer()
  return <ClaimCarry signedIn={!!player} />
}
