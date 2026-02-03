import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        // Quick DB ping
        const playerCount = await db.player.count()
        const barCount = await db.bar.count()

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            db: {
                players: playerCount,
                bars: barCount,
            },
        })
    } catch (error: any) {
        return NextResponse.json(
            { status: 'error', message: error?.message || 'Unknown error' },
            { status: 500 }
        )
    }
}
