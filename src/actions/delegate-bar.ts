'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function delegateBar(formData: FormData) {
    const cookieStore = await cookies()
    const fromUserId = cookieStore.get('bars_player_id')?.value
    if (!fromUserId) return { error: 'Not logged in' }

    const barId = (formData.get('barId') as string | null) || ''
    const toUserId = (formData.get('targetPlayerId') as string | null) || ''
    const noteRaw = formData.get('note')
    const note = typeof noteRaw === 'string' && noteRaw.trim().length > 0 ? noteRaw.trim() : null

    if (!barId || !toUserId) return { error: 'Missing requirements' }
    if (fromUserId === toUserId) return { error: 'Cannot delegate to self' }

    try {
        const result = await db.$transaction(async (tx) => {
            const [bar, recipient] = await Promise.all([
                tx.customBar.findUnique({
                    where: { id: barId },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        isSystem: true,
                        visibility: true,
                        claimedById: true,
                        creatorId: true,
                    }
                }),
                tx.player.findUnique({
                    where: { id: toUserId },
                    select: { id: true, name: true }
                })
            ])

            if (!bar) throw new Error('Quest not found')
            if (bar.status !== 'active') throw new Error('Quest is not active')
            if (bar.isSystem) throw new Error('System quests cannot be delegated')
            if (!recipient) throw new Error('Target player not found')

            const senderAssignment = await tx.playerQuest.findUnique({
                where: { playerId_questId: { playerId: fromUserId, questId: barId } },
                select: { status: true }
            })

            const senderHoldsQuest =
                bar.claimedById === fromUserId ||
                (senderAssignment?.status === 'assigned') ||
                // Allow sending an unclaimed private draft you created
                (bar.creatorId === fromUserId && bar.visibility === 'private' && !bar.claimedById)

            if (!senderHoldsQuest) {
                throw new Error('You can only delegate quests you currently hold')
            }

            const recipientAssignment = await tx.playerQuest.findUnique({
                where: { playerId_questId: { playerId: toUserId, questId: barId } },
                select: { status: true }
            })

            if (recipientAssignment?.status === 'completed') {
                throw new Error('That player has already completed this quest')
            }

            // Log the delegation (free — no Vibulon cost)
            await tx.vibulonEvent.create({
                data: {
                    playerId: fromUserId,
                    source: 'bar_share',
                    amount: 0,
                    notes: `Sent quest: ${bar.title} → ${recipient.name}`,
                    archetypeMove: 'NURTURE',
                    questId: barId,
                }
            })

            // Transfer claim / assignment to recipient
            await tx.customBar.update({
                where: { id: barId },
                data: { claimedById: toUserId }
            })

            // Remove sender's active assignment (if present)
            await tx.playerQuest.deleteMany({
                where: {
                    playerId: fromUserId,
                    questId: barId,
                    status: 'assigned',
                }
            })

            // Ensure recipient has an active assignment
            await tx.playerQuest.upsert({
                where: { playerId_questId: { playerId: toUserId, questId: barId } },
                update: {
                    status: 'assigned',
                    assignedAt: new Date(),
                    completedAt: null,
                },
                create: {
                    playerId: toUserId,
                    questId: barId,
                    status: 'assigned',
                    assignedAt: new Date(),
                }
            })

            // Audit trail
            await tx.barShare.create({
                data: {
                    barId,
                    fromUserId,
                    toUserId,
                    note,
                }
            })

            return { success: true }
        })

        revalidatePath('/')
        revalidatePath('/hand')
        revalidatePath('/bars/available')
        return result
    } catch (e: any) {
        console.error('Delegate failed:', e)
        return { error: e?.message || 'Failed to delegate' }
    }
}
