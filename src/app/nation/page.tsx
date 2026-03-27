import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * @page /nation
 * @entity PLAYER
 * @description Redirects to current player's nation page
 * @permissions authenticated
 * @relationships redirects to /nation/:id with player's nationId
 * @energyCost 0 (redirect only)
 * @dimensions WHO:playerId+nationId, WHAT:PLAYER, WHERE:nation, ENERGY:N/A, PERSONAL_THROUGHPUT:N/A
 * @example /nation → redirects to /nation/argyra
 * @agentDiscoverable false
 */
export default async function NationPage() {
    const player = await getCurrentPlayer()
    if (!player) return redirect('/')
    if (!player.nation) return redirect('/')

    return redirect(`/nation/${player.nation.id}`)
}
