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


// Core logic function (Testable)
export async function completeQuestLogic(playerId: string, barId: string, inputs: Record<string, any>) {
    // 1. Resolve Bar Definition from DB
    const barDef = await db.customBar.findUnique({
        where: { id: barId }
    })

    if (!barDef) {
        return { error: 'Unknown bar' }
    }

    // 2. Check PlayerQuest Status
    const existingQuest = await db.playerQuest.findUnique({
        where: {
            playerId_questId: {
                playerId,
                questId: barId
            }
        }
    })

    if (existingQuest?.status === 'completed') {
        return { error: 'Already completed' }
    }

    // 3. Calculate Reward
    let reward = barDef.reward
    if (barId === 'bar_signups' && inputs.roles) {
        reward = inputs.roles.length // Specific logic for signups quest
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

    // 4. Execute Transaction
    await db.$transaction(async (tx) => {
        // Upsert PlayerQuest as completed
        await tx.playerQuest.upsert({
            where: {
                playerId_questId: {
                    playerId,
                    questId: barId
                }
            },
            update: {
                status: 'completed',
                inputs: JSON.stringify(inputs),
                completedAt: new Date()
            },
            create: {
                playerId,
                questId: barId,
                status: 'completed',
                inputs: JSON.stringify(inputs),
                completedAt: new Date(),
                assignedAt: new Date()
            }
        })

        // Mint Reward Vibulons
        if (vibulonsToCreate.length > 0) {
            await tx.vibulon.createMany({ data: vibulonsToCreate })
        }

        // Claim Staked Vibulons (if any attached to this bar)
        // This allows delegated quests to release their attached "bribe" when completed
        const stakedCount = await tx.vibulon.count({ where: { stakedOnBarId: barId } })
        if (stakedCount > 0) {
            await tx.vibulon.updateMany({
                where: { stakedOnBarId: barId },
                data: { ownerId: playerId, stakedOnBarId: null }
            })
        }

        // Log Event
        await tx.vibulonEvent.create({
            data: {
                playerId,
                source: 'starter_quest',
                amount: reward + stakedCount,
                notes: `Completed: ${barDef.title} (Reward: ${reward}, Staked: ${stakedCount})`
            }
        })
    })

    return { success: true, reward }
}

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
        const result = await completeQuestLogic(playerId, barId, inputs)

        if (result.success) {
            revalidatePath('/')
        }

        return result

    } catch (e) {
        console.error(e)
        return { error: 'Failed to complete quest' }
    }
}
