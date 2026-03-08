import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOnboardingState } from '@/actions/onboarding'

/**
 * GET /api/onboarding/state
 * Returns onboarding state for the current player (from cookies).
 * Response: { playerId, onboardingState, nationId, playbookId, campaignDomainPreference, hasLens }
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const playerIdOverride = searchParams.get('playerId') ?? undefined

    const cookieStore = await cookies()
    const playerId = playerIdOverride ?? cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await getOnboardingState(playerId)
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 401 })
        }
        return NextResponse.json(result)
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
