"use server"

import { db } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
    }, "Choices must be a valid JSON array")
})

export async function createPassage(prevState: any, formData: FormData) {
    const data = {
        adventureId: formData.get("adventureId"),
        nodeId: formData.get("nodeId"),
        text: formData.get("text"),
        choicesJson: formData.get("choices") || "[]",
    }

    const result = createPassageSchema.safeParse(data)

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
            message: "Please fix the errors below."
        }
    }

    let passage;
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
        if (error.code === 'P2002') { // Unique constraint on adventureId + nodeId
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

    revalidatePath(`/admin/adventures/${result.data.adventureId}`)
    redirect(`/admin/adventures/${result.data.adventureId}`)
}
