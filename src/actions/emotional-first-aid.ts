'use server'

import { db } from '@/lib/db'
import { unlockBlessedObject } from '@/lib/blessed-objects'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
    DEFAULT_FIRST_AID_TOOLS,
    EmotionalFirstAidToolDTO,
    FIRST_AID_MINT_AMOUNT,
    FIRST_AID_MINT_THRESHOLD,
    normalizeEmergencyTag,
    recommendFirstAidToolKey,
    VIBES_EMERGENCY_OPTIONS,
    VibesEmergencyTag,
} from '@/lib/emotional-first-aid'
import { queryActiveSummonedDaemonId } from '@/lib/daemon-active-state'

type SessionSummary = {
    id: string
    toolName: string | null
    issueTag: string | null
    stuckBefore: number
    stuckAfter: number | null
    delta: number | null
    mintedAmount: number
    completedAt: string | null
    applyToQuesting: boolean
}

function toFirstAidErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        const message = error.message
        if (
            message.includes('does not exist') ||
            message.includes('P2021') ||
            message.includes('P2022')
        ) {
            return 'Emotional First Aid schema is not ready yet. A deploy schema sync is in progress.'
        }
        return message || fallback
    }
    return fallback
}

export interface EmotionalFirstAidContext {
    player: {
        id: string
        name: string
        archetypeName: string | null
        emotionalFirstAid: string | null
    }
    tools: EmotionalFirstAidToolDTO[]
    quickOptions: typeof VIBES_EMERGENCY_OPTIONS
    mintThreshold: number
    recentSession: SessionSummary | null
}

type AdminToolInput = {
    id?: string
    key: string
    name: string
    description: string
    icon?: string | null
    moveType?: string
    tags?: string
    twineLogic: string
    isActive?: boolean
    sortOrder?: number
}

function clampStuckness(value: number) {
    if (!Number.isFinite(value)) return 5
    return Math.max(0, Math.min(10, Math.round(value)))
}

function parseTags(raw: string | null): VibesEmergencyTag[] {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
            return parsed.map((tag) => normalizeEmergencyTag(String(tag)))
        }
    } catch {
        // Fall through to empty list.
    }
    return []
}

function toToolDTO(tool: {
    id: string
    key: string
    name: string
    description: string
    icon: string | null
    moveType: string
    tags: string
    twineLogic: string
    isActive: boolean
    sortOrder: number
}): EmotionalFirstAidToolDTO {
    return {
        id: tool.id,
        key: tool.key,
        name: tool.name,
        description: tool.description,
        icon: tool.icon,
        moveType: tool.moveType,
        tags: parseTags(tool.tags),
        twineLogic: tool.twineLogic,
        isActive: tool.isActive,
        sortOrder: tool.sortOrder,
    }
}

function normalizeToolKey(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80)
}

function parseTagsInput(value?: string): VibesEmergencyTag[] {
    if (!value) return []
    const trimmed = value.trim()
    if (!trimmed) return []

    // Accept JSON array or comma-separated text from admin UI.
    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed.map((item) => normalizeEmergencyTag(String(item)))
            }
        } catch {
            return []
        }
    }

    return trimmed
        .split(',')
        .map((tag) => normalizeEmergencyTag(tag.trim()))
        .filter((tag, index, arr) => arr.indexOf(tag) === index)
}

function parseTwineLogic(raw: string) {
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.passages) || typeof parsed.startPassageId !== 'string') {
        throw new Error('Twine logic must include startPassageId and passages[]')
    }
    return parsed
}

async function requireAdmin() {
    const player = await getCurrentPlayer()
    if (!player) throw new Error('Not authenticated')
    const isAdmin = player.roles.some((r) => r.role.key === 'admin')
    if (!isAdmin) throw new Error('Not authorized')
    return player
}

async function ensureDefaultFirstAidTools() {
    for (const seed of DEFAULT_FIRST_AID_TOOLS) {
        await db.emotionalFirstAidTool.upsert({
            where: { key: seed.key },
            update: {
                name: seed.name,
                description: seed.description,
                icon: seed.icon,
                moveType: seed.moveType,
                tags: JSON.stringify(seed.tags),
                twineLogic: JSON.stringify(seed.twineLogic),
                sortOrder: seed.sortOrder,
                isActive: true,
            },
            create: {
                key: seed.key,
                name: seed.name,
                description: seed.description,
                icon: seed.icon,
                moveType: seed.moveType,
                tags: JSON.stringify(seed.tags),
                twineLogic: JSON.stringify(seed.twineLogic),
                sortOrder: seed.sortOrder,
                isActive: true,
            }
        })
    }
}

