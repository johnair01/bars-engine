import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { runStoryQuestForensicsHarness } from '@/actions/story-clock'

export async function POST(req: NextRequest) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })
    const isAdmin = player?.roles.some((entry) => entry.role.key === 'admin' || entry.role.key === 'ENGINEER')
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const questId = typeof body?.questId === 'string' ? body.questId : ''
    const mode = body?.mode === 'A' || body?.mode === 'B' || body?.mode === 'C' ? body.mode : 'A'
    const n = typeof body?.n === 'number' ? body.n : undefined

    const result = await runStoryQuestForensicsHarness({
        questId,
        mode,
        n,
        baseInputs: body?.baseInputs || undefined,
        modelParams: body?.modelParams || undefined,
        debug: true,
    })

    if ('error' in result) {
        return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
}
