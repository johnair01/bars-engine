'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { fireTrigger } from '@/actions/quest-engine'
import { isFeatureEnabled } from '@/lib/features'

export async function castIChing() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const ichingEnabled = await isFeatureEnabled('iching', true)
    if (!ichingEnabled) {
        return { error: 'I Ching is currently disabled.' }
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

    const ichingEnabled = await isFeatureEnabled('iching', true)
    if (!ichingEnabled) {
        return { error: 'I Ching is currently disabled.' }
    }

    try {
        const hexagram = await db.bar.findUnique({
            where: { id: hexagramId }
        })

        if (!hexagram) {
            return { error: 'Hexagram not found' }
        }

        // Legacy path: keep as history-only recording.
        // Canonical quest lifecycle now lives in generateQuestFromReading / castAndGenerateQuest.
        await db.playerBar.create({
            data: {
                playerId,
                barId: hexagramId,
                source: 'iching',
                notes: `Cast on ${new Date().toLocaleDateString()}`
            }
        })

        // Fire orientation trigger listeners for backward compatibility.
        await fireTrigger('ICHING_CAST')

        revalidatePath('/')
        revalidatePath('/iching')

        return {
            success: true,
            message: `${hexagram.name} has been added to your reading history.`
        }

    } catch (e: any) {
        console.error("Accept reading failed:", e?.message)
        return { error: 'Failed to accept reading' }
    }
}