export async function getEmotionalFirstAidContext(): Promise<EmotionalFirstAidContext | { error: string }> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    try {
        await ensureDefaultFirstAidTools()

        const [toolsRaw, recentSession] = await Promise.all([
            db.emotionalFirstAidTool.findMany({
                where: { isActive: true },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
            }),
            db.emotionalFirstAidSession.findFirst({
                where: { playerId: player.id },
                orderBy: { createdAt: 'desc' },
                include: { tool: true }
            })
        ])

        return {
            player: {
                id: player.id,
                name: player.name,
                archetypeName: player.archetype?.name || null,
                emotionalFirstAid: player.archetype?.emotionalFirstAid || null,
            },
            tools: toolsRaw.map(toToolDTO),
            quickOptions: VIBES_EMERGENCY_OPTIONS,
            mintThreshold: FIRST_AID_MINT_THRESHOLD,
            recentSession: recentSession ? {
                id: recentSession.id,
                toolName: recentSession.tool?.name || null,
                issueTag: recentSession.issueTag,
                stuckBefore: recentSession.stuckBefore,
                stuckAfter: recentSession.stuckAfter,
                delta: recentSession.delta,
                mintedAmount: recentSession.mintedAmount,
                completedAt: recentSession.completedAt ? recentSession.completedAt.toISOString() : null,
                applyToQuesting: recentSession.applyToQuesting,
            } : null,
        }
    } catch (error: unknown) {
        return { error: toFirstAidErrorMessage(error, 'Failed to load Emotional First Aid Kit.') }
    }
}

export async function startEmotionalFirstAidSession(input: {
    issueTag?: string
    issueText?: string
    stuckBefore: number
    contextQuestId?: string | null
}) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    try {
        await ensureDefaultFirstAidTools()

        const issueTag = normalizeEmergencyTag(input.issueTag)
        const stuckBefore = clampStuckness(input.stuckBefore)

        const toolsRaw = await db.emotionalFirstAidTool.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
        })

        if (toolsRaw.length === 0) {
            return { error: 'No first aid tools are currently active.' }
        }

        const tools = toolsRaw.map(toToolDTO)
        const recommendedToolKey = recommendFirstAidToolKey(
            issueTag,
            tools.map((tool) => ({ key: tool.key, tags: tool.tags }))
        )

        const recommendedTool = tools.find((tool) => tool.key === recommendedToolKey) || tools[0]

        const session = await db.emotionalFirstAidSession.create({
            data: {
                playerId: player.id,
                issueTag,
                issueText: input.issueText?.trim() || null,
                contextQuestId: input.contextQuestId || null,
                stuckBefore,
                recommendedToolKey: recommendedTool.key,
                toolId: recommendedTool.id,
            }
        })

        revalidatePath('/emotional-first-aid')

        return {
            success: true,
            sessionId: session.id,
            recommendedToolId: recommendedTool.id,
            recommendedToolKey: recommendedTool.key,
        }
    } catch (error: unknown) {
        return { error: toFirstAidErrorMessage(error, 'Failed to start first-aid session.') }
    }
}

