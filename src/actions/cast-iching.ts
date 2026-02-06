'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { fireTrigger } from '@/actions/quest-engine'

export async function castIChing() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    try {
        // Cast: Random hexagram 1-64
        const hexagramId = Math.floor(Math.random() * 64) + 1

        // Fetch the hexagram data
        const hexagram = await db.bar.findUnique({
            where: { id: hexagramId }
        })

        if (!hexagram) {
            return { error: 'Hexagram not found' }
        }

        return {
            success: true,
            hexagram: {
                id: hexagram.id,
                name: hexagram.name,
                tone: hexagram.tone,
                text: hexagram.text,
            }
        }

    } catch (e: any) {
        console.error("Cast I Ching failed:", e?.message)
        return { error: 'Failed to cast' }
    }
}

export async function acceptReading(hexagramId: number) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    try {
        const hexagram = await db.bar.findUnique({
            where: { id: hexagramId }
        })

        if (!hexagram) {
            return { error: 'Hexagram not found' }
        }

        // Record this reading as a PlayerBar
        await db.playerBar.create({
            data: {
                playerId,
                barId: hexagramId,
                source: 'iching',
                notes: `Cast on ${new Date().toLocaleDateString()}`
            }
        })

        // Also add to starterPack activeBars for dashboard display
        const starterPack = await db.starterPack.findUnique({
            where: { playerId }
        })

        if (starterPack) {
            const data = JSON.parse(starterPack.data) as {
                completedBars: any[],
                activeBars: string[]
            }

            if (!data.activeBars) data.activeBars = []

            // Add with iching_ prefix to distinguish
            const ichingBarId = `iching_${hexagramId}`
            if (!data.activeBars.includes(ichingBarId)) {
                data.activeBars.push(ichingBarId)
            }

            await db.starterPack.update({
                where: { playerId },
                data: { data: JSON.stringify(data) }
            })

            // Fire orientation quest trigger
            await fireTrigger('ICHING_CAST')
        }

        revalidatePath('/')
        revalidatePath('/iching')

        return {
            success: true,
            message: `${hexagram.name} has been added to your active quests.`
        }

    } catch (e: any) {
        console.error("Accept reading failed:", e?.message)
        return { error: 'Failed to accept reading' }
    }
}
