import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { LoginForm } from './LoginForm'
import { buildOnboardingUrl, isPublicCampaignEntryReturnTo, isSafeAppPath } from '@/lib/safe-return-to'

/**
 * @page /login
 * @entity PLAYER
 * @description Login page - email-based authentication with * 2. If already logged in, redirect home. We no longer use a standalone onboarding controller
 * behind the scenes; the dashboard handles orientation states.
 * @permissions public
 * @searchParams returnTo:string (optional) - Post-login redirect URL
 * @relationships authenticates PLAYER; incomplete profile → / unless returnTo is a public donate path
 * @energyCost 0 (authentication)
 * @dimensions WHO:playerId, WHAT:PLAYER, WHERE:auth, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /login?returnTo=/create-bar
 * @agentDiscoverable false
 */
export default async function LoginPage({
    searchParams,
}: {
    searchParams?: Promise<{ returnTo?: string }>
}) {
    const sp = searchParams ? await searchParams : {}
    const returnTo = typeof sp.returnTo === 'string' ? sp.returnTo : undefined

    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (playerId) {
        const player = await db.player.findUnique({
            where: { id: playerId },
            select: { id: true, nationId: true, archetypeId: true }
        })
        if (player) {
            const profileIncomplete = !player.nationId || !player.archetypeId
            if (profileIncomplete && !isPublicCampaignEntryReturnTo(returnTo)) {
                redirect(buildOnboardingUrl({ returnTo: returnTo && isSafeAppPath(returnTo) ? returnTo : undefined }))
            }
            redirect(returnTo && isSafeAppPath(returnTo) ? returnTo : '/')
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center">
            <LoginForm returnTo={returnTo} />
        </div>
    )
}