export async function completeEmotionalFirstAidSession(input: {
    sessionId: string
    toolId: string
    stuckAfter: number
    applyToQuesting?: boolean
    notes?: string
    twineVariables?: Record<string, unknown>
}) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    try {
        const session = await db.emotionalFirstAidSession.findUnique({
            where: { id: input.sessionId },
            include: { tool: true }
        })

        if (!session || session.playerId !== player.id) {
            return { error: 'Session not found' }
        }
        if (session.completedAt) {
            return { error: 'Session already completed' }
        }

        const toolUsed = await db.emotionalFirstAidTool.findUnique({
            where: { id: input.toolId }
        })
        const is321Completion = toolUsed?.key === 'shadow-321'

        const stuckAfter = clampStuckness(input.stuckAfter)
        const delta = session.stuckBefore - stuckAfter
        const mintedAmount = delta >= FIRST_AID_MINT_THRESHOLD ? FIRST_AID_MINT_AMOUNT : 0

        let barDraft: { id: string; nextAction: string; contextQuestId?: string | null } | undefined

        const blessedDaemonId = await queryActiveSummonedDaemonId(player.id)
        const blessedMetadata =
            blessedDaemonId != null ? ({ daemonId: blessedDaemonId } as const) : undefined

        await db.$transaction(async (tx) => {
            await tx.emotionalFirstAidSession.update({
                where: { id: session.id },
                data: {
                    toolId: input.toolId,
                    stuckAfter,
                    delta,
                    mintedAmount,
                    applyToQuesting: !!input.applyToQuesting,
                    notes: input.notes?.trim() || null,
                    twineSnapshot: input.twineVariables
                        ? JSON.stringify(input.twineVariables)
                        : null,
                    completedAt: new Date(),
                }
            })

            // PF: Unlock blessed object for EFA completion (one per player)
            const existingEfa = await tx.blessedObjectEarned.findFirst({
                where: { playerId: player.id, source: 'efa' },
            })
            if (!existingEfa) {
                await tx.blessedObjectEarned.create({
                    data: {
                        playerId: player.id,
                        source: 'efa',
                        metadata: blessedMetadata ?? undefined,
                    },
                })
            }

            if (mintedAmount > 0) {
                await tx.vibulonEvent.create({
                    data: {
                        playerId: player.id,
                        source: 'emotional_first_aid',
                        amount: mintedAmount,
                        notes: `Emotional First Aid success (${toolUsed?.name || session.tool?.name || 'protocol'}) Δ${delta}`,
                        archetypeMove: 'CLEAN_UP_PROTOCOL',
                        questId: session.contextQuestId || null,
                    }
                })

                await tx.vibulon.createMany({
                    data: Array.from({ length: mintedAmount }).map(() => ({
                        ownerId: player.id,
                        creatorId: player.id,
                        originSource: 'emotional_first_aid',
                        originId: session.id,
                        originTitle: `Emotional First Aid: ${toolUsed?.name || session.tool?.name || 'Protocol'}`,
                    }))
                })
            }

            // Gold star: 321 Shadow Process always mints 1 vibeulon for completing the process
            if (is321Completion) {
                // PF: Unlock blessed object for 321 completion (one per player)
                const existing321 = await tx.blessedObjectEarned.findFirst({
                    where: { playerId: player.id, source: '321' },
                })
                if (!existing321) {
                    await tx.blessedObjectEarned.create({
                        data: {
                            playerId: player.id,
                            source: '321',
                            metadata: blessedMetadata ?? undefined,
                        },
                    })
                }
                await tx.vibulonEvent.create({
                    data: {
                        playerId: player.id,
                        source: 'shadow_321_completion',
                        amount: 1,
                        notes: '321 Shadow Process completed (gold star)',
                        archetypeMove: 'CLEAN_UP_PROTOCOL',
                        questId: session.contextQuestId || null,
                    }
                })
                await tx.vibulon.create({
                    data: {
                        ownerId: player.id,
                        creatorId: player.id,
                        originSource: 'shadow_321_completion',
                        originId: session.id,
                        originTitle: '321 Shadow Process (gold star)',
                    }
                })
            }

            // GP-CLB: When applyToQuesting, create BAR draft with nextAction
            if (input.applyToQuesting) {
                const toolName = toolUsed?.name || session.tool?.name || 'Emotional First Aid'
                const nextAction =
                    'Take one small step toward your quest. What is the next smallest honest action?'
                const bar = await tx.customBar.create({
                    data: {
                        creatorId: player.id,
                        title: `Clean Up: ${toolName}`,
                        description: `Session relief: stuck ${session.stuckBefore} → ${stuckAfter}. ${session.notes || ''}`.trim(),
                        type: 'vibe',
                        moveType: 'cleanUp',
                        visibility: 'private',
                        status: 'active',
                        claimedById: player.id,
                        agentMetadata: JSON.stringify({
                            sourceType: 'cleanup',
                            nextAction,
                            efaSessionId: session.id,
                            contextQuestId: session.contextQuestId,
                        }),
                    },
                })
                barDraft = { id: bar.id, nextAction, contextQuestId: session.contextQuestId }
            }
        })

        if (blessedDaemonId) {
            try {
                const d = await db.daemon.findUnique({
                    where: { id: blessedDaemonId },
                    select: { channel: true, altitude: true },
                })
                if (d) {
                    const { appendDaemonEvolutionLog } = await import('@/lib/daemon-evolution')
                    await appendDaemonEvolutionLog(blessedDaemonId, {
                        event: is321Completion ? 'efa_321_tool_completed' : 'efa_session_completed',
                        channelBefore: d.channel,
                        channelAfter: d.channel,
                        altitudeBefore: d.altitude,
                        altitudeAfter: d.altitude,
                    })
                }
            } catch (e) {
                console.warn('[emotional-first-aid] daemon evolution skipped', e)
            }
        }

        revalidatePath('/')
        revalidatePath('/wallet')
        revalidatePath('/emotional-first-aid')

        const goldStarAmount = is321Completion ? 1 : 0
        const totalMinted = mintedAmount + goldStarAmount

        return {
            success: true,
            delta,
            mintedAmount: totalMinted,
            qualifiesForMint: totalMinted > 0,
            threshold: FIRST_AID_MINT_THRESHOLD,
            barDraft,
        }
    } catch (error: unknown) {
        return { error: toFirstAidErrorMessage(error, 'Failed to complete first-aid session.') }
    }
}

