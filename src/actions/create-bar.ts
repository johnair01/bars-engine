'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getLatestFirstAidQuestLensForPlayer } from '@/actions/emotional-first-aid'

export async function createCustomBar(prevState: any, formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const title = formData.get('title') as string
    let description = formData.get('description') as string
    const inputType = formData.get('inputType') as string || 'text'
    const inputLabel = formData.get('inputLabel') as string || 'Response'
    const visibility = formData.get('visibility') as string || 'public' // 'public' or 'private'
    const targetPlayerId = formData.get('targetPlayerId') as string || null
    let moveType = formData.get('moveType') as string || null // wakeUp, cleanUp, growUp, showUp
    let storyContent = formData.get('storyContent') as string || null
    const storyMood = formData.get('storyMood') as string || null
    const applyFirstAidLens = (formData.get('applyFirstAidLens') as string) === 'true'

    if (!title) {
        return { error: 'Title is required' }
    }

    try {
        if (applyFirstAidLens) {
            const lens = await getLatestFirstAidQuestLensForPlayer(playerId)
            if (lens) {
                description = `${description}\n\nFirst Aid Lens: ${lens.publicHint}`
                storyContent = storyContent
                    ? `${storyContent}\n\n${lens.prompt}`
                    : lens.prompt
                if (!moveType) moveType = lens.preferredMoveType
            }
        }

        // Create simple vibe bar with one input
        const inputs = JSON.stringify([
            { key: 'response', label: inputLabel, type: inputType, placeholder: '' }
        ])

        // If a specific player is assigned:
        // - For private quests: goes directly to their claimed hand
        // - For public quests: quest is claimable but "for" that player
        const claimedById = targetPlayerId && visibility === 'private'
            ? targetPlayerId  // Private assigned quests go to claimed
            : null            // Public assigned quests stay available but show as "for you"

        // TRANSACTION: If public, burn token. Then create bar.
        const result = await db.$transaction(async (tx) => {
            if (visibility === 'public') {
                // Check balance defined by available vibeulons
                const wallet = await tx.vibulon.findMany({
                    where: { ownerId: playerId },
                    orderBy: { createdAt: 'asc' },
                    take: 1
                })

                if (wallet.length < 1) {
                    throw new Error('Need 1 Vibeulon to stake a Public Quest')
                }

                const tokenToBurn = wallet[0]

                // Burn the token
                await tx.vibulon.delete({
                    where: { id: tokenToBurn.id }
                })

                // Log the burn
                await tx.vibulonEvent.create({
                    data: {
                        playerId,
                        source: 'quest_creation_stake',
                        amount: -1,
                        notes: `Staked on public quest: ${title}`,
                        archetypeMove: 'INITIATE' // General move for starting something
                    }
                })
            }

            // Create the Bar
            const newBar = await tx.customBar.create({
                data: {
                    creatorId: playerId,
                    title,
                    description,
                    type: 'vibe',
                    reward: 1, // Pay it forward
                    inputs,
                    visibility,
                    claimedById,
                    moveType: moveType || null,
                    storyPath: 'collective',
                    storyContent: storyContent || null,
                    storyMood: storyMood || null,
                    rootId: 'temp' // Placeholder, updated below
                }
            })

            // Update rootId
            await tx.customBar.update({
                where: { id: newBar.id },
                data: { rootId: newBar.id }
            })

            return newBar
        })

        revalidatePath('/')
        return { success: true }

    } catch (e: any) {
        console.error("Create bar failed:", e?.message)
        // Return explicit error message if it was our balance check
        if (e.message.includes('Need 1 Vibeulon')) {
            return { error: e.message }
        }
        return { error: 'Failed to create bar' }
    }
}

export async function getCustomBars() {
    return db.customBar.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getActivePlayers() {
    return db.player.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' }
    })
}

export async function createQuestFromWizard(data: any) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    try {
        const {
            title, description, category, visibility,
            reward, inputs, lifecycleFraming, approach, applyFirstAidLens
        } = data

        // Validation
        if (!title) return { error: 'Missing title' }

        // Logic for Public Quests (Cost to Create)
        if (visibility === 'public') {
            await db.$transaction(async (tx) => {
                const wallet = await tx.vibulon.findMany({
                    where: { ownerId: playerId },
                    take: 1
                })

                if (wallet.length < 1) {
                    throw new Error('Need 1 Vibeulon to stake a Public Quest')
                }

                await tx.vibulon.delete({ where: { id: wallet[0].id } })
                await tx.vibulonEvent.create({
                    data: {
                        playerId,
                        source: 'quest_creation_stake',
                        amount: -1,
                        notes: `Staked on public quest: ${title}`,
                        archetypeMove: 'INITIATE'
                    }
                })
            })
        }

        let finalDescription = description || ''
        let finalMoveType = lifecycleFraming || null
        let finalStoryContent = approach ? `Approach: ${approach}` : null

        if (applyFirstAidLens) {
            const lens = await getLatestFirstAidQuestLensForPlayer(playerId)
            if (lens) {
                finalDescription = `${finalDescription}\n\nFirst Aid Lens: ${lens.publicHint}`
                finalStoryContent = finalStoryContent
                    ? `${finalStoryContent}\n\n${lens.prompt}`
                    : lens.prompt
                if (!finalMoveType) finalMoveType = lens.preferredMoveType
            }
        }

        // Create the Bar
        const newBar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description: finalDescription,
                type: category || 'custom',
                reward: Number(reward) || 1,
                inputs: JSON.stringify(inputs || []),
                visibility: visibility || 'public',
                status: 'active',
                moveType: finalMoveType,
                storyPath: 'collective',
                rootId: 'temp',
                storyContent: finalStoryContent,
                twineStoryId: data.twineStoryId || null,
            }
        })

        await db.customBar.update({
            where: { id: newBar.id },
            data: { rootId: newBar.id }
        })

        // Track "First Quest Created" for onboarding
        const player = await db.player.findUnique({ where: { id: playerId } })
        if (player && !player.hasCreatedFirstQuest) {
            const { completeOnboardingStep } = await import('@/actions/onboarding')
            await completeOnboardingStep('firstCreate')
        }

        revalidatePath('/')
        return { success: true, questId: newBar.id }

    } catch (e: any) {
        console.error("Wizard create failed:", e)
        return { error: e.message || 'Failed to create quest' }
    }
}
