import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
    getQuestGeneratorMode,
    getVibeulonLedgerMode,
    isAuthBypassEmailVerificationEnabled
} from '@/lib/mvp-flags'

/**
 * @route GET /api/health
 * @entity SYSTEM
 * @description Health check endpoint for monitoring, uptime verification, and system status
 * @permissions public
 * @energyCost 0 (monitoring only)
 * @dimensions WHO:system, WHAT:SYSTEM
 * @example /api/health
 * @agentDiscoverable true
 */
export async function GET() {
    try {
        const [playerCount, barCount, customBarCount, nationCount, archetypeCount, vibulonCount] = await Promise.all([
            db.player.count(),
            db.bar.count(),
            db.customBar.count({ where: { status: 'active' } }),
            db.nation.count(),
            db.archetype.count(),
            db.vibulon.count(),
        ])

        // Check bar_shares table exists by attempting a count
        let barSharesReady = false
        let barSharesCount = 0
        try {
            barSharesCount = await db.barShare.count()
            barSharesReady = true
        } catch {
            barSharesReady = false
        }

        // Check twine tables
        let twineReady = false
        let publishedStories = 0
        try {
            publishedStories = await db.twineStory.count({ where: { isPublished: true } })
            twineReady = true
        } catch {
            twineReady = false
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            mvp: {
                seedVibeulons: process.env.MVP_SEED_VIBEULONS || '3',
                questGeneratorMode: process.env.QUEST_GENERATOR_MODE || 'placeholder',
            },
            db: {
                players: playerCount,
                hexagramBars: barCount,
                activeQuests: customBarCount,
                nations: nationCount,
                archetypes: archetypeCount,
                vibulons: vibulonCount,
                barShares: barSharesCount,
            },
            tables: {
                barSharesReady,
                twineReady,
            },
            gameLoop: {
                signup: playerCount > 0 ? 'WORKING' : 'NEEDS_TEST',
                nationArchetype: nationCount > 0 && archetypeCount > 0 ? 'READY' : 'NEEDS_SEED',
                questCreation: 'READY',
                barCreation: 'READY',
                barSharing: barSharesReady ? 'READY' : 'TABLE_MISSING',
                vibulonTransfer: vibulonCount > 0 ? 'READY' : 'NO_TOKENS_YET',
                twine: twineReady ? (publishedStories > 0 ? 'READY' : 'NO_STORIES') : 'TABLE_MISSING',
            },
            mvpFlags: {
                QUEST_GENERATOR_MODE: getQuestGeneratorMode(),
                AUTH_BYPASS_EMAIL_VERIFICATION: isAuthBypassEmailVerificationEnabled(),
                VIBEULON_LEDGER_MODE: getVibeulonLedgerMode(),
            }
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { status: 'error', message },
            { status: 500 }
        )
    }
}
