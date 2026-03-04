import { NextResponse } from 'next/server'
import { getActiveInstance } from '@/actions/instance'

/**
 * Return the campaign's donation URL for external donate link.
 * Uses Instance.stripeOneTimeUrl or first available payment URL.
 */
export async function GET() {
    try {
        const instance = await getActiveInstance()
        const url =
            instance?.stripeOneTimeUrl ||
            instance?.venmoUrl ||
            instance?.cashappUrl ||
            instance?.paypalUrl ||
            null
        return NextResponse.json({ url })
    } catch {
        return NextResponse.json({ url: null })
    }
}
