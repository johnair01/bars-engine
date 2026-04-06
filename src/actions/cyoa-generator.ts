'use server'

import { db } from '@/lib/db'
import { requirePlayer, getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { extractPolarityDeterministic } from '@/lib/quest-grammar/polarityExtractor'
import { mapToNarrative } from '@/lib/quest-grammar/narrativeMapper'
import { EmotionChannel } from '@/lib/transformation-move-registry/types'
import { persist321Session } from './charge-metabolism'
import { Metadata321 } from '@/lib/quest-grammar'
import { CmaStory } from '@/lib/modular-cyoa-graph/types'
import { generateDeterministicNodeText } from '@/lib/modular-cyoa-graph/deterministic-filler'
import { DEFAULT_MODULAR_COASTER_TEMPLATE_ID } from '@/lib/narrative-templates/registry'

/**
 * Initializes a new CYOA draft from a source BAR and an Adventure Template.
 */
export async function createCyoaDraft(data: {
    barId: string
    templateId: string
    campaignId?: string
    instanceId?: string
    mission?: string
}) {
    const userId = await requirePlayer()

    const bar = await db.customBar.findUnique({
        where: { id: data.barId }
    })
    if (!bar) throw new Error('BAR not found')

    const template = await db.adventureTemplate.findUnique({
        where: { id: data.templateId }
    })
    if (!template) throw new Error('Template not found')

    // Extract polarity and initial narrative mapping
    const polarity = extractPolarityDeterministic(bar.title)
    const initialCharge: EmotionChannel = 'neutrality'

    const narrative = polarity
        ? mapToNarrative(polarity, initialCharge, { mission: data.mission })
        : { raw_text: bar.description, actor: 'you', state: 'Tension', object: bar.title }

    // Initial graph structure (CmaStory)
    const initialGraph = {
        title: bar.title,
        description: bar.description,
        nodes: [],
        edges: [],
        metadata: {
            sourceBarId: bar.id,
            templateId: template.id,
            mission: data.mission,
            initialNarrative: narrative
        }
    }

    const draft = await db.cmaGeneratorDraft.create({
        data: {
            userId,
            sourceBarId: bar.id,
            templateId: template.id,
            campaignId: data.campaignId,
            instanceId: data.instanceId,
            graphJson: JSON.stringify(initialGraph),
            emotionalCharge: initialCharge,
            status: 'draft'
        }
    })

    return draft
}

/**
 * Persists updates to an existing CYOA draft.
 */
export async function updateCyoaDraft(draftId: string, data: {
    graphJson?: string
    emotionalCharge?: string
    gmId?: string
    status?: string
}) {
    const userId = await requirePlayer()

    const draft = await db.cmaGeneratorDraft.update({
        where: { id: draftId, userId },
        data
    })

    return draft
}

/**
 * Retrieves a draft with its linked BAR and Template details.
 */
export async function getCyoaDraft(draftId: string) {
    const userId = await requirePlayer()

    const draft = await db.cmaGeneratorDraft.findUnique({
        where: { id: draftId, userId },
        include: {
            sourceBar: true,
            template: true
        }
    })

    return draft
}

export async function generateNodeTextDeterministically(draftId: string, nodeId: string) {
    const userId = await requirePlayer()
    const draft = await db.cmaGeneratorDraft.findUnique({
        where: { id: draftId, userId },
        include: { sourceBar: true }
    })
    if (!draft || !draft.sourceBar) throw new Error('Draft or source BAR not found')

    const story = JSON.parse(draft.graphJson) as CmaStory
    const node = story.nodes.find((n: any) => n.id === nodeId)
    if (!node) throw new Error('Node not found')

    const missionStr = (draft as any).mission || 'Direct Action'
    const text = generateDeterministicNodeText(
        (node.metadata as any)?.moveId,
        (node.metadata as any)?.coasterTag,
        {
            title: draft.sourceBar.title,
            description: draft.sourceBar.description || '',
            charge: draft.emotionalCharge || 'neutrality',
            mission: missionStr
        }
    )

    return text
}

/**
 * Converts a validated CmaGeneratorDraft into a live, playable Adventure.
 * Can be called by the owner or an admin/steward (for approval).
 */
export async function finalizeCyoaDraft(draftId: string, options?: { adminBypass?: boolean }) {
    const player = await getCurrentPlayer()
    if (!player) throw new Error('Authentication required')

    const draft = await db.cmaGeneratorDraft.findUnique({
        where: { id: draftId },
        include: { sourceBar: true }
    })
    if (!draft) throw new Error('Draft not found')

    // Authority check: Owner or Admin
    const isAdmin = player.roles.some((r: any) => r.role.key === 'admin' || r.role.key === 'steward')
    if (draft.userId !== player.id && !isAdmin && !options?.adminBypass) {
        throw new Error('Unauthorized to finalize this draft')
    }

    const story = JSON.parse(draft.graphJson) as CmaStory
    const slug = `pfcg-${draft.id.slice(-8)}-${Date.now().toString().slice(-4)}`

    // 1. Create the Adventure
    const adventure = await db.adventure.create({
        data: {
            slug,
            title: story.title || 'Untitled Adventure',
            description: story.description || 'Generated via PFCG',
            status: 'ACTIVE',
            visibility: 'PRIVATE_QUEST',
            startNodeId: story.startId,
            adventureType: 'CYOA_INTAKE',
            campaignRef: draft.campaignId || undefined,
        }
    })

    // Instance ↔ Adventure is modeled on Instance (portalAdventureId), not on Adventure.
    if (draft.instanceId) {
        await db.instance.update({
            where: { id: draft.instanceId },
            data: { portalAdventureId: adventure.id },
        })
    }

    // 2. Create Passages for all nodes
    const passageCreates = story.nodes.map((node: any) => {
        const metadata = node.metadata as any

        const choices = story.edges
            .filter((e: any) => e.from === node.id)
            .map((e: any) => ({
                label: e.label || 'Continue',
                target: e.to,
                metadata: e.metadata
            }))

        return db.passage.create({
            data: {
                adventureId: adventure.id,
                nodeId: node.id,
                text: metadata?.renderedText || node.title || ' No content.',
                choices: JSON.stringify(choices),
                linkedQuestId: draft.sourceBarId
            }
        })
    })

    await db.$transaction(passageCreates)

    if (draft.sourceBarId) {
        await db.questAdventureLink.create({
            data: {
                questId: draft.sourceBarId,
                adventureId: adventure.id,
                moveType: 'showUp'
            }
        })
    }

    await db.cmaGeneratorDraft.update({
        where: { id: draft.id },
        data: { status: 'completed' }
    })

    revalidatePath('/')
    revalidatePath('/adventures')
    revalidatePath('/admin/cyoa-proposals')

    return { success: true, adventureId: adventure.id, slug: adventure.slug }
}

/**
 * Submits a draft to a campaign's moderation queue.
 */
export async function submitCyoaDraftToCampaign(draftId: string, rationale: string) {
    const userId = await requirePlayer()

    const draft = await db.cmaGeneratorDraft.findUnique({
        where: { id: draftId, userId }
    })
    if (!draft) throw new Error('Draft not found')

    return db.cmaGeneratorDraft.update({
        where: { id: draftId },
        data: {
            status: 'pending_review',
            rationale,
            submittedAt: new Date()
        }
    })
}

/**
 * Lists stories pending review for stewards.
 */
export async function listCyoaProposals(filters?: { status?: string, instanceId?: string }) {
    await requirePlayer() // Basic auth check, finer check in UI if needed

    return db.cmaGeneratorDraft.findMany({
        where: {
            status: filters?.status || 'pending_review',
            instanceId: filters?.instanceId
        },
        include: {
            user: true,
            sourceBar: true
        },
        orderBy: { submittedAt: 'desc' }
    })
}

/**
 * Reject a story proposal.
 */
export async function rejectCyoaProposal(draftId: string) {
    const player = await getCurrentPlayer()
    if (!player) throw new Error('Unauthorized')

    const isAdmin = player.roles.some((r: any) => r.role.key === 'admin' || r.role.key === 'steward')
    if (!isAdmin) throw new Error('Steward access required')

    return db.cmaGeneratorDraft.update({
        where: { id: draftId },
        data: { status: 'rejected' }
    })
}

/**
 * High-level bridge to create a draft directly from a 321 outcome.
 */
export async function createCyoaDraftFrom321(data: {
    metadata: Metadata321
    phase2: any
    phase3: any
    shadow321Name?: any
}) {
    const userId = await requirePlayer()

    // 1. Create the base BAR for the draft
    const bar = await db.customBar.create({
        data: {
            creatorId: userId,
            title: data.metadata.title || 'Untitled Story Seed',
            description: data.metadata.description || 'No description provided.',
            type: 'insight',
            reward: 1,
            visibility: 'private',
            status: 'active',
            claimedById: userId,
        }
    })

    // 2. Persist the session
    await persist321Session({
        phase3Snapshot: JSON.stringify(data.phase3),
        phase2Snapshot: JSON.stringify(data.phase2),
        outcome: 'bar_created',
        linkedBarId: bar.id,
        shadow321Name: data.shadow321Name
    })

    // 3. Create the draft (modular coaster — `resolveNarrativeTemplate('modular_coaster')`)
    return createCyoaDraft({
        barId: bar.id,
        templateId: DEFAULT_MODULAR_COASTER_TEMPLATE_ID,
        mission: data.phase2?.alignedAction || 'Direct Action'
    })
}
