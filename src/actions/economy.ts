'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

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
export async function mintVibulon(playerId: string, amount: number, origin: { source: string, id: string, title: string }) {
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
    revalidatePath('/')
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

    if (!senderId || !targetId || !amount || amount <= 0) {
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
        return { success: true }
    })
}
