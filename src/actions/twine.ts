'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { parseTwineHtml } from '@/lib/twine-parser'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requirePlayer() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) throw new Error('Not logged in')
    return playerId
}

async function requireAdmin() {
    const playerId = await requirePlayer()
    const adminRole = await db.playerRole.findFirst({
        where: { playerId, role: { key: 'admin' } }
    })
    if (!adminRole) throw new Error('Admin access required')
    return playerId
}

// ---------------------------------------------------------------------------
// ADMIN: Upload Twine Story
// ---------------------------------------------------------------------------

export async function uploadTwineStory(
    _prev: { error?: string; success?: boolean } | null,
    formData: FormData
) {
    try {
        const adminId = await requireAdmin()
        const titleOverride = (formData.get('title') as string || '').trim()
        const sourceText = (formData.get('sourceText') as string || '').trim()

        if (!sourceText) return { error: 'No story content provided.' }

        // Parse Twine HTML
        const parsed = parseTwineHtml(sourceText)
        const title = titleOverride || parsed.title
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

        // Check for duplicate slug
        const existing = slug ? await db.twineStory.findUnique({ where: { slug } }) : null

        const story = await db.twineStory.create({
            data: {
                title,
                slug: existing ? `${slug}-${Date.now()}` : slug,
                sourceType: 'twine_html',
                sourceText,
                parsedJson: JSON.stringify(parsed),
                isPublished: false,
                createdById: adminId,
            }
        })

        console.log(`[TWINE] Story uploaded: "${title}" (${story.id}) - ${parsed.passages.length} passages`)
        revalidatePath('/admin/twine')
        return { success: true, storyId: story.id }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Upload failed'
        console.error('[TWINE] Upload error:', msg)
        return { error: msg }
    }
}

// ---------------------------------------------------------------------------
// ADMIN: Toggle publish
// ---------------------------------------------------------------------------

export async function togglePublishStory(storyId: string) {
    try {
        await requireAdmin()
        const story = await db.twineStory.findUnique({ where: { id: storyId } })
        if (!story) return { error: 'Story not found' }

        await db.twineStory.update({
            where: { id: storyId },
            data: { isPublished: !story.isPublished }
        })

        revalidatePath('/admin/twine')
        revalidatePath('/adventures')
        return { success: true, isPublished: !story.isPublished }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed'
        return { error: msg }
    }
}

// ---------------------------------------------------------------------------
// ADMIN: Create / Delete Binding
// ---------------------------------------------------------------------------

export async function createBinding(
    _prev: { error?: string; success?: boolean } | null,
    formData: FormData
) {
    try {
        const adminId = await requireAdmin()
        const storyId = formData.get('storyId') as string
        const scopeType = formData.get('scopeType') as string || 'passage'
        const scopeId = (formData.get('scopeId') as string || '').trim()
        const actionType = formData.get('actionType') as string
        let payloadTitle = (formData.get('payloadTitle') as string || '').trim()
        const payloadDescription = (formData.get('payloadDescription') as string || '').trim()
        const payloadTags = (formData.get('payloadTags') as string || '').trim()
        const nationId = formData.get('nationId') as string
        const playbookId = formData.get('playbookId') as string

        if (!storyId || !scopeId || !actionType) {
            return { error: 'Missing required fields (story, passage, action)' }
        }

        // Auto-fill title if missing for certain types
        if (!payloadTitle) {
            if (actionType === 'SET_NATION') payloadTitle = `Recommend Nation: ${nationId}`
            else if (actionType === 'SET_ARCHETYPE') payloadTitle = `Recommend Archetype: ${playbookId}`
            else return { error: 'Title is required' }
        }

        const payload = JSON.stringify({
            title: payloadTitle,
            description: payloadDescription,
            tags: payloadTags,
            visibility: 'private',
            nationId,
            playbookId,
        })

        await db.twineBinding.create({
            data: {
                storyId,
                scopeType,
                scopeId,
                actionType,
                payload,
                createdById: adminId,
            }
        })

        console.log(`[TWINE] Binding created: ${actionType} on ${scopeType}="${scopeId}" in story ${storyId}`)
        revalidatePath('/admin/twine')
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed'
        return { error: msg }
    }
}

export async function deleteBinding(bindingId: string) {
    try {
        await requireAdmin()
        await db.twineBinding.delete({ where: { id: bindingId } })
        revalidatePath('/admin/twine')
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed'
        return { error: msg }
    }
}

// ---------------------------------------------------------------------------
// ADMIN: List stories
// ---------------------------------------------------------------------------

export async function listAllStories() {
    return db.twineStory.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { runs: true, bindings: true } }
        }
    })
}

// ---------------------------------------------------------------------------
// PLAYER: List published stories
// ---------------------------------------------------------------------------

export async function listPublishedStories() {
    return db.twineStory.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, createdAt: true }
    })
}

