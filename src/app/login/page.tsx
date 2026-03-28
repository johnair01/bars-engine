import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { LoginForm } from './LoginForm'
import { buildOnboardingUrl, isSafeAppPath } from '@/lib/safe-return-to'

/**
 * Donate wizard + self-report are usable without nation/playbook; do not trap those URLs
 * behind /conclave/onboarding or players loop: login → onboarding → … → login?returnTo=donate.
 */
function isDonateFlowReturnTo(returnTo: string | undefined): boolean {
  if (!returnTo || !isSafeAppPath(returnTo)) return false
  return returnTo === '/event/donate' || returnTo.startsWith('/event/donate?') || returnTo.startsWith('/event/donate/')
}

/**
 * @page /login
 * @entity PLAYER
 * @description Login page - email-based authentication with optional returnTo redirect
 * @permissions public
 * @searchParams returnTo:string (optional) - Post-login redirect URL
 * @relationships authenticates PLAYER; incomplete profile → /conclave/onboarding unless returnTo is a public donate path
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
            if (profileIncomplete && !isDonateFlowReturnTo(returnTo)) {
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
