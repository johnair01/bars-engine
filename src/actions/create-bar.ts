'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createCustomBar(prevState: any, formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const inputType = formData.get('inputType') as string || 'text'
    const inputLabel = formData.get('inputLabel') as string || 'Response'
    const visibility = formData.get('visibility') as string || 'public' // 'public' or 'private'
    const targetPlayerId = formData.get('targetPlayerId') as string || null
    const moveType = formData.get('moveType') as string || null // wakeUp, cleanUp, growUp, showUp

    if (!title || !description) {
        return { error: 'Title and description are required' }
    }

    try {
        // Create simple vibe bar with one input
        const inputs = JSON.stringify([
            { key: 'response', label: inputLabel, type: inputType, placeholder: '' }
        ])

        // Private bars with a target go directly to recipient's claimed hand
        const claimedById = visibility === 'private' && targetPlayerId
            ? targetPlayerId
            : null

        const newBar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description,
                type: 'vibe',
                reward: 1,
                inputs,
                visibility,
                claimedById,
                moveType: moveType || null,
                storyPath: 'collective', // Simplified; we now use visibility for access control
            }
        })

        // Initialize rootId for new bars (recursion support)
        await db.customBar.update({
            where: { id: newBar.id },
            data: { rootId: newBar.id }
        })

        revalidatePath('/')
        return { success: true }

    } catch (e: any) {
        console.error("Create bar failed:", e?.message)
        return { error: 'Failed to create bar' }
    }
}

export async function getCustomBars() {
    return db.customBar.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getActivePlayers() {
    return db.player.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' }
    })
}
