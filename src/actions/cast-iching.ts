'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { isFeatureEnabled } from '@/lib/features'
import { getIChingCooldownBlock } from '@/lib/iching-cooldown'
import { logLifecycleEvent } from '@/lib/lifecycle-events'

function toErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    return String(error)
}

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

    await logLifecycleEvent(playerId, 'ICHING_CAST_ATTEMPT')

    const cooldown = await getIChingCooldownBlock(playerId)
    if (cooldown) {
        await logLifecycleEvent(playerId, 'ICHING_CAST_COOLDOWN_BLOCKED', {
            metadata: { remainingSeconds: cooldown.remainingSeconds }
        })
        return { error: `The oracle is still settling. Please wait ${cooldown.remainingSeconds}s before casting again.` }
    }

    try {
        // Cast: Random hexagram 1-64
        const hexagramId = Math.floor(Math.random() * 64) + 1

        // Fetch the hexagram data
        const hexagram = await db.bar.findUnique({
            where: { id: hexagramId }
        })

        if (!hexagram) {
            await logLifecycleEvent(playerId, 'ICHING_CAST_FAILED', {
                metadata: { reason: 'Hexagram not found', hexagramId }
            })
            return { error: 'Hexagram not found' }
        }

        await logLifecycleEvent(playerId, 'ICHING_CAST_REVEALED', {
            metadata: { hexagramId: hexagram.id, hexagramName: hexagram.name }
        })

        return {
            success: true,
            hexagram: {
                id: hexagram.id,
                name: hexagram.name,
                tone: hexagram.tone,
                text: hexagram.text,
            }
        }

    } catch (error: unknown) {
        const message = toErrorMessage(error)
        console.error("Cast I Ching failed:", message)
        await logLifecycleEvent(playerId, 'ICHING_CAST_FAILED', {
            metadata: { reason: message }
        })
        return { error: 'Failed to cast' }
    }
}
