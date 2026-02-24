import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const nestableOnly = searchParams.get('nestable') === 'true'

    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const quests = await db.customBar.findMany({
            where: {
                claimedById: playerId,
                status: 'active',
                parentId: null // Quests that aren't already nested
            },
            select: {
                id: true,
                title: true,
                parentId: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ quests })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 })
    }
}
