import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { advanceOnboardingState } from '@/actions/onboarding'

/**
 * POST /api/onboarding/advance
 * Advances onboarding state by event.
 * Request: { event: string, nationId?: string, archetypeId?: string, playbookId?: string, lens?: string, campaignDomainPreference?: string[] }
 * Response: { success: boolean, onboardingState?: string, error?: string }
 */
export async function POST(request: Request) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json().catch(() => ({}))
        const event = typeof body?.event === 'string' ? body.event : ''
        if (!event) {
            return NextResponse.json({ success: false, error: 'Missing event' }, { status: 400 })
        }

        const payload = body.payload as Record<string, unknown> | undefined
        const nationId = typeof payload?.nationId === 'string' ? payload.nationId : undefined
        const archetypeId = typeof payload?.archetypeId === 'string' ? payload.archetypeId : (typeof payload?.playbookId === 'string' ? payload.playbookId : undefined)
        const lens = typeof payload?.lens === 'string' ? payload.lens : undefined
        const rawPref = payload?.campaignDomainPreference
        let campaignDomainPreference: string[] | undefined
        if (Array.isArray(rawPref)) {
            campaignDomainPreference = rawPref.filter((x): x is string => typeof x === 'string')
        } else if (typeof rawPref === 'string') {
            campaignDomainPreference = [rawPref]
        }

        const result = await advanceOnboardingState(event, {
            playerId,
            nationId,
            archetypeId,
            lens,
            campaignDomainPreference,
        })

        if (!result.success) {
            return NextResponse.json(result, { status: 400 })
        }
        return NextResponse.json(result)
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
