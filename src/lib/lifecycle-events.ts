import { db } from '@/lib/db'

export type LifecycleEventName =
    | 'ICHING_CAST_ATTEMPT'
    | 'ICHING_CAST_REVEALED'
    | 'ICHING_CAST_COOLDOWN_BLOCKED'
    | 'ICHING_CAST_FAILED'
    | 'ICHING_QUEST_GENERATION_FAILED'
    | 'ICHING_QUEST_GENERATED'
    | 'BAR_LOGGED'
    | 'BAR_PROMOTED_TO_QUEST'
    | 'BAR_PROMOTION_FAILED'

type LifecyclePayload = {
    event: LifecycleEventName
    metadata?: Record<string, unknown>
}

export function lifecycleEventMarker(event: LifecycleEventName): string {
    return `"event":"${event}"`
}

export async function logLifecycleEvent(
    playerId: string,
    event: LifecycleEventName,
    options?: {
        questId?: string
        metadata?: Record<string, unknown>
    }
) {
    const payload: LifecyclePayload = {
        event,
        metadata: options?.metadata || {},
    }

    try {
        await db.vibulonEvent.create({
            data: {
                playerId,
                source: 'lifecycle',
                amount: 0,
                notes: JSON.stringify(payload),
                questId: options?.questId || null,
            }
        })
    } catch (error) {
        // Observability should never break gameplay flows.
        console.error('[lifecycle-events] failed to persist lifecycle event', {
            playerId,
            event,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}
