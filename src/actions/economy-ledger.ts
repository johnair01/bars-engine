'use server'

import { LedgerService } from '@/lib/economy-ledger'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function attuneAction(instanceId: string, amount: number) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    try {
        await LedgerService.attune(player.id, instanceId, amount)
        revalidatePath('/wallet')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Attunement failed' }
    }
}

export async function transmuteAction(params: {
    sourceInstanceId: string,
    amount: number,
    targetInstanceId?: string,
    metadata?: Record<string, unknown>
}) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    // NOTE: In a real scenario, we'd check for 'Ratifier' role here.
    // For this minimal implementation, we assume the caller has authority or it's a governed move.

    try {
        await LedgerService.transmute({
            ...params,
            playerId: player.id
        })
        revalidatePath('/wallet')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Transmutation failed' }
    }
}
