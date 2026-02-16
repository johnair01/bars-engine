import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        // Quick DB ping
        const [playerCount, barCount, customBarCount, nationCount, playbookCount, vibulonCount] = await Promise.all([
            db.player.count(),
            db.bar.count(),
            db.customBar.count({ where: { status: 'active' } }),
            db.nation.count(),
            db.playbook.count(),
            db.vibulon.count(),
        ])

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
                playbooks: playbookCount,
                vibulons: vibulonCount,
            },
            gameLoop: {
                signup: playerCount > 0 ? 'WORKING' : 'NEEDS_TEST',
                nationArchetype: nationCount > 0 && playbookCount > 0 ? 'READY' : 'NEEDS_SEED',
                questCreation: 'READY',
                barCreation: 'READY',
                vibulonTransfer: vibulonCount > 0 ? 'READY' : 'NO_TOKENS_YET',
            }
        })
    } catch (error: any) {
        return NextResponse.json(
            { status: 'error', message: error?.message || 'Unknown error' },
            { status: 500 }
        )
    }
}
