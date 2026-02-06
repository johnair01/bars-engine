'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { completeQuest } from '@/actions/quest-engine'

export async function completeStarterQuest(formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const barId = formData.get('barId') as string
    const inputsJson = formData.get('inputs') as string

    let inputs: Record<string, any>
    try {
        inputs = JSON.parse(inputsJson)
    } catch {
        return { error: 'Invalid input data' }
    }

    try {
        // Use the unified Quest Engine
        // This handles:
        // 1. PlayerQuest upsert (completion)
        // 2. Vibuon Grants (+ bonuses)
        // 3. Thread/Pack progression (if context provided - though here we are standalone)
        // 4. Onboarding checks
        const result = await completeQuest(barId, inputs)

        if (result.success) {
            revalidatePath('/')
        }

        return result

    } catch (e) {
        console.error(e)
        return { error: 'Failed to complete quest' }
    }
}

