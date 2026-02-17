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
        const payloadTitle = (formData.get('payloadTitle') as string || '').trim()
        const payloadDescription = (formData.get('payloadDescription') as string || '').trim()
        const payloadTags = (formData.get('payloadTags') as string || '').trim()

        if (!storyId || !scopeId || !actionType || !payloadTitle) {
            return { error: 'Missing required fields (story, passage, action, title)' }
        }

        const payload = JSON.stringify({
            title: payloadTitle,
            description: payloadDescription,
            tags: payloadTags,
            visibility: 'private',
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
// PLAYER: Start or resume run
// ---------------------------------------------------------------------------

export async function getOrCreateRun(storyId: string) {
    const playerId = await requirePlayer()

    const story = await db.twineStory.findUnique({ where: { id: storyId } })
    if (!story || !story.isPublished) return { error: 'Story not found or not published' }

    const parsed = JSON.parse(story.parsedJson) as { startPassage: string }

    let run = await db.twineRun.findUnique({
        where: { storyId_playerId: { storyId, playerId } }
    })

    if (!run) {
        run = await db.twineRun.create({
            data: {
                storyId,
                playerId,
                currentPassageId: parsed.startPassage,
                visited: JSON.stringify([parsed.startPassage]),
                firedBindings: '[]',
            }
        })
    }

    return { run, story }
}

// ---------------------------------------------------------------------------
// PLAYER: Advance to a passage (choose a link)
// ---------------------------------------------------------------------------

export async function advanceRun(storyId: string, targetPassageName: string) {
    const playerId = await requirePlayer()

    const run = await db.twineRun.findUnique({
        where: { storyId_playerId: { storyId, playerId } }
    })
    if (!run) return { error: 'No active run' }

    const story = await db.twineStory.findUnique({ where: { id: storyId } })
    if (!story) return { error: 'Story not found' }

    const parsed = JSON.parse(story.parsedJson) as {
        passages: { name: string; links: { label: string; target: string }[] }[]
    }

    // Validate the target passage exists
    const targetPassage = parsed.passages.find(p => p.name === targetPassageName)
    if (!targetPassage) return { error: `Passage "${targetPassageName}" not found` }

    // Validate there is a link from current passage to target
    const currentPassage = parsed.passages.find(p => p.name === run.currentPassageId)
    if (currentPassage) {
        const validLink = currentPassage.links.some(l => l.target === targetPassageName)
        if (!validLink) return { error: 'Invalid link from current passage' }
    }

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

    revalidatePath(`/adventures/${storyId}/play`)
    return { success: true, emitted: bindingResult }
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

    for (const binding of bindings) {
        if (firedBindings.includes(binding.id)) continue // Already fired

        const payload = JSON.parse(binding.payload) as {
            title: string
            description?: string
            tags?: string
            visibility?: string
        }

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
            }

            // Mark binding as fired
            firedBindings.push(binding.id)
        } catch (err) {
            console.error(`[TWINE] Binding execution failed for ${binding.id}:`, err)
        }
    }

    // Persist fired bindings
    if (emitted.length > 0) {
        await db.twineRun.update({
            where: { id: runId },
            data: { firedBindings: JSON.stringify(firedBindings) }
        })
        revalidatePath('/')
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
