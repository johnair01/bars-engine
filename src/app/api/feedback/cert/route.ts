import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { isCertificationQuestId } from '@/lib/certification-quest'
import { persistPlayerFeedbackToBacklog } from '@/lib/feedback/persist-player-feedback-to-backlog'

/**
 * @route POST /api/feedback/cert
 * @entity QUEST
 * @description Logs certification quest feedback to filesystem for creator review
 * @permissions authenticated
 * @query questId:string (optional) - Quest identifier
 * @query passageName:string (optional) - Twine passage name
 * @query feedback:string (required) - Player feedback text
 * @relationships VALIDATES (QUEST), provides feedback for QUEST improvement
 * @energyCost 0 (write feedback, no game state change)
 * @dimensions WHO:playerId, WHAT:QUEST, WHERE:N/A, ENERGY:feedback, PERSONAL_THROUGHPUT:reflection
 * @example POST /api/feedback/cert {questId:"cert_001",passageName:"ending",feedback:"Great quest!"}
 * @agentDiscoverable true
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

    const isAdmin =
        player.roles?.some((r: { role: { key: string } }) => r.role?.key === 'admin') ?? false
    if (!isCertificationQuestId(questId) && !isAdmin) {
        return NextResponse.json(
            { error: 'Certification feedback is only available for certification quests.' },
            { status: 403 }
        )
    }

    const persisted = await persistPlayerFeedbackToBacklog({
        source: 'certification',
        playerId: player.id,
        playerName: player.name,
        questId,
        passageName,
        feedback: trimmed,
    })

    if ('error' in persisted) {
        console.error('Failed to log certification feedback:', persisted.error)
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true, backlogItemId: persisted.backlogItemId })
}