// ---------------------------------------------------------------------------
// PLAYER: Start or resume run (supports quest-scoped runs)
// ---------------------------------------------------------------------------

export async function getOrCreateRun(storyId: string, questId?: string | null, playerIdOverride?: string) {
    const playerId = playerIdOverride || await requirePlayer()

    const story = await db.twineStory.findUnique({
        where: { id: storyId },
        include: { bindings: true }
    })
    if (!story || !story.isPublished) return { error: 'Story not found or not published' }

    const parsed = JSON.parse(story.parsedJson) as { startPassage: string }

    // Find existing run: quest-scoped or standalone
    let run = await db.twineRun.findFirst({
        where: {
            storyId,
            playerId,
            questId: questId || null,
        }
    })

    if (!run) {
        try {
            run = await db.twineRun.create({
                data: {
                    storyId,
                    playerId,
                    questId: questId || null,
                    currentPassageId: parsed.startPassage,
                    visited: JSON.stringify([parsed.startPassage]),
                    firedBindings: '[]',
                }
            })
        } catch (err: any) {
            // RACE CONDITION: If another concurrent request created the run
            // between our findFirst and create, catch the failure and fetch the winner.
            if (err.code === 'P2002') {
                run = await db.twineRun.findFirst({
                    where: {
                        storyId,
                        playerId,
                        questId: questId || null,
                    }
                })
            }

            if (!run) throw err // Rethrow if it wasn't a constraint error or still missing
        }
    }

    return { run, story }
}

// ---------------------------------------------------------------------------
// PLAYER: Advance to a passage (choose a link)
// ---------------------------------------------------------------------------

export async function advanceRun(storyId: string, targetPassageName: string, questId?: string | null, playerIdOverride?: string) {
    const playerId = playerIdOverride || await requirePlayer()

    // Find the run (quest-scoped or standalone)
    const run = await db.twineRun.findFirst({
        where: {
            storyId,
            playerId,
            questId: questId || null,
        }
    })
    if (!run) return { error: 'No active run' }
    if (run.completedAt) return { error: 'Run already completed' }

    const story = await db.twineStory.findUnique({ where: { id: storyId } })
    if (!story) return { error: 'Story not found' }

    const parsed = JSON.parse(story.parsedJson) as {
        passages: { name: string; links: { label: string; target: string }[] }[]
    }

    const currentPassage = parsed.passages.find(p => p.name === run.currentPassageId)
    if (currentPassage) {
        const validLink = currentPassage.links.some(l => l.target === targetPassageName)
        if (!validLink) return { error: 'Invalid link from current passage' }
    }

    // Check for special targets
    if (targetPassageName === 'DASHBOARD') {
        await db.player.update({
            where: { id: playerId },
            data: { onboardingComplete: true }
        })
        try { revalidatePath('/') } catch (e) { }
        return { success: true, redirect: '/', emitted: [], questCompleted: false }
    }

    // Validate the target passage exists
    const targetPassage = parsed.passages.find(p => p.name === targetPassageName)
    if (!targetPassage) return { error: `Passage "${targetPassageName}" not found` }

    // Update run state
    const visited = JSON.parse(run.visited) as string[]
    visited.push(targetPassageName)

    await db.twineRun.update({
        where: { id: run.id },
        data: {
            currentPassageId: targetPassageName,
            visited: JSON.stringify(visited),
        }
    })

    // Execute bindings for this passage
    const bindingResult = await executeBindingsForPassage(storyId, targetPassageName, run.id, playerId)

    // Check for END_ passage (quest auto-completion)
    let questCompleted = false
    if (questId && targetPassageName.startsWith('END_')) {
        questCompleted = await autoCompleteQuestFromTwine(questId, run.id, playerId)
    }

    try {
        revalidatePath(`/adventures/${storyId}/play`)
        revalidatePath('/')
    } catch (e) { }
    return { success: true, emitted: bindingResult, questCompleted, redirect: null as string | null }
}

// ---------------------------------------------------------------------------
// INTERNAL: Auto-complete quest when player reaches an END_ passage
// ---------------------------------------------------------------------------

export async function autoCompleteQuestFromTwine(questId: string, runId: string, playerId: string): Promise<boolean> {
    try {
        // Check if quest is already completed
        const assignment = await db.playerQuest.findFirst({
            where: { playerId, questId, status: 'assigned' }
        })

        if (!assignment) {
            // Already completed or not assigned — skip silently
            return false
        }

        // Mark quest complete
        await db.playerQuest.update({
            where: { id: assignment.id },
            data: {
                status: 'completed',
                inputs: JSON.stringify({ completedViaTwine: true, runId }),
                completedAt: new Date(),
            }
        })

        // Mark run as completed
        await db.twineRun.update({
            where: { id: runId },
            data: { completedAt: new Date() }
        })

        // Grant vibeulon reward
        const quest = await db.customBar.findUnique({ where: { id: questId } })
        const rewardAmount = quest?.reward || 1
        if (rewardAmount > 0) {
            await db.vibulonEvent.create({
                data: {
                    playerId,
                    source: 'quest',
                    amount: rewardAmount,
                    notes: `Twine quest completed: ${quest?.title || questId}`,
                    archetypeMove: 'IGNITE',
                    questId,
                }
            })

            const { mintVibulon } = await import('./economy')
            await mintVibulon(playerId, rewardAmount, {
                source: 'twine_quest',
                id: questId,
                title: quest?.title || 'Twine Quest'
            }, { skipRevalidate: true })
        }

        console.log(`[TWINE] Quest auto-completed: ${questId} for player ${playerId}`)
        try { revalidatePath('/') } catch (e) { }
        return true
    } catch (e) {
        console.error('[TWINE] Auto-complete failed:', e)
        return false
    }
}

