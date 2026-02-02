'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { STARTER_BARS } from '@/lib/bars'

const CompleteBarSchema = z.object({
    barId: z.string(),
    inputs: z.record(z.string(), z.any()),
})

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

    let barDef = STARTER_BARS.find(b => b.id === barId)

    // Look up in CustomBar if not found
    if (!barDef) {
        const customBar = await db.customBar.findUnique({
            where: { id: barId }
        })
        if (customBar && customBar.status === 'active') {
            barDef = {
                id: customBar.id,
                title: customBar.title,
                description: customBar.description,
                type: customBar.type as 'vibe' | 'story',
                reward: customBar.reward,
                inputs: JSON.parse(customBar.inputs || '[]'),
                unique: false
            }
        }
    }

    if (!barDef) {
        return { error: 'Unknown bar' }
    }

    try {
        const starterPack = await db.starterPack.findUnique({
            where: { playerId }
        })

        if (!starterPack) {
            return { error: 'Starter pack not found' }
        }

        const data = JSON.parse(starterPack.data) as { completedBars: { id: string; inputs: Record<string, any> }[] }

        // Check if already completed
        if (data.completedBars.some(cb => cb.id === barId)) {
            return { error: 'Already completed' }
        }

        // Add to completed
        data.completedBars.push({ id: barId, inputs })

        // Calculate reward
        let reward = barDef.reward
        if (barId === 'bar_signups' && inputs.roles) {
            reward = inputs.roles.length // +1 per signup
        }

        // Prepare Vibulon creation data
        const vibulonsToCreate: { ownerId: string, originSource: string, originId: string, originTitle: string }[] = []
        for (let i = 0; i < reward; i++) {
            vibulonsToCreate.push({
                ownerId: playerId,
                originSource: 'quest_reward',
                originId: barDef.id,
                originTitle: barDef.title
            })
        }

        await db.$transaction(async (tx) => {
            // 1. Update Player's StarterPack (Data only)
            await tx.starterPack.update({
                where: { playerId },
                data: {
                    data: JSON.stringify(data),
                    // initialVibeulons: { increment: reward } // DEPRECATED: No longer using integer balance
                }
            })

            // 2. Mint Reward Vibulons
            if (vibulonsToCreate.length > 0) {
                await tx.vibulon.createMany({ data: vibulonsToCreate })
            }

            // 3. Claim Staked Vibulons (if any attached to this bar)
            // This allows delegated quests to release their attached "bribe"
            const stakedCount = await tx.vibulon.count({ where: { stakedOnBarId: barId } })
            if (stakedCount > 0) {
                await tx.vibulon.updateMany({
                    where: { stakedOnBarId: barId },
                    data: { ownerId: playerId, stakedOnBarId: null }
                })
            }

            // 4. Log Event
            await tx.vibulonEvent.create({
                data: {
                    playerId,
                    source: 'starter_quest',
                    amount: reward + stakedCount,
                    notes: `Completed: ${barDef.title} (Reward: ${reward}, Staked: ${stakedCount})`
                }
            })
        })

        revalidatePath('/')
        return { success: true, reward }

    } catch (e) {
        console.error(e)
        return { error: 'Failed to complete quest' }
    }
}
