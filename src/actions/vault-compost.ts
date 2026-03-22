'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { isGameAccountReady } from '@/lib/auth'
import { compostEligibleWhere } from '@/lib/vault-queries'
import {
    parseSalvagePayload,
    serializeSalvagePayload,
    normalizeCompostSourceIds,
    type VaultSalvagePayloadInput,
} from '@/lib/vault-compost'

export type RunVaultCompostResult = { ok: true } | { ok: false; error: string }

export async function runVaultCompost(input: {
    sourceIds: string[]
    salvage: VaultSalvagePayloadInput
}): Promise<RunVaultCompostResult> {
    const player = await getCurrentPlayer()
    if (!player || !isGameAccountReady(player)) {
        return { ok: false, error: 'Sign in and complete orientation to use Vault Compost.' }
    }

    let sourceIds: string[]
    try {
        sourceIds = normalizeCompostSourceIds(input.sourceIds)
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Invalid selection.' }
    }

    const parsed = parseSalvagePayload(input.salvage)
    if (!parsed.ok) {
        return { ok: false, error: parsed.error }
    }

    const payloadJson = serializeSalvagePayload(parsed.payload)
    const playerId = player.id

    try {
        await db.$transaction(async (tx) => {
            const eligible = await tx.customBar.findMany({
                where: {
                    AND: [{ id: { in: sourceIds } }, compostEligibleWhere(playerId)],
                },
                select: { id: true },
            })

            if (eligible.length !== sourceIds.length) {
                throw new Error(
                    'One or more items are no longer eligible (already archived, shared, or not in your Vault). Refresh and try again.'
                )
            }

            await tx.compostLedger.create({
                data: {
                    playerId,
                    sourceIdsJson: JSON.stringify(sourceIds),
                    salvagePayload: payloadJson,
                    outcome: 'composted',
                },
            })

            const now = new Date()
            await tx.customBar.updateMany({
                where: {
                    AND: [{ id: { in: sourceIds } }, compostEligibleWhere(playerId)],
                },
                data: { archivedAt: now, status: 'archived' },
            })

            await tx.playerQuest.deleteMany({
                where: {
                    playerId,
                    questId: { in: sourceIds },
                },
            })
        })
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Compost failed. Nothing was changed.'
        return { ok: false, error: msg }
    }

    revalidatePath('/hand')
    revalidatePath('/hand/drafts')
    revalidatePath('/hand/quests')
    revalidatePath('/hand/compost')
    revalidatePath('/bars')

    return { ok: true }
}
