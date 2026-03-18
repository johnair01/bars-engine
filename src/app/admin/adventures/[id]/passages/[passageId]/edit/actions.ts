"use server"

import { db } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logNarrativeQualityFeedback } from "@/actions/narrative-quality-feedback"
import { getFaceForNodeId, getGuidanceForNodeId } from "@/lib/template-library"
import { getActiveInstance } from "@/actions/instance"

function slotOrderServer(nodeId: string): number {
    if (nodeId.startsWith('context'))  return 0 + (parseInt(nodeId.replace(/\D/g, ''), 10) || 0)
    if (nodeId.startsWith('anomaly'))  return 10 + (parseInt(nodeId.replace(/\D/g, ''), 10) || 0)
    if (nodeId === 'choice')           return 20
    if (nodeId === 'response')         return 21
    if (nodeId === 'artifact')         return 22
    return 99
}

export async function linkPassageToQuest(
    passageId: string,
    questId: string
): Promise<{ ok: true } | { error: string }> {
    try {
        await db.passage.update({
            where: { id: passageId },
            data: { linkedQuestId: questId },
        })
        return { ok: true }
    } catch {
        return { error: 'Failed to link quest' }
    }
}

export async function unlinkPassageFromQuest(
    passageId: string
): Promise<{ ok: true } | { error: string }> {
    try {
        await db.passage.update({
            where: { id: passageId },
            data: { linkedQuestId: null },
        })
        return { ok: true }
    } catch {
        return { error: 'Failed to unlink quest' }
    }
}

export async function generateSinglePassage(
    passageId: string
): Promise<{ text: string } | { error: string }> {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

    const [passage, instance] = await Promise.all([
        db.passage.findUnique({
            where: { id: passageId },
            include: { adventure: { include: { passages: true } } },
        }),
        getActiveInstance(),
    ])
    if (!passage?.adventure) return { error: 'Passage not found' }

    const adventure = passage.adventure
    const sorted = [...adventure.passages].sort((a, b) => slotOrderServer(a.nodeId) - slotOrderServer(b.nodeId))
    const currentIdx = sorted.findIndex(p => p.id === passageId)
    const preceding = sorted.slice(Math.max(0, currentIdx - 2), currentIdx)

    const faceInfo = getFaceForNodeId(passage.nodeId)
    const campaignFunction = getGuidanceForNodeId(passage.nodeId)

    try {
        const resp = await fetch(`${backendUrl}/api/agents/generate-passage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                node_id: passage.nodeId,
                face: faceInfo.face,
                campaign_function: campaignFunction,
                campaign_ref: adventure.campaignRef ?? undefined,
                subcampaign_domain: adventure.subcampaignDomain ?? undefined,
                campaign_goal: instance?.targetDescription ?? undefined,
                kotter_stage: instance?.kotterStage ?? undefined,
                preceding_texts: preceding.map(p => p.text),
            }),
            signal: AbortSignal.timeout(30_000),
        })
        if (!resp.ok) return { error: `Backend error: ${resp.status}` }
        const data = await resp.json()
        return { text: data.output.text }
    } catch (e) {
        return { error: String(e) }
    }
}

const updatePassageSchema = z.object({
    passageId: z.string(),
    adventureId: z.string(),
    nodeId: z.string().min(1, "Node ID is required").regex(/^[a-zA-Z0-9_-]+$/, "Node ID must be alphanumeric with underscores or hyphens"),
    text: z.string().min(1, "Passage text is required"),
    choicesJson: z.string().refine(val => {
        try {
            const parsed = JSON.parse(val)
            return Array.isArray(parsed)
        } catch {
            return false
        }
    }, "Choices must be a valid JSON array"),
    logAsFeedback: z
        .string()
        .optional()
        .transform((v) => v === "true" || v === "on" || v === "1")
})

export async function updatePassage(prevState: any, formData: FormData) {
    const data = {
        passageId: formData.get("passageId"),
        adventureId: formData.get("adventureId"),
        nodeId: formData.get("nodeId"),
        text: formData.get("text"),
        choicesJson: formData.get("choices") || "[]",
        logAsFeedback: formData.get("logAsFeedback"),
    }

    const result = updatePassageSchema.safeParse(data)

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
            message: "Please fix the errors below."
        }
    }

    try {
        const passage = await db.passage.findUnique({
            where: { id: result.data.passageId },
            select: { linkedQuestId: true, text: true },
        })
        const beforeText = passage?.text ?? ""

        await db.passage.update({
            where: { id: result.data.passageId },
            data: {
                nodeId: result.data.nodeId,
                text: result.data.text,
                choices: result.data.choicesJson,
            }
        })
        if (passage?.linkedQuestId) {
            await db.customBar.update({
                where: { id: passage.linkedQuestId },
                data: { description: result.data.text },
            })
        }

        if (result.data.logAsFeedback && beforeText !== result.data.text) {
            await logNarrativeQualityFeedback({
                type: "edit",
                passageId: result.data.passageId,
                adventureId: result.data.adventureId,
                nodeId: result.data.nodeId,
                before: beforeText,
                after: result.data.text,
            })
        }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return {
                success: false,
                message: "A passage with this Node ID already exists in this adventure."
            }
        }
        return {
            success: false,
            message: "Failed to update passage. Please try again."
        }
    }

    revalidatePath(`/admin/adventures/${result.data.adventureId}`)
    revalidatePath(`/admin/journeys`)
    redirect(`/admin/adventures/${result.data.adventureId}`)
}
