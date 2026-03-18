'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { LedgerService } from '@/lib/economy-ledger'
import { parseTwineHtml } from '@/lib/twine-parser'
import {
    parseDiagnosticState,
    serializeDiagnosticState,
    addSignal,
    addSignals,
    resetSignals,
    computeNationRecommendation,
    computeArchetypeRecommendation,
    confirmSelection,
} from '@/lib/game/diagnostic-engine'
import { normalizeTwineStory } from '@/lib/schemas'
import { isCampaignQuest } from '@/lib/quest-scope'
import {
    irToTwee,
    validateIrStory,
    type IRNode,
    type IRStory,
} from '@/lib/twine-authoring-ir'
import { parseTwee } from '@/lib/twee-parser'

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

/** Serialize passage for client (advanceRun/revertRun return). Canonical shape for PassageRenderer. */
function serializePassageForClient(p: {
    name?: string
    pid?: string
    text?: string
    cleanText?: string
    links?: { label?: string; target?: string; name?: string; link?: string }[]
    tags?: string[]
}) {
    const links = (p.links ?? []).map((l) => ({
        label: l.label ?? l.name ?? l.target ?? '',
        target: l.target ?? l.link ?? '',
    }))
    return {
        pid: p.pid ?? p.name ?? '',
        name: p.name ?? '',
        text: p.text ?? p.cleanText ?? '',
        cleanText: p.cleanText ?? p.text ?? '',
        links,
        tags: p.tags ?? [],
    }
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
// ADMIN: Toggle template flag
// ---------------------------------------------------------------------------

export async function toggleTemplateStory(storyId: string) {
    try {
        await requireAdmin()
        const story = await db.twineStory.findUnique({ where: { id: storyId } })
        if (!story) return { error: 'Story not found' }

        await db.twineStory.update({
            where: { id: storyId },
            data: { isTemplate: !story.isTemplate }
        })

        revalidatePath('/admin/twine')
        return { success: true, isTemplate: !story.isTemplate }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed'
        return { error: msg }
    }
}

// ---------------------------------------------------------------------------
// ADMIN: Create story from template (clone structure)
// ---------------------------------------------------------------------------

export async function createStoryFromTemplate(templateId: string, newTitle?: string): Promise<{ success?: boolean; storyId?: string; error?: string }> {
    try {
        const adminId = await requireAdmin()
        const template = await db.twineStory.findUnique({ where: { id: templateId } })
        if (!template) return { error: 'Template not found' }
        if (!template.isTemplate) return { error: 'Story is not marked as template' }

        const baseTitle = newTitle?.trim() || `${template.title} (copy)`
        const slug = baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const existing = slug ? await db.twineStory.findUnique({ where: { slug } }) : null
        const finalSlug = existing ? `${slug}-${Date.now()}` : slug

        const story = await db.twineStory.create({
            data: {
                title: baseTitle,
                slug: finalSlug || null,
                sourceType: template.sourceType,
                sourceText: template.sourceText,
                parsedJson: template.parsedJson,
                irDraft: template.irDraft,
                isPublished: false,
                isTemplate: false,
                createdById: adminId,
            }
        })

        revalidatePath('/admin/twine')
        return { success: true, storyId: story.id }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed'
        return { error: msg }
    }
}

// ---------------------------------------------------------------------------
// ADMIN: Publish IR draft to TwineStory
// ---------------------------------------------------------------------------

function parseIrDraft(irDraft: string): { nodes: IRNode[]; title?: string; startNode?: string } {
    const raw = JSON.parse(irDraft) as IRStory | IRNode[]
    if (Array.isArray(raw)) {
        return { nodes: raw }
    }
    const story = raw as IRStory
    const nodes = story.story_nodes ?? []
    const meta = story.story_metadata
    return {
        nodes,
        title: meta?.title,
        startNode: meta?.start_node,
    }
}

export async function publishIrToTwineStory(
    storyId: string,
    irDraft?: string
): Promise<{ success?: boolean; error?: string; passageCount?: number }> {
    try {
        const adminId = await requireAdmin()
        const story = await db.twineStory.findUnique({ where: { id: storyId } })
        if (!story) return { error: 'Story not found' }

        const draft = irDraft ?? story.irDraft
        if (!draft || draft.trim() === '') {
            return { error: 'No irDraft provided and story has no saved irDraft' }
        }

        let nodes: IRNode[]
        let title: string | undefined
        let startNode: string | undefined
        try {
            const parsed = parseIrDraft(draft)
            nodes = parsed.nodes
            title = parsed.title
            startNode = parsed.startNode
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Invalid irDraft JSON'
            return { error: `Invalid irDraft: ${msg}` }
        }

        const validation = validateIrStory(nodes)
        if (!validation.valid) {
            return { error: `Validation failed: ${validation.errors.join('; ')}` }
        }

        const tweeSource = irToTwee(nodes, {
            title: title ?? story.title,
            startNode: startNode ?? nodes[0]?.node_id ?? 'Start',
        })

        const parsed = parseTwee(tweeSource)

        await db.$transaction([
            db.twineStory.update({
                where: { id: storyId },
                data: {
                    sourceText: tweeSource,
                    parsedJson: JSON.stringify(parsed),
                    sourceType: 'twee',
                    ...(irDraft ? { irDraft } : {}),
                },
            }),
            db.compiledTweeVersion.create({
                data: {
                    storyId,
                    tweeContent: tweeSource,
                    createdById: adminId,
                },
            }),
        ])

        revalidatePath('/admin/twine')
        revalidatePath('/adventures')
        return { success: true, passageCount: parsed.passages.length }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Publish failed'
        return { error: msg }
    }
}

// ---------------------------------------------------------------------------
// ADMIN: Save IR draft (no publish)
// ---------------------------------------------------------------------------

export async function saveIrDraft(
    storyId: string,
    irDraft: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireAdmin()
        const story = await db.twineStory.findUnique({ where: { id: storyId } })
        if (!story) return { error: 'Story not found' }

        await db.twineStory.update({
            where: { id: storyId },
            data: { irDraft },
        })

        revalidatePath('/admin/twine')
        revalidatePath(`/admin/twine/${storyId}`)
        revalidatePath(`/admin/twine/${storyId}/ir`)
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Save failed'
        return { error: msg }
    }
}

