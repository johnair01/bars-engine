"use server"

import { db } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
    simulateRowsAfterCreatePassage,
    validateFullAdventurePassagesGraph,
} from "@/lib/story-graph/adventurePassagesGraph"

const createPassageSchema = z.object({
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
    linkFromJson: z.string().optional(),
})

type LinkFrom = { mode: 'after'; passageId: string; nodeId: string } | { mode: 'branch'; passageId: string; nodeId: string; choiceIndex?: number }

export async function createPassage(prevState: any, formData: FormData) {
    const data = {
        adventureId: formData.get("adventureId"),
        nodeId: formData.get("nodeId"),
        text: formData.get("text"),
        choicesJson: formData.get("choices") || "[]",
        linkFromJson: formData.get("linkFrom") || "",
    }

    const result = createPassageSchema.safeParse(data)

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
            message: "Please fix the errors below."
        }
    }

    let linkFrom: LinkFrom | null = null
    if (result.data.linkFromJson?.trim()) {
        try {
            linkFrom = JSON.parse(result.data.linkFromJson) as LinkFrom
            if (!linkFrom || !linkFrom.passageId || !linkFrom.nodeId) linkFrom = null
        } catch {
            linkFrom = null
        }
    }

    const [adventure, existingPassages] = await Promise.all([
        db.adventure.findUnique({
            where: { id: result.data.adventureId },
            select: { startNodeId: true },
        }),
        db.passage.findMany({
            where: { adventureId: result.data.adventureId },
            select: { nodeId: true, choices: true },
        }),
    ])

    const existingRows = existingPassages.map((p) => ({
        nodeId: p.nodeId,
        choicesJson: p.choices || "[]",
    }))

    let linkSim: { mode: "after" | "branch"; sourceNodeId: string; choiceIndex?: number } | null = null
    if (linkFrom) {
        const fp = await db.passage.findUnique({
            where: { id: linkFrom.passageId, adventureId: result.data.adventureId },
            select: { nodeId: true },
        })
        if (!fp) {
            return {
                success: false,
                message: "Connect-from passage was not found in this adventure.",
            }
        }
        linkSim = {
            mode: linkFrom.mode,
            sourceNodeId: fp.nodeId,
            choiceIndex: linkFrom.mode === "branch" ? linkFrom.choiceIndex : undefined,
        }
    }

    const simulated = simulateRowsAfterCreatePassage(
        existingRows,
        result.data.nodeId,
        result.data.choicesJson,
        linkSim
    )
    const graphCheck = validateFullAdventurePassagesGraph(simulated, adventure?.startNodeId ?? null)
    if (!graphCheck.ok) {
        return {
            success: false,
            message: graphCheck.errors.map((e) => e.message).join(" "),
        }
    }

    let passage
    try {
        passage = await db.passage.create({
            data: {
                adventureId: result.data.adventureId,
                nodeId: result.data.nodeId,
                text: result.data.text,
                choices: result.data.choicesJson,
            }
        })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return {
                success: false,
                message: "A passage with this Node ID already exists in this adventure."
            }
        }
        return {
            success: false,
            message: "Failed to create passage. Please try again."
        }
    }

    const newNodeId = passage.nodeId

    if (linkFrom) {
        const fromPassage = await db.passage.findUnique({
            where: { id: linkFrom.passageId, adventureId: result.data.adventureId }
        })
        if (fromPassage) {
            let choices: { text: string; targetId: string }[] = []
            try {
                choices = JSON.parse(fromPassage.choices || '[]')
            } catch {
                /* ignore */
            }
            if (linkFrom.mode === 'after') {
                const hasLink = choices.some((c) => c.targetId === newNodeId)
                if (!hasLink) {
                    choices.push({ text: 'Continue', targetId: newNodeId })
                    await db.passage.update({
                        where: { id: fromPassage.id },
                        data: { choices: JSON.stringify(choices) }
                    })
                }
            } else if (linkFrom.mode === 'branch' && typeof linkFrom.choiceIndex === 'number') {
                if (linkFrom.choiceIndex >= 0 && linkFrom.choiceIndex < choices.length) {
                    choices[linkFrom.choiceIndex] = { ...choices[linkFrom.choiceIndex], targetId: newNodeId }
                    await db.passage.update({
                        where: { id: fromPassage.id },
                        data: { choices: JSON.stringify(choices) }
                    })
                }
            }
        }
    }

    revalidatePath(`/admin/adventures/${result.data.adventureId}`)
    redirect(`/admin/adventures/${result.data.adventureId}`)
}
