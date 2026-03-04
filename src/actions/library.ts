'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { getActiveInstance } from '@/actions/instance'
import { revalidatePath } from 'next/cache'

const REQUEST_TYPES = ['rules', 'ux', 'tech', 'lore', 'social', 'other'] as const
const MAX_DOC_STUBS_PER_INSTANCE_PER_DAY = 10

export type LibraryRequestInput = {
    requestText: string
    requestType?: string
    privacy?: string
    contextJson?: Record<string, unknown>
}

export type ResolveOrSpawnResult =
    | { status: 'resolved'; docNodeId: string; docSlug: string; docTitle: string }
    | { status: 'spawned'; backlogItemId: string; docQuestId: string; docNodeId: string; docSlug: string; docTitle: string }

/**
 * Search DocNodes by query, type, scope. Returns ranked results.
 */
export async function searchDocNodes(params: {
    q?: string
    type?: string
    scope?: string
    limit?: number
}): Promise<{ id: string; slug: string; title: string; score: number }[]> {
    const { q = '', type, scope, limit = 10 } = params

    const nodes = await db.docNode.findMany({
        where: {
            canonicalStatus: { in: ['canonical', 'validated', 'draft'] },
            scope: scope ? scope : { not: 'deprecated' },
            // Exclude request_record stubs from resolution — they contain request text in title,
            // causing false matches (e.g. "how do I" matches any prior request). Only resolve to real docs.
            nodeType: { not: 'request_record' }
        },
        take: limit * 2, // fetch extra for ranking
        orderBy: { updatedAt: 'desc' }
    })

    const qLower = q.toLowerCase().trim()
    const typeLower = type?.toLowerCase()

    const scored = nodes.map((n) => {
        let score = 0
        const tags = parseTags(n.tags)
        const body = (n.bodyRst ?? '').toLowerCase()
        const title = n.title.toLowerCase()

        if (qLower) {
            const words = qLower.split(/\s+/)
            for (const w of words) {
                if (title.includes(w)) score += 3
                if (body.includes(w)) score += 1
                if (tags.some((t) => t.toLowerCase().includes(w))) score += 2
            }
        }
        if (typeLower && tags.some((t) => t.toLowerCase() === typeLower)) score += 2
        if (n.canonicalStatus === 'canonical') score += 2
        if (n.canonicalStatus === 'validated') score += 1

        return { ...n, score }
    })

    return scored
        .filter((s) => s.score > 0 || !qLower)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => ({ id: s.id, slug: s.slug, title: s.title, score: s.score }))
}

function parseTags(tags: string): string[] {
    try {
        const arr = JSON.parse(tags) as unknown
        return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
    } catch {
        return []
    }
}

const MATCH_THRESHOLD = 5 // Require meaningful overlap; avoid single-word false matches

/**
 * Submit a Library Request. Resolves to existing DocNode or spawns BacklogItem + DocNode + DocQuest.
 */
