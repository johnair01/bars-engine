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
    const targetType = formData.get('targetType') as string || 'collective' // 'collective' or 'player'
    const targetPlayerId = formData.get('targetPlayerId') as string || null

    if (!title || !description) {
        return { error: 'Title and description are required' }
    }

    try {
        // Create simple vibe bar with one input
        const inputs = JSON.stringify([
            { key: 'response', label: inputLabel, type: inputType, placeholder: '' }
        ])

        await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description,
                type: 'vibe',
                reward: 1,
                inputs,
                // Store target info in the model - we'll handle distribution logic later
                storyPath: targetType === 'player' && targetPlayerId
                    ? `player:${targetPlayerId}`
                    : 'collective',
            }
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
