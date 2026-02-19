'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// This is a temporary container for the Stitcher Wizard Page
// I'll put the actual implementation in a follow up step once I have the components ready.

export async function getStitcherContext(storyId?: string) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Not logged in' }

    const adminRole = await db.playerRole.findFirst({
        where: { playerId, role: { key: 'admin' } }
    })
    if (!adminRole) return { error: 'Admin access required' }

    const nations = await db.nation.findMany({ select: { id: true, name: true } })
    const playbooks = await db.playbook.findMany({ select: { id: true, name: true } })
    const quests = await db.customBar.findMany({
        where: { status: 'active' },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    let story = null
    if (storyId) {
        story = await db.twineStory.findUnique({ where: { id: storyId } })
    }

    return { success: true, nations, playbooks, quests, story }
}
