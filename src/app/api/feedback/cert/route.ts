import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * POST /api/feedback/cert
 * Logs certification quest feedback. API-first: no revalidatePath, no server action.
 * Used by TwineQuestModal and PassageRenderer to avoid kick-to-dashboard.
 */
export async function POST(request: NextRequest) {
    const player = await getCurrentPlayer()
    if (!player) {
        return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    let body: { questId?: string; passageName?: string; feedback?: string }
    try {
        body = (await request.json()) as { questId?: string; passageName?: string; feedback?: string }
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const trimmed = typeof body.feedback === 'string' ? body.feedback.trim() : ''
    if (!trimmed) {
        return NextResponse.json({ error: 'Feedback is required' }, { status: 400 })
    }

    const questId = typeof body.questId === 'string' ? body.questId : 'unknown'
    const passageName = typeof body.passageName === 'string' ? body.passageName : 'unknown'

    try {
        const feedbackDir = path.join(process.cwd(), '.feedback')
        await fs.mkdir(feedbackDir, { recursive: true })

        const feedbackFile = path.join(feedbackDir, 'cert_feedback.jsonl')
        const entry = {
            timestamp: new Date().toISOString(),
            playerId: player.id,
            playerName: player.name,
            questId,
            passageName,
            feedback: trimmed
        }

        await fs.appendFile(feedbackFile, JSON.stringify(entry) + '\n')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to log certification feedback:', error)
        return NextResponse.json({ error: 'Failed to write feedback' }, { status: 500 })
    }
}
