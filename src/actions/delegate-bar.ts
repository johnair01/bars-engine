'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ensureWallet } from './economy'
import { STARTER_BARS } from '@/lib/bars'

export async function delegateBar(formData: FormData) {
    const cookieStore = await cookies()
    const senderId = cookieStore.get('bars_player_id')?.value
    if (!senderId) return { error: 'Not logged in' }

    const barId = formData.get('barId') as string
    const targetPlayerId = formData.get('targetPlayerId') as string

    if (!barId || !targetPlayerId) return { error: 'Missing requirements' }
    if (senderId === targetPlayerId) return { error: 'Cannot delegate to self' }

    try {
        await ensureWallet(senderId)

        return await db.$transaction(async (tx) => {
            // 1. Get Sender's Wallet
            const wallet = await tx.vibulon.findMany({
                where: { ownerId: senderId },
                orderBy: { createdAt: 'asc' }, // Use oldest first (FIFO)
                take: 1
            })

            if (wallet.length === 0) {
                throw new Error('Insufficient Vibulons')
            }
            const tokenToStake = wallet[0]

            // 2. Identify the Bar and Prepare Transfer ID
            let transferBarId = barId
            let barTitle = 'Delegated Quest'

            // If it's a static starter bar, we must instantiate it as a CustomBar to make it unique/stakable
            const starterBar = STARTER_BARS.find(b => b.id === barId)
            if (starterBar) {
                const newBar = await tx.customBar.create({
                    data: {
                        title: starterBar.title, // Keep original title? Or specific?
                        description: `Delegated by a fellow traveler. ${starterBar.description}`,
                        type: starterBar.type,
                        reward: starterBar.reward,
                        inputs: JSON.stringify(starterBar.inputs || []),
                        creatorId: senderId,
                        status: 'active' // It becomes active immediately? Or available? User said "Remove from Active" implies active transfer.
                    }
                })
                transferBarId = newBar.id
                barTitle = starterBar.title
            } else {
                // Check CustomBar
                const existingCustom = await tx.customBar.findUnique({ where: { id: barId } })
                if (!existingCustom) throw new Error('Bar not found')
                barTitle = existingCustom.title
            }

            // 3. Remove from Sender's Active List
            const senderPack = await tx.starterPack.findUnique({ where: { playerId: senderId } })
            if (senderPack) {
                const data = JSON.parse(senderPack.data) as { activeBars: string[] }
                data.activeBars = data.activeBars.filter(id => id !== barId)
                await tx.starterPack.update({
                    where: { playerId: senderId },
                    data: { data: JSON.stringify(data) }
                })
            }

            // 4. Add to Recipient's Active List (Available or Active?)
            // "Give a BAR... remove it from active quests"
            // Let's put it in Recipient's *Available* list? Or *Active*?
            // "Give" implies they have it now. Let's put it in Active.
            // But if their slots are full? We don't have slots yet.
            // Let's put it in Active.
            const targetPack = await tx.starterPack.findUnique({ where: { playerId: targetPlayerId } })
            if (targetPack) {
                const data = JSON.parse(targetPack.data) as { activeBars: string[] }
                // Avoid dupes
                if (!data.activeBars.includes(transferBarId)) {
                    data.activeBars.push(transferBarId)
                    await tx.starterPack.update({
                        where: { playerId: targetPlayerId },
                        data: { data: JSON.stringify(data) }
                    })
                }
            } else {
                // If target has no pack? unlikely if they are a player.
                throw new Error('Target player not initialized')
            }

            // 5. Stake the Vibulon
            await tx.vibulon.update({
                where: { id: tokenToStake.id },
                data: {
                    ownerId: null, // Escrow
                    stakedOnBarId: transferBarId
                }
            })

            return { success: true, transferBarId }
        })
    } catch (e: any) {
        console.error(e)
        return { error: e.message || 'Failed to delegate' }
    }
}