// ---------------------------------------------------------------------------
// ADMIN: List compiled versions for rollback
// ---------------------------------------------------------------------------

export async function getCompiledVersionsForStory(storyId: string) {
  await requireAdmin()
  return db.compiledTweeVersion.findMany({
    where: { storyId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

// ---------------------------------------------------------------------------
// ADMIN: Rollback to compiled version
// ---------------------------------------------------------------------------

export async function rollbackToVersion(
    storyId: string,
    versionId: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireAdmin()
        const version = await db.compiledTweeVersion.findFirst({
            where: { id: versionId, storyId },
        })
        if (!version) return { error: 'Version not found' }

        const parsed = parseTwee(version.tweeContent)
        await db.twineStory.update({
            where: { id: storyId },
            data: {
                sourceText: version.tweeContent,
                parsedJson: JSON.stringify(parsed),
                sourceType: 'twee',
            },
        })

        revalidatePath('/admin/twine')
        revalidatePath(`/admin/twine/${storyId}`)
        revalidatePath(`/admin/twine/${storyId}/ir`)
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Rollback failed'
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
        const signalKey = formData.get('signalKey') as string
        const signalAmount = parseInt(formData.get('signalAmount') as string || '1', 10)
        const resetScope = formData.get('resetScope') as string || 'all'

        if (!storyId || !scopeId || !actionType) {
            return { error: 'Missing required fields (story, passage, action)' }
        }

        // Build payload based on action type
        const diagnosticActions = ['ADD_SIGNAL', 'COMPUTE_NATION', 'COMPUTE_ARCHETYPE', 'CONFIRM_NATION', 'CONFIRM_ARCHETYPE', 'RESET_SIGNALS']

        if (diagnosticActions.includes(actionType)) {
            // Auto-generate titles for diagnostic actions
            if (!payloadTitle) {
                if (actionType === 'ADD_SIGNAL') payloadTitle = `+${signalAmount} ${signalKey}`
                else if (actionType === 'COMPUTE_NATION') payloadTitle = 'Compute Nation Recommendation'
                else if (actionType === 'COMPUTE_ARCHETYPE') payloadTitle = 'Compute Archetype Recommendation'
                else if (actionType === 'CONFIRM_NATION') payloadTitle = 'Confirm Nation Selection'
                else if (actionType === 'CONFIRM_ARCHETYPE') payloadTitle = 'Confirm Archetype Selection'
                else if (actionType === 'RESET_SIGNALS') payloadTitle = `Reset Signals (${resetScope})`
            }
        } else if (!payloadTitle) {
            if (actionType === 'SET_NATION') payloadTitle = `Recommend Nation: ${nationId}`
            else if (actionType === 'SET_ARCHETYPE') payloadTitle = `Recommend Archetype: ${playbookId}`
            else return { error: 'Title is required' }
        }

        // Build payload object
        const payloadObj: Record<string, any> = {
            title: payloadTitle,
            description: payloadDescription,
            tags: payloadTags,
            visibility: 'private',
        }

        if (actionType === 'ADD_SIGNAL') {
            payloadObj.key = signalKey
            payloadObj.amount = signalAmount
        } else if (actionType === 'RESET_SIGNALS') {
            payloadObj.scope = resetScope
        } else {
            payloadObj.nationId = nationId
            payloadObj.playbookId = playbookId
        }

        const payload = JSON.stringify(payloadObj)

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

    const rawParsed = JSON.parse(story.parsedJson)
    let parsed
    try {
        parsed = normalizeTwineStory(rawParsed)
    } catch (e: any) {
        console.error('Failed to validate Twine JSON:', e)
        return { error: 'Story data is corrupted.' }
    }

    const startPassageId = parsed.startPassage

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
                    currentPassageId: startPassageId,
                    visited: JSON.stringify([startPassageId]),
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

    // Ensure quest is assigned for adventure/certification quests (handles resume of runs created before auto-assign)
    if (questId) {
        try {
            await db.playerQuest.upsert({
                where: { playerId_questId: { playerId, questId } },
                create: {
                    playerId,
                    questId,
                    status: 'assigned',
                    assignedAt: new Date(),
                },
                update: {},
            })
        } catch (err: unknown) {
            // RACE: concurrent request may have created the record; unique constraint = already assigned
            if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') return
            throw err
        }
    }

    return { run, story }
}

// ---------------------------------------------------------------------------
// PLAYER: Advance to a passage (choose a link)
// ---------------------------------------------------------------------------

export async function advanceRun(
    storyId: string,
    targetPassageName: string,
    questId?: string | null,
    playerIdOverride?: string,
    threadId?: string | null,
    skipRevalidate?: boolean
) {
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

    // Execute bindings for this passage (skip revalidate when advancing to FEEDBACK — prevents kick-to-dashboard)
    const bindingResult = await executeBindingsForPassage(storyId, targetPassageName, run.id, playerId, skipRevalidate || targetPassageName === 'FEEDBACK')

    // Check for end state: explicit END_ prefix OR passage has no outgoing links (dead end)
    // Campaign quests cannot be completed via Twine end passages; they must be completed on the gameboard
    let questCompleted = false
    const isEndPassage = targetPassageName.startsWith('END_') || targetPassage.links.length === 0
    if (questId && isEndPassage) {
        const isCampaign = await isCampaignQuest(questId)
        if (!isCampaign) {
            questCompleted = await autoCompleteQuestFromTwine(questId, run.id, playerId, threadId, targetPassageName)
        }
    }

    if (!skipRevalidate) {
        try {
            revalidatePath(`/adventures/${storyId}/play`)
            // Skip revalidating home when navigating to FEEDBACK — reduces unnecessary re-fetches that can cause navigate-away (cert-feedback-stability)
            if (targetPassageName !== 'FEEDBACK') {
                revalidatePath('/')
            }
        } catch (e) { }
    }

    // API-first: return passage data when advancing to FEEDBACK so client can render without router.refresh()
    const passage =
        targetPassageName === 'FEEDBACK'
            ? serializePassageForClient(targetPassage as { name?: string; pid?: string; text?: string; cleanText?: string; links?: { label?: string; target?: string; name?: string; link?: string }[]; tags?: string[] })
            : undefined

    return {
        success: true,
        emitted: bindingResult,
        questCompleted,
        redirect: null as string | null,
        ...(passage && { currentPassageId: targetPassageName, visited, passage }),
    }
}

// ---------------------------------------------------------------------------
// PLAYER: Revert to previous passage (Back button)
// ---------------------------------------------------------------------------

export async function revertRun(storyId: string, questId?: string | null, playerIdOverride?: string, skipRevalidate?: boolean) {
    const playerId = playerIdOverride || await requirePlayer()

    const run = await db.twineRun.findFirst({
        where: {
            storyId,
            playerId,
            questId: questId || null,
        }
    })

    if (!run) return { error: 'No active run' }

    const visited = JSON.parse(run.visited) as string[]
    if (visited.length <= 1) return { error: 'At the beginning of the story' }

    const currentBeforeRevert = visited[visited.length - 1]
    visited.pop()
    const prevPassageName = visited[visited.length - 1]

    await db.twineRun.update({
        where: { id: run.id },
        data: {
            currentPassageId: prevPassageName,
            visited: JSON.stringify(visited),
            completedAt: null, // Allow un-finishing if traversing back
        }
    })

    // If it's a quest-scoped run, we might need to "un-complete" the quest
    // But this is risky for rewards. For now, we only un-complete the TwineRun.
    // If the quest is already marked complete in PlayerQuest, the UI might still show 'Completed'
    // but the Twine traversal will be unlocked.

    if (!skipRevalidate) {
        try {
            revalidatePath(`/adventures/${storyId}/play`)
            // Skip revalidating home when reverting from FEEDBACK — same rationale as advanceRun
            if (currentBeforeRevert !== 'FEEDBACK') {
                revalidatePath('/')
            }
        } catch (e) { }
    }

    // API-first: return passage data when reverting from FEEDBACK so client can render without router.refresh()
    let passage: ReturnType<typeof serializePassageForClient> | undefined
    if (currentBeforeRevert === 'FEEDBACK') {
        const story = await db.twineStory.findUnique({ where: { id: storyId } })
        if (story) {
            const parsed = JSON.parse(story.parsedJson) as { passages: { name?: string; pid?: string; text?: string; cleanText?: string; links?: { label?: string; target?: string; name?: string; link?: string }[]; tags?: string[] }[] }
            const prevPassage = parsed.passages?.find((p) => p.name === prevPassageName || p.pid === prevPassageName)
            if (prevPassage) {
                passage = serializePassageForClient(prevPassage)
            }
        }
    }

    return {
        success: true,
        currentPassageId: prevPassageName,
        visited,
        ...(passage && { passage }),
    }
}

// ---------------------------------------------------------------------------
// INTERNAL: Auto-complete quest when player reaches an END_ passage
// ---------------------------------------------------------------------------

export async function autoCompleteQuestFromTwine(questId: string, runId: string, playerId: string, threadId?: string | null, endPassageName?: string): Promise<boolean> {
    try {
        // Fetch quest to check for inputs
        const quest = await db.customBar.findUnique({ where: { id: questId } })
        if (!quest) return false

        let hasActualInputs = false
        if (quest.inputs) {
            try {
                const parsedInputs = typeof quest.inputs === 'string' ? JSON.parse(quest.inputs) : quest.inputs
                if (Array.isArray(parsedInputs) && parsedInputs.length > 0) {
                    hasActualInputs = true
                }
            } catch (e) { }
        }

        // If the quest requires manual inputs, do NOT auto-complete it. Let the UI submit handle it.
        if (hasActualInputs) return false

        // Check if quest is already completed
        const assignment = await db.playerQuest.findFirst({
            where: { playerId, questId, status: 'assigned' }
        })

        if (!assignment) {
            // Already completed or not assigned — skip silently
            return false
        }

        // Derive completionType from end passage for Strengthen the Residency (END_DONATE -> donate, etc.)
        let completionType: string | undefined
        if (questId === 'starter-strengthen-residency' && endPassageName?.startsWith('END_')) {
            completionType = endPassageName.slice(4).toLowerCase() // END_DONATE -> donate
        }

        const completionInputs = { completedViaTwine: true, runId, ...(completionType && { completionType }) }

        // Mark quest complete
        await db.playerQuest.update({
            where: { id: assignment.id },
            data: {
                status: 'completed',
                inputs: JSON.stringify(completionInputs),
                completedAt: new Date(),
            }
        })

        // Mark run as completed
        await db.twineRun.update({
            where: { id: runId },
            data: { completedAt: new Date() }
        })

        // Grant vibeulon reward
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

            // Ledger Integration: MINT to global reserve
            await LedgerService.mint(playerId, rewardAmount, {
                questId,
                questTitle: quest?.title,
                runId,
                source: 'twine_completion'
            })
        }

        // Run completion effects (e.g. deriveAvatarFromExisting, strengthenResidency by completionType)
        const { runCompletionEffectsForQuest } = await import('@/actions/quest-engine')
        await runCompletionEffectsForQuest(playerId, questId, completionInputs)

        // Record verification completion for backlog sync (O)
        if (quest.backlogPromptPath) {
            try {
                const { recordVerificationCompletion } = await import('@/actions/verification-backlog')
                await recordVerificationCompletion(questId, playerId, quest.backlogPromptPath)
            } catch (e) {
                console.error('[TWINE] Backlog recording failed:', e)
            }
        }

        // Advance thread if quest is in a thread
        if (threadId) {
            const { advanceThreadForPlayer } = await import('@/actions/quest-thread')
            await advanceThreadForPlayer(playerId, threadId, questId)
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
    playerId: string,
    skipRevalidate?: boolean
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

    // Load diagnostic state for scoring actions
    let diagState = parseDiagnosticState(run.diagnosticState)
    let diagDirty = false

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

                // ── Diagnostic Actions ──────────────────────────────
            } else if (binding.actionType === 'ADD_SIGNAL') {
                // payload: { signals: { fire: 1, water: 1 } } or { key: "fire", amount: 1 }
                if (payload.signals && typeof payload.signals === 'object') {
                    diagState = addSignals(diagState, payload.signals)
                } else if (payload.key) {
                    diagState = addSignal(diagState, payload.key, payload.amount ?? 1)
                }
                diagDirty = true
                emitted.push(`Signal: ${JSON.stringify(payload.signals || { [payload.key]: payload.amount ?? 1 })}`)

            } else if (binding.actionType === 'COMPUTE_NATION') {
                diagState = computeNationRecommendation(diagState)
                diagDirty = true
                emitted.push(`NationRecommendation: ${diagState.recommendedNation}`)

            } else if (binding.actionType === 'COMPUTE_ARCHETYPE') {
                diagState = computeArchetypeRecommendation(diagState)
                diagDirty = true
                emitted.push(`ArchetypeRecommendation: ${diagState.recommendedArchetype}`)

            } else if (binding.actionType === 'CONFIRM_NATION') {
                const nationId = diagState.recommendedNation || payload.nationId
                if (nationId) {
                    // Look up the actual DB nation record by name/id
                    const nation = await db.nation.findFirst({
                        where: {
                            OR: [
                                { id: nationId },
                                { name: { equals: nationId, mode: 'insensitive' } },
                            ]
                        }
                    })
                    if (nation) {
                        await db.player.update({
                            where: { id: playerId },
                            data: { nationId: nation.id }
                        })
                        diagState = confirmSelection(diagState, 'nation')
                        diagDirty = true
                        emitted.push(`ConfirmedNation: ${nation.name}`)
                    }
                }

            } else if (binding.actionType === 'CONFIRM_ARCHETYPE') {
                const archetypeKey = diagState.recommendedArchetype || payload.archetypeId
                if (archetypeKey) {
                    const playbook = await db.archetype.findFirst({
                        where: {
                            OR: [
                                { id: archetypeKey },
                                { name: { equals: archetypeKey, mode: 'insensitive' } },
                            ]
                        }
                    })
                    if (playbook) {
                        await db.player.update({
                            where: { id: playerId },
                            data: { archetypeId: playbook.id }
                        })
                        diagState = confirmSelection(diagState, 'archetype')
                        diagDirty = true
                        emitted.push(`ConfirmedArchetype: ${playbook.name}`)
                    }
                }

            } else if (binding.actionType === 'RESET_SIGNALS') {
                const scope = payload.scope || 'all'
                diagState = resetSignals(diagState, scope)
                diagDirty = true
                emitted.push(`ResetSignals: ${scope}`)
            }

            // Mark binding as newly fired
            newlyFiredIds.push(binding.id)
        } catch (err) {
            console.error(`[TWINE] Binding execution failed for ${binding.id}:`, err)
        }
    }

    // Persist newly fired bindings + diagnostic state
    if (newlyFiredIds.length > 0 || diagDirty) {
        const updatedFired = [...firedBindings, ...newlyFiredIds]
        await db.twineRun.update({
            where: { id: run.id },
            data: {
                firedBindings: JSON.stringify(updatedFired),
                ...(diagDirty ? { diagnosticState: serializeDiagnosticState(diagState) } : {}),
            }
        })
        if (!skipRevalidate) {
            try { revalidatePath('/') } catch (e) { }
        }
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