// ---------------------------------------------------------------------------
// Get story data for quest modal (no admin required, published check)
// ---------------------------------------------------------------------------

export async function getTwineStoryForQuest(storyId: string) {
    const story = await db.twineStory.findUnique({
        where: { id: storyId },
        include: { bindings: true }
    })
    if (!story || !story.isPublished) return null
    return story
}

// ---------------------------------------------------------------------------
// INTERNAL: Execute bindings for a passage entry
// ---------------------------------------------------------------------------

async function executeBindingsForPassage(
    storyId: string,
    passageName: string,
    runId: string,
    playerId: string
): Promise<string[]> {
    const emitted: string[] = []

    const bindings = await db.twineBinding.findMany({
        where: { storyId, scopeType: 'passage', scopeId: passageName }
    })

    if (bindings.length === 0) return emitted

    // Get the run to check which bindings have already fired
    const run = await db.twineRun.findUnique({ where: { id: runId } })
    if (!run) return emitted
    const firedBindings = JSON.parse(run.firedBindings) as string[]
    const newlyFiredIds: string[] = []

    for (const binding of bindings) {
        if (firedBindings.includes(binding.id)) continue // Already fired

        const payload = JSON.parse(binding.payload) as any

        try {
            if (binding.actionType === 'EMIT_QUEST') {
                await db.customBar.create({
                    data: {
                        creatorId: playerId,
                        title: payload.title,
                        description: payload.description || '',
                        type: 'vibe',
                        reward: 1,
                        visibility: payload.visibility || 'private',
                        status: 'active',
                        inputs: '[]',
                        rootId: 'temp',
                        completionEffects: JSON.stringify({
                            questSource: 'twine',
                            storyId,
                            passageName,
                        })
                    }
                })
                emitted.push(`Quest: ${payload.title}`)
            } else if (binding.actionType === 'EMIT_BAR') {
                await db.customBar.create({
                    data: {
                        creatorId: playerId,
                        title: payload.title,
                        description: payload.description || '',
                        type: 'bar',
                        reward: 0,
                        visibility: payload.visibility || 'private',
                        status: 'active',
                        storyContent: payload.tags || null,
                        inputs: '[]',
                        rootId: 'temp',
                    }
                })
                emitted.push(`BAR: ${payload.title}`)
            } else if (binding.actionType === 'SET_NATION') {
                const nationId = payload.nationId || payload.id
                if (nationId) emitted.push(`Recommendation: ${nationId}`)
            } else if (binding.actionType === 'SET_ARCHETYPE') {
                const playbookId = payload.playbookId || payload.id
                if (playbookId) emitted.push(`Recommendation: ${playbookId}`)
            }

            // Mark binding as newly fired
            newlyFiredIds.push(binding.id)
        } catch (err) {
            console.error(`[TWINE] Binding execution failed for ${binding.id}:`, err)
        }
    }

    // Persist newly fired bindings
    if (newlyFiredIds.length > 0) {
        const updatedFired = [...firedBindings, ...newlyFiredIds]
        await db.twineRun.update({
            where: { id: run.id },
            data: { firedBindings: JSON.stringify(updatedFired) }
        })
        try { revalidatePath('/') } catch (e) { }
    }

    return emitted
}

// ---------------------------------------------------------------------------
// ADMIN: Get story with full details for admin page
// ---------------------------------------------------------------------------

export async function getStoryForAdmin(storyId: string) {
    await requireAdmin()
    const story = await db.twineStory.findUnique({
        where: { id: storyId },
        include: { bindings: { orderBy: { createdAt: 'desc' } } }
    })
    if (!story) return null
    return story
}

/**
 * Mark a Twine run as completed for a specific quest
 */
export async function completeTwineRunForQuest(storyId: string, questId: string) {
    const playerId = await requirePlayer()

    await db.twineRun.update({
        where: {
            storyId_playerId_questId: {
                storyId,
                playerId,
                questId
            }
        },
        data: { completedAt: new Date() }
    })

    console.log("[TWINE] Run completed for quest " + questId + " in story " + storyId)
    revalidatePath('/')
    return { success: true }
}
