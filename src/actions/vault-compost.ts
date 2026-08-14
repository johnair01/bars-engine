'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { isGameAccountReady } from '@/lib/auth'
import { compostEligibleWhere, loadCompostEligibleBars } from '@/lib/vault-queries'
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

    revalidatePath('/vault')
    revalidatePath('/vault/drafts')
    revalidatePath('/vault/quests')
    revalidatePath('/vault/compost')
    revalidatePath('/bars')

    return { ok: true }
}

/**
 * Compost-eligible BARs for the current player, fetched on demand.
 *
 * The `/vault/compost` page loads these server-side, but the inline compost
 * modal needs them without a navigation — a player who hits the Vault cap
 * mid-capture must be able to clear space without losing what they typed.
 */
export async function listCompostEligible(): Promise<
  { items: Array<{ id: string; title: string; type: string; createdAt: string }> } | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player || !isGameAccountReady(player)) {
    return { error: 'Sign in and complete orientation to use Vault Compost.' }
  }
  try {
    const rows = await loadCompostEligibleBars(player.id)
    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        createdAt: r.createdAt.toISOString(),
      })),
    }
  } catch (e) {
    console.error('[vault-compost:listCompostEligible]', e)
    return { error: 'Could not load compostable items.' }
  }
}
