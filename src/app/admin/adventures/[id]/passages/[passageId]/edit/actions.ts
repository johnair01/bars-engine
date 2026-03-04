"use server"

import { db } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
    }, "Choices must be a valid JSON array")
})

export async function updatePassage(prevState: any, formData: FormData) {
    const data = {
        passageId: formData.get("passageId"),
        adventureId: formData.get("adventureId"),
        nodeId: formData.get("nodeId"),
        text: formData.get("text"),
        choicesJson: formData.get("choices") || "[]",
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
            select: { linkedQuestId: true },
        })
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