export async function submitLibraryRequest(
    input: LibraryRequestInput
): Promise<{ error?: string; requestId?: string; result?: ResolveOrSpawnResult }> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const requestText = (input.requestText ?? '').trim()
    if (!requestText) return { error: 'Request text is required' }

    const requestType = REQUEST_TYPES.includes(input.requestType as (typeof REQUEST_TYPES)[number])
        ? input.requestType
        : 'other'
    const privacy = input.privacy === 'private' || input.privacy === 'public' ? input.privacy : 'anonymized'

    const instance = await getActiveInstance()
    const instanceId = instance?.id ?? null

    // Spawn cap: max doc stubs per instance per day
    if (instanceId) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const count = await db.docNode.count({
            where: {
                nodeType: 'request_record',
                createdAt: { gte: today }
            }
        })
        if (count >= MAX_DOC_STUBS_PER_INSTANCE_PER_DAY) {
            return { error: 'Daily limit reached. Try again tomorrow.' }
        }
    }

    const contextJson = input.contextJson ? JSON.stringify(input.contextJson) : null

    const request = await db.libraryRequest.create({
        data: {
            createdById: player.id,
            instanceId,
            requestText,
            requestType,
            privacy,
            contextJson,
            status: 'new'
        }
    })

    // Resolve or spawn
    const searchResults = await searchDocNodes({
        q: requestText,
        type: requestType,
        limit: 5
    })

    const best = searchResults[0]
    if (best && best.score >= MATCH_THRESHOLD) {
        await db.libraryRequest.update({
            where: { id: request.id },
            data: { status: 'resolved', resolvedDocNodeId: best.id }
        })
        revalidatePath('/admin/library')
        return {
            requestId: request.id,
            result: {
                status: 'resolved',
                docNodeId: best.id,
                docSlug: best.slug,
                docTitle: best.title
            }
        }
    }

    // Spawn: BacklogItem + DocNode + DocQuest
    const slug = `req-${request.id.slice(-8)}`
    const docNode = await db.docNode.create({
        data: {
            nodeType: 'request_record',
            title: `Request: ${requestText.slice(0, 60)}${requestText.length > 60 ? '...' : ''}`,
            slug,
            scope: 'experimental',
            canonicalStatus: 'draft',
            bodySource: 'generated',
            provenanceJson: JSON.stringify({ libraryRequestId: request.id })
        }
    })

    const severity = requestType === 'tech' || requestType === 'ux' ? 'medium' : 'low'
    const backlogItem = await db.backlogItem.create({
        data: {
            title: `Library: ${requestText.slice(0, 80)}`,
            description: requestText,
            severity,
            area: requestType,
            status: 'new',
            linkedDocNodeId: docNode.id
        }
    })

    // Create DocQuest (CustomBar type 'doc')
    const systemPlayer = await db.player.findFirst({
        where: { invite: { token: { not: undefined } } },
        select: { id: true }
    })
    const creatorId = systemPlayer?.id ?? player.id

    const docQuestInputs = JSON.stringify([
        { key: 'evidenceKind', label: 'Evidence type', type: 'select', required: true, options: ['observation', 'instruction', 'canon_statement'] },
        { key: 'evidenceText', label: 'Your evidence', type: 'textarea', required: true, placeholder: 'Share what you observed, a step-by-step instruction, or a canon statement.' }
    ])
    const isBruisedBanana =
        input.contextJson?.campaignRef === 'bruised-banana' ||
        instance?.campaignRef === 'bruised-banana' ||
        instance?.domainType === 'GATHERING_RESOURCES'
    const docQuest = await db.customBar.create({
        data: {
            creatorId,
            title: `Help document: ${requestText.slice(0, 50)}...`,
            description: `This quest helps resolve a Library Request. Submit evidence (observation, instruction, or canon statement) to build the answer.`,
            type: 'doc',
            reward: 1,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            moveType: 'wakeUp',
            kotterStage: 1,
            inputs: docQuestInputs,
            allyshipDomain: isBruisedBanana ? 'GATHERING_RESOURCES' : undefined,
            docQuestMetadata: JSON.stringify({
                docIntent: 'answer_request',
                targetDocNodeId: docNode.id,
                targetLibraryRequestId: request.id,
                validationChecklist: [],
                barRequirements: { observation: 1, instruction: 1, canon_statement: 1 }
            })
        }
    })

    await db.backlogItem.update({
        where: { id: backlogItem.id },
        data: { linkedDocQuestId: docQuest.id }
    })

    await db.libraryRequest.update({
        where: { id: request.id },
        data: {
            status: 'spawned',
            spawnedBacklogItemId: backlogItem.id,
            spawnedDocQuestId: docQuest.id
        }
    })

    // Auto-assign spawned DocQuest to requestor so it appears in Active Quests
    await db.playerQuest.create({
        data: {
            playerId: player.id,
            questId: docQuest.id,
            status: 'assigned'
        }
    })

    revalidatePath('/admin/library')
    revalidatePath('/')
    return {
        requestId: request.id,
        result: {
            status: 'spawned',
            backlogItemId: backlogItem.id,
            docQuestId: docQuest.id,
            docNodeId: docNode.id,
            docSlug: docNode.slug,
            docTitle: docNode.title
        }
    }
}

/**
 * Admin: resolve a Library Request to a DocNode.
 */
export async function resolveLibraryRequest(
    requestId: string,
    docNodeId: string
): Promise<{ error?: string }> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const withRoles = await db.player.findUnique({
        where: { id: player.id },
        include: { roles: { include: { role: true } } }
    })
    const isAdmin = withRoles?.roles.some((r) => r.role.key === 'admin')
    if (!isAdmin) return { error: 'Forbidden' }

    await db.libraryRequest.update({
        where: { id: requestId },
        data: { status: 'resolved', resolvedDocNodeId: docNodeId }
    })
    revalidatePath('/admin/library')
    return {}
}
