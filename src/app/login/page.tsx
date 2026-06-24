import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MgaAuthForm } from '@/components/auth/MgaAuthForm'
import { isSafeAppPath } from '@/lib/safe-return-to'

/**
 * @page /login
 * @entity PLAYER
 * @description Plain MGA login — email/password, no Conclave story. Claims any
 *   pending deck-card BAR (bars_deck_pending cookie) into the account on success.
 * @permissions public
 * @searchParams returnTo:string (optional) - Post-login redirect URL
 * @relationships authenticates PLAYER; claims pending deck BAR
 * @energyCost 0 (authentication)
 * @dimensions WHO:playerId, WHAT:PLAYER, WHERE:auth, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /login?returnTo=/deck
 * @agentDiscoverable false
 */
export default async function LoginPage({
    searchParams,
}: {
    searchParams?: Promise<{ returnTo?: string }>
}) {
    const sp = searchParams ? await searchParams : {}
    const returnTo = typeof sp.returnTo === 'string' && isSafeAppPath(sp.returnTo) ? sp.returnTo : undefined

    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (playerId) {
        const player = await db.player.findUnique({ where: { id: playerId }, select: { id: true } })
        if (player) redirect(returnTo ?? '/')
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center">
            <MgaAuthForm mode="login" returnTo={returnTo} />
        </div>
    )
}