export async function getLatestFirstAidQuestLensForPlayer(playerId: string) {
    try {
        const [player, session] = await Promise.all([
            db.player.findUnique({
                where: { id: playerId },
                include: { archetype: true }
            }),
            db.emotionalFirstAidSession.findFirst({
                where: {
                    playerId,
                    completedAt: { not: null },
                    applyToQuesting: true,
                },
                orderBy: { completedAt: 'desc' },
                include: { tool: true }
            })
        ])

        if (!session) return null

        const toolName = session.tool?.name || 'Emotional First Aid'
        const issueTag = session.issueTag || 'other'
        const archetypeProtocol = player?.archetype?.emotionalFirstAid || null
        const archetypeName = player?.archetype?.name || null

        const promptParts = [
            `Player recently completed "${toolName}" to clear stuckness.`,
            `Stuckness shift: ${session.delta ?? 0}.`,
            `Current blockage profile: ${issueTag}.`,
            archetypeProtocol
                ? `Archetype clean-up protocol (${archetypeName}): ${archetypeProtocol}.`
                : null,
            'Favor emotionally grounded, executable clean-up framing when designing or phrasing the quest.',
        ].filter(Boolean)

        return {
            toolName,
            issueTag,
            delta: session.delta ?? 0,
            preferredMoveType: 'cleanUp' as const,
            archetypeProtocol,
            prompt: promptParts.join(' '),
            publicHint: `${toolName}${archetypeName ? ` • ${archetypeName}` : ''}`,
        }
    } catch {
        return null
    }
}

export async function getAdminFirstAidTools() {
    await requireAdmin()
    try {
        await ensureDefaultFirstAidTools()

        const tools = await db.emotionalFirstAidTool.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
        })

        return tools.map(toToolDTO)
    } catch {
        return []
    }
}

export async function upsertFirstAidTool(input: AdminToolInput) {
    const admin = await requireAdmin()

    const key = normalizeToolKey(input.key)
    if (!key) return { error: 'Tool key is required' }
    if (!input.name?.trim()) return { error: 'Tool name is required' }
    if (!input.description?.trim()) return { error: 'Tool description is required' }

    let twineLogic: string
    try {
        twineLogic = JSON.stringify(parseTwineLogic(input.twineLogic))
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Invalid Twine logic JSON'
        return { error: message }
    }

    const tags = parseTagsInput(input.tags)

    const payload = {
        key,
        name: input.name.trim(),
        description: input.description.trim(),
        icon: input.icon?.trim() || null,
        moveType: input.moveType?.trim() || 'cleanUp',
        tags: JSON.stringify(tags),
        twineLogic,
        isActive: input.isActive !== false,
        sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
    }

    try {
        let toolId: string
        if (input.id) {
            const updated = await db.emotionalFirstAidTool.update({
                where: { id: input.id },
                data: payload
            })
            toolId = updated.id
        } else {
            const upserted = await db.emotionalFirstAidTool.upsert({
                where: { key },
                update: payload,
                create: payload
            })
            toolId = upserted.id
        }

        await db.adminAuditLog.create({
            data: {
                adminId: admin.id,
                action: 'first_aid_tool_upsert',
                target: toolId,
                payload: JSON.stringify(payload),
            }
        })

        revalidatePath('/admin/first-aid')
        revalidatePath('/emotional-first-aid')

        return { success: true, id: toolId }
    } catch (error: unknown) {
        return { error: toFirstAidErrorMessage(error, 'Failed to save first-aid tool.') }
    }
}

export async function deleteFirstAidTool(id: string) {
    const admin = await requireAdmin()

    try {
        const existing = await db.emotionalFirstAidTool.findUnique({ where: { id } })
        if (!existing) return { error: 'Tool not found' }

        await db.emotionalFirstAidTool.delete({ where: { id } })

        await db.adminAuditLog.create({
            data: {
                adminId: admin.id,
                action: 'first_aid_tool_delete',
                target: id,
                payload: JSON.stringify({ key: existing.key, name: existing.name }),
            }
        })

        revalidatePath('/admin/first-aid')
        revalidatePath('/emotional-first-aid')
        return { success: true }
    } catch (error: unknown) {
        return { error: toFirstAidErrorMessage(error, 'Failed to delete first-aid tool.') }
    }
}
