'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getLatestFirstAidQuestLensForPlayer } from '@/actions/emotional-first-aid'
import { getQuestGeneratorMode } from '@/lib/mvp-flags'
import { createRequestId, logActionError } from '@/lib/mvp-observability'

function parseTags(raw: string | null) {
    if (!raw) return []
    return raw
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 10)
}

export async function createCustomBar(prevState: any, formData: FormData) {
    const requestId = createRequestId()
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const title = (formData.get('title') as string || '').trim()
    let description = (formData.get('description') as string || '').trim()
    const inputType = formData.get('inputType') as string || 'text'
    const inputLabel = formData.get('inputLabel') as string || 'Response'
    const requestedVisibility = formData.get('visibility') as string || 'private'
    let effectiveVisibility: 'public' | 'private' = requestedVisibility === 'public' ? 'public' : 'private'
    const targetPlayerId = formData.get('targetPlayerId') as string || null
    let moveType = formData.get('moveType') as string || null // wakeUp, cleanUp, growUp, showUp
    let storyContent = formData.get('storyContent') as string || null
    const storyMood = formData.get('storyMood') as string || null
    const applyFirstAidLens = (formData.get('applyFirstAidLens') as string) === 'true'
    const linkedQuestId = ((formData.get('linkedQuestId') as string) || '').trim() || null
    const tags = parseTags((formData.get('tags') as string) || '')

    if (!title) {
        return { error: 'Title is required' }
    }

    try {
        const creator = await db.player.findUnique({
            where: { id: playerId },
            select: { id: true, nationId: true, playbookId: true }
        })
        if (!creator) return { error: 'Player not found' }
        if (!creator.nationId || !creator.playbookId) {
            return { error: 'Please choose both nation and archetype before creating BARs.' }
        }

        let linkedQuest: { id: string, rootId: string | null, title: string } | null = null
        if (linkedQuestId) {
            linkedQuest = await db.customBar.findUnique({
                where: { id: linkedQuestId },
                select: { id: true, rootId: true, title: true }
            })
            if (!linkedQuest) {
                return { error: 'Linked quest not found.' }
            }
            description = description
                ? `[Linked Quest: ${linkedQuest.title}]\n${description}`
                : `[Linked Quest: ${linkedQuest.title}]`
        }

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
        const claimedById = targetPlayerId && effectiveVisibility === 'private'
            ? targetPlayerId  // Private assigned quests go to claimed
            : null            // Public assigned quests stay available but show as "for you"

        let warning: string | null = null
        const rootIdSeed = linkedQuest?.rootId || linkedQuest?.id || 'temp'
        const completionEffects = JSON.stringify({
            mvpMeta: {
                linkedQuestId: linkedQuest?.id || null,
                linkedQuestTitle: linkedQuest?.title || null,
                tags,
                requestId,
                createdAt: new Date().toISOString(),
            }
        })

        // TRANSACTION: If public, burn token. Then create bar.
        const result = await db.$transaction(async (tx) => {
            if (effectiveVisibility === 'public') {
                // Check balance defined by available vibeulons
                const wallet = await tx.vibulon.findMany({
                    where: { ownerId: playerId },
                    orderBy: { createdAt: 'asc' },
                    take: 1
                })

                if (wallet.length < 1) {
                    effectiveVisibility = 'private'
                    warning = 'Insufficient balance to stake public BAR; saved as private.'
                } else {
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
                    visibility: effectiveVisibility,
                    claimedById,
                    moveType: moveType || null,
                    storyPath: 'collective',
                    storyContent: storyContent || null,
                    storyMood: storyMood || null,
                    parentId: linkedQuest?.id || null,
                    completionEffects,
                    rootId: rootIdSeed
                }
            })

            // Update rootId
            if (rootIdSeed === 'temp') {
                await tx.customBar.update({
                    where: { id: newBar.id },
                    data: { rootId: newBar.id }
                })
            }

            // If this is a private assignment, make it appear in the recipient's Active Quests.
            if (claimedById) {
                await tx.playerQuest.upsert({
                    where: {
                        playerId_questId: {
                            playerId: claimedById,
                            questId: newBar.id
                        }
                    },
                    update: {
                        status: 'assigned',
                        assignedAt: new Date(),
                        completedAt: null,
                    },
                    create: {
                        playerId: claimedById,
                        questId: newBar.id,
                        status: 'assigned',
                        assignedAt: new Date(),
                    }
                })

                await tx.barShare.create({
                    data: {
                        barId: newBar.id,
                        fromUserId: playerId,
                        toUserId: claimedById,
                        note: 'Assigned on creation',
                    }
                })
            }

            return newBar
        })

        revalidatePath('/')
        revalidatePath('/hand')
        revalidatePath('/bars/available')
        return { success: true, barId: result.id, visibility: effectiveVisibility, warning }

    } catch (error: any) {
        logActionError(
            { action: 'createCustomBar', requestId, userId: playerId, extra: { linkedQuestId, requestedVisibility } },
            error
        )
        return { error: `Failed to create bar (req: ${requestId})` }
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

export async function getLinkableQuests() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return []

    const quests = await db.customBar.findMany({
        where: {
            status: 'active',
            OR: [
                { creatorId: playerId },
                { assignments: { some: { playerId } } }
            ]
        },
        select: {
            id: true,
            title: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
    })

    const deduped = Array.from(new Map(quests.map((quest) => [quest.id, quest])).values())
    return deduped.map((quest) => ({ id: quest.id, title: quest.title }))
}

export async function createQuestFromWizard(data: any) {
    const requestId = createRequestId()
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

        const creator = await db.player.findUnique({
            where: { id: playerId },
            select: {
                id: true,
                nationId: true,
                playbookId: true,
                hasCreatedFirstQuest: true,
                nation: { select: { name: true } },
                playbook: { select: { name: true } }
            }
        })

        if (!creator) return { error: 'Player not found' }
        if (!creator.nationId || !creator.playbookId) {
            return { error: 'Please choose both nation and archetype before creating quests.' }
        }

        const generatorMode = getQuestGeneratorMode()
        const requestedVisibility = visibility === 'public' ? 'public' : 'private'
        let effectiveVisibility: 'public' | 'private' = requestedVisibility
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16)
        const placeholderTitle = `MVP Quest • ${creator.nation?.name || 'Nation'} × ${creator.playbook?.name || 'Archetype'} • ${timestamp}`
        const finalTitle = (title as string || '').trim() || placeholderTitle

        let finalDescription = (description as string || '').trim()
        if (!finalDescription || generatorMode === 'placeholder') {
            finalDescription = [
                finalDescription,
                `Placeholder quest generated in ${generatorMode} mode.`,
                `Context: ${creator.nation?.name || 'Unknown Nation'} / ${creator.playbook?.name || 'Unknown Archetype'}.`,
                `Timestamp: ${timestamp}.`
            ].filter(Boolean).join('\n\n')
        }

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

        let warning: string | null = null
        const completionEffects = JSON.stringify({
            questGeneratorMode: generatorMode,
            requestId,
            createdAt: new Date().toISOString()
        })

        const newBar = await db.$transaction(async (tx) => {
            if (effectiveVisibility === 'public') {
                const wallet = await tx.vibulon.findMany({
                    where: { ownerId: playerId },
                    orderBy: { createdAt: 'asc' },
                    take: 1
                })

                if (wallet.length < 1) {
                    effectiveVisibility = 'private'
                    warning = 'Insufficient balance to stake public quest; saved as private.'
                } else {
                    await tx.vibulon.delete({ where: { id: wallet[0].id } })
                    await tx.vibulonEvent.create({
                        data: {
                            playerId,
                            source: 'quest_creation_stake',
                            amount: -1,
                            notes: `Staked on public quest: ${finalTitle}`,
                            archetypeMove: 'INITIATE'
                        }
                    })
                }
            }

            const created = await tx.customBar.create({
                data: {
                    creatorId: playerId,
                    title: finalTitle,
                    description: finalDescription,
                    type: category || 'custom',
                    reward: Number(reward) || 1,
                    inputs: JSON.stringify(inputs || []),
                    visibility: effectiveVisibility,
                    status: 'active',
                    moveType: finalMoveType,
                    storyPath: 'collective',
                    rootId: 'temp',
                    storyContent: finalStoryContent,
                    completionEffects
                }
            })

            await tx.customBar.update({
                where: { id: created.id },
                data: { rootId: created.id }
            })

            // Private quests should immediately appear in the creator's active list.
            if (effectiveVisibility === 'private') {
                await tx.playerQuest.upsert({
                    where: {
                        playerId_questId: {
                            playerId,
                            questId: created.id
                        }
                    },
                    update: { status: 'assigned' },
                    create: {
                        playerId,
                        questId: created.id,
                        status: 'assigned'
                    }
                })
            }

            return created
        })

        // Track "First Quest Created" for onboarding
        if (!creator.hasCreatedFirstQuest) {
            const { completeOnboardingStep } = await import('@/actions/onboarding')
            await completeOnboardingStep('firstCreate')
        }

        revalidatePath('/')
        revalidatePath('/hand')
        revalidatePath('/bars/available')
        return { success: true, questId: newBar.id, visibility: effectiveVisibility, warning }

    } catch (error: any) {
        logActionError(
            { action: 'createQuestFromWizard', requestId, userId: playerId },
            error
        )
        return { error: `Failed to create quest (req: ${requestId})` }
    }
}
