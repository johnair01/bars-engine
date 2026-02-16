'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { fireTrigger } from '@/actions/quest-engine'
import { getCurrentPlayer } from '@/lib/auth'
import { createRequestId, logActionError } from '@/lib/mvp-observability'
import { getVibeulonLedgerMode } from '@/lib/mvp-flags'

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

async function resolveRecipient(tx: any, params: {
    targetId?: string | null
    recipientIdentifier?: string | null
}) {
    const targetId = (params.targetId || '').trim()
    if (targetId) {
        const recipientById = await tx.player.findUnique({
            where: { id: targetId },
            include: { account: { select: { email: true } } }
        })
        if (recipientById) return recipientById
    }

    const rawIdentifier = (params.recipientIdentifier || '').trim()
    if (!rawIdentifier) return null
    const identifier = rawIdentifier.startsWith('@') ? rawIdentifier.slice(1) : rawIdentifier

    const recipientByEmail = await tx.player.findFirst({
        where: {
            OR: [
                { contactValue: { equals: identifier, mode: 'insensitive' } },
                { account: { is: { email: { equals: identifier, mode: 'insensitive' } } } }
            ]
        },
        include: { account: { select: { email: true } } }
    })
    if (recipientByEmail) return recipientByEmail

    const recipientByName = await tx.player.findFirst({
        where: {
            name: { equals: identifier, mode: 'insensitive' }
        },
        include: { account: { select: { email: true } } }
    })

    return recipientByName
}

/**
 * Transfer Vibulons to another player
 */
export async function transferVibulons(formData: FormData) {
    const requestId = createRequestId()
    const sender = await getCurrentPlayer()
    if (!sender) return { error: 'Not logged in' }

    const senderId = sender.id
    const targetId = (formData.get('targetId') as string) || null
    const recipientIdentifier = (formData.get('recipientIdentifier') as string) || null
    const memo = (formData.get('memo') as string || '').trim()
    const amountRaw = parseInt((formData.get('amount') as string) || '1', 10)
    const amount = Number.isFinite(amountRaw) ? amountRaw : 1
    const ledgerMode = getVibeulonLedgerMode()

    if ((!targetId && !recipientIdentifier) || !amount || amount <= 0) {
        return { error: 'Invalid transfer details' }
    }

    try {
        const transferResult = await db.$transaction(async (tx) => {
            const recipient = await resolveRecipient(tx, { targetId, recipientIdentifier })
            if (!recipient) {
                throw new Error('Recipient not found. Use email, username, or player selection.')
            }

            if (recipient.id === senderId) throw new Error('Cannot send to self')

            // 1. Get Sender's Wallet (FIFO)
            const wallet = await tx.vibulon.findMany({
                where: { ownerId: senderId },
                orderBy: { createdAt: 'asc' },
                take: amount
            })

            if (wallet.length < amount) {
                throw new Error('Insufficient Vibulons')
            }

            const recipientLabel = recipient.account?.email || recipient.contactValue || recipient.name
            const senderLabel = sender.name || sender.contactValue || sender.id

            // 2. Transfer Tokens + Increment Generation
            for (const token of wallet) {
                await tx.vibulon.update({
                    where: { id: token.id },
                    data: {
                        ownerId: recipient.id,
                        generation: token.generation + 1
                    }
                })
            }

            // 3. Log Events
            await tx.vibulonEvent.create({
                data: {
                    playerId: senderId,
                    source: 'p2p_transfer',
                    amount: -amount,
                    notes: `Sent to ${recipientLabel}${memo ? ` • memo: ${memo}` : ''}`,
                    archetypeMove: 'PERMEATE'
                }
            })
            await tx.vibulonEvent.create({
                data: {
                    playerId: recipient.id,
                    source: 'p2p_transfer',
                    amount: amount,
                    notes: `Received from ${senderLabel}${memo ? ` • memo: ${memo}` : ''}`,
                    archetypeMove: 'PERMEATE'
                }
            })

            return {
                success: true,
                recipient: { id: recipient.id, name: recipient.name, email: recipient.account?.email || recipient.contactValue || null },
                amount,
                ledgerMode
            }
        })

        revalidatePath('/')
        revalidatePath('/wallet')

        // Trigger any quests listening for transfer
        await fireTrigger('VIBEULON_SENT')

        return transferResult
    } catch (error) {
        logActionError(
            {
                action: 'transferVibulons',
                requestId,
                userId: senderId,
                extra: { targetId, recipientIdentifier, amount, ledgerMode }
            },
            error
        )
        const message = error instanceof Error ? error.message : 'Transfer failed'
        return { error: `${message} (req: ${requestId})` }
    }
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
        select: {
            id: true,
            name: true,
            contactValue: true,
            account: { select: { email: true } }
        },
        orderBy: { name: 'asc' }
    })

    return {
        success: true,
        playerId: player.id,
        balance: wallet.length,
        ledgerMode: getVibeulonLedgerMode(),
        recipients: others.map((recipient) => ({
            id: recipient.id,
            name: recipient.name,
            username: recipient.name,
            email: recipient.account?.email || recipient.contactValue || null
        }))
    }
}
