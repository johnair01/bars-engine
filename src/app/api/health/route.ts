import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
    getQuestGeneratorMode,
    getVibeulonLedgerMode,
    isAuthBypassEmailVerificationEnabled
} from '@/lib/mvp-flags'

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
            mvpFlags: {
                QUEST_GENERATOR_MODE: getQuestGeneratorMode(),
                AUTH_BYPASS_EMAIL_VERIFICATION: isAuthBypassEmailVerificationEnabled(),
                VIBEULON_LEDGER_MODE: getVibeulonLedgerMode(),
            }
        })
    } catch (error: any) {
        return NextResponse.json(
            { status: 'error', message: error?.message || 'Unknown error' },
            { status: 500 }
        )
    }
}
