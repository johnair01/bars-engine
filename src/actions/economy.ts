'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { fireTrigger } from '@/actions/quest-engine'
import { getCurrentPlayer } from '@/lib/auth'

/**
 * Ensures the player's integer balance is migrated to Vibulon tokens.
 */
export async function ensureWallet(playerId: string) {
    const starterPack = await db.starterPack.findUnique({ where: { playerId } })
    if (!starterPack) return

    if (starterPack.initialVibeulons > 0) {
        // Migration: Create tokens for the balance
        const tokensToCreate = starterPack.initialVibeulons
        const data = []
        for (let i = 0; i < tokensToCreate; i++) {
            data.push({
                ownerId: playerId,
                originSource: 'legacy_migration',
                originId: 'migration',
                originTitle: 'Legacy Balance Migration'
            })
        }

        await db.$transaction([
            db.vibulon.createMany({ data }),
            db.starterPack.update({
                where: { playerId },
                data: { initialVibeulons: 0 }
            })
        ])
    }
}

/**
 * Mint new Vibulons for a player
 */
export async function mintVibulon(
    playerId: string,
    amount: number,
    origin: { source: string, id: string, title: string },
    options?: { skipRevalidate?: boolean }
) {
    if (amount <= 0) return

    const data = []
    for (let i = 0; i < amount; i++) {
        data.push({
            ownerId: playerId,
            originSource: origin.source,
            originId: origin.id,
            originTitle: origin.title
        })
    }

    await db.vibulon.createMany({ data })
    if (!options?.skipRevalidate) {
        revalidatePath('/')
    }
}

/**
 * Get player's wallet contents
 */
export async function getWallet(playerId: string) {
    await ensureWallet(playerId)
    return db.vibulon.findMany({
        where: { ownerId: playerId },
        orderBy: { createdAt: 'desc' }
    })
}

/**
 * Transfer Vibulons to another player
 */
export async function transferVibulons(formData: FormData) {
    const senderId = formData.get('senderId') as string
    const targetId = formData.get('targetId') as string
    const amount = parseInt(formData.get('amount') as string)

    console.log(`[TRANSFER] senderId=${senderId} targetId=${targetId} amount=${amount}`)

    if (!senderId || !targetId || !amount || amount <= 0) {
        console.error(`[TRANSFER] Invalid params: sender=${senderId} target=${targetId} amount=${amount}`)
        return { error: 'Invalid transfer details' }
    }

    if (senderId === targetId) return { error: 'Cannot send to self' }

    return await db.$transaction(async (tx) => {
        // 1. Get Sender's Wallet (FIFO)
        const wallet = await tx.vibulon.findMany({
            where: { ownerId: senderId },
            orderBy: { createdAt: 'asc' },
            take: amount
        })

        if (wallet.length < amount) {
            throw new Error('Insufficient Vibulons')
        }

        const tokenIds = wallet.map(t => t.id)

        // 2. Transfer Tokens + Increment Generation
        // Each transfer increments generation (tracks hops from origin)
        for (const token of wallet) {
            await tx.vibulon.update({
                where: { id: token.id },
                data: {
                    ownerId: targetId,
                    generation: token.generation + 1
                }
            })
        }

        // 3. Log Events with archetype move
        // PERMEATE = spreading/transfer (Peacemaker move, Stage 7)
        await tx.vibulonEvent.create({
            data: {
                playerId: senderId,
                source: 'p2p_transfer',
                amount: -amount,
                notes: `Sent to ${targetId}`,
                archetypeMove: 'PERMEATE'
            }
        })
        await tx.vibulonEvent.create({
            data: {
                playerId: targetId,
                source: 'p2p_transfer',
                amount: amount,
                notes: `Received from ${senderId}`,
                archetypeMove: 'PERMEATE'
            }
        })

        revalidatePath('/')
        revalidatePath('/wallet')

        // Trigger any quests listening for transfer
        await fireTrigger('VIBEULON_SENT')

        return { success: true }
    })
}

/**
 * Get context for a transfer (balance + other players)
 */
export async function getTransferContext() {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const wallet = await getWallet(player.id)
    const others = await db.player.findMany({
        where: { id: { not: player.id } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    })

    return {
        success: true,
        playerId: player.id,
        balance: wallet.length,
        recipients: others
    }
}
