import { NextResponse } from 'next/server'

/**
 * Log onboarding analytics events.
 * Payload is logged server-side; can be extended to persist to DB.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { event, payload } = body as { event: string; payload?: Record<string, unknown> }
        if (!event || typeof event !== 'string') {
            return NextResponse.json({ error: 'Missing event' }, { status: 400 })
        }
        // Log for observability; extend to DB/analytics as needed
        console.log('[onboarding]', event, JSON.stringify(payload ?? {}))
        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
