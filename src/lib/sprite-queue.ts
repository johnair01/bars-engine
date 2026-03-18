/**
 * Sprite generation queue client.
 * Enqueues jobs to the Python backend sprite generation service.
 * Fire-and-forget: failures are logged but never block the quest completion effect.
 */

import { parseAvatarConfig } from './avatar-utils'

export async function enqueueSpriteGeneration(
    playerId: string,
    avatarConfig: string,
    pipeline: Array<'portrait' | 'walkable'> = ['portrait', 'walkable']
): Promise<void> {
    const config = parseAvatarConfig(avatarConfig)
    if (!config?.nationKey || !config?.archetypeKey) {
        console.warn(`[SpriteQueue] Cannot enqueue: invalid avatarConfig for player ${playerId}`)
        return
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const body = {
        playerId,
        nationKey: config.nationKey,
        archetypeKey: config.archetypeKey,
        genderKey: config.genderKey || 'default',
        pipeline,
    }

    try {
        const res = await fetch(`${backendUrl}/api/sprites/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            // Short timeout — don't block quest completion
            signal: AbortSignal.timeout(3000),
        })
        if (!res.ok) {
            console.warn(`[SpriteQueue] Backend returned ${res.status} for player ${playerId}`)
            return
        }
        const data = await res.json() as { jobId?: string; status?: string }
        console.log(`[SpriteQueue] Enqueued job ${data.jobId} for player ${playerId} (${config.nationKey}-${config.archetypeKey})`)
    } catch (err) {
        // Fire-and-forget: log but never throw
        console.warn(`[SpriteQueue] Failed to enqueue for player ${playerId}:`, err)
    }
}
