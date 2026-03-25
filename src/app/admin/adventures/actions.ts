"use server"

import { db } from "@/lib/db"
import { promoteDraftToActive as promoteService } from "@/lib/template-library"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const createAdventureSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    description: z.string().optional(),
    visibility: z.enum(["PUBLIC_ONBOARDING", "PRIVATE_QUEST"]),
    adventureType: z.enum(["CHARACTER_CREATOR", "CYOA_INTAKE"]).optional(),
})

export async function createAdventure(prevState: any, formData: FormData) {
    const data = {
        title: formData.get("title"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        visibility: formData.get("visibility"),
        adventureType: formData.get("adventureType") || undefined,
    }

    const result = createAdventureSchema.safeParse(data)

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
            message: "Please fix the errors below."
        }
    }

    let adventure;
    try {
        adventure = await db.adventure.create({
            data: {
                title: result.data.title,
                slug: result.data.slug,
                description: result.data.description,
                visibility: result.data.visibility,
                status: "DRAFT",
                ...(result.data.adventureType ? { adventureType: result.data.adventureType } : {}),
            }
        })
    } catch (error: any) {
        if (error.code === 'P2002') { // Unique constraint
            return {
                success: false,
                message: "An adventure with this slug already exists."
            }
        }
        return {
            success: false,
            message: "Failed to create adventure. Please try again."
        }
    }

    revalidatePath('/admin/adventures')
    redirect(`/admin/adventures/${adventure.id}`)
}

export async function updateAdventureStartNode(formData: FormData) {
    const adventureId = formData.get('adventureId') as string
    const raw = formData.get('startNodeId') as string
    const startNodeId = raw?.trim() || null
    if (!adventureId) return
    await db.adventure.update({
        where: { id: adventureId },
        data: { startNodeId }
    })
    revalidatePath(`/admin/adventures/${adventureId}`)
}

export async function updateAdventureCampaignRef(formData: FormData) {
    const adventureId = formData.get('adventureId') as string
    const raw = formData.get('campaignRef') as string
    const campaignRef = raw?.trim() || null
    if (!adventureId) return
    await db.adventure.update({
        where: { id: adventureId },
        data: { campaignRef }
    })
    revalidatePath(`/admin/adventures/${adventureId}`)
}

/** Import passages from JSON. Format: [{ nodeId, text, choices: [{ text, targetId }] }] */
export async function importPassagesFromJson(
    adventureId: string,
    json: string
): Promise<{ success: true; count: number } | { success: false; error: string }> {
    let nodes: { nodeId: string; text: string; choices?: { text: string; targetId: string }[] }[]
    try {
        const parsed = JSON.parse(json) as unknown
        if (!Array.isArray(parsed)) {
            return { success: false, error: 'JSON must be an array of passages' }
        }
        nodes = parsed
    } catch (e) {
        return { success: false, error: 'Invalid JSON' }
    }

    const adventure = await db.adventure.findUnique({ where: { id: adventureId } })
    if (!adventure) return { success: false, error: 'Adventure not found' }

    let count = 0
    for (const node of nodes) {
        if (!node.nodeId || typeof node.text !== 'string') continue
        const choices = Array.isArray(node.choices)
            ? node.choices.filter((c) => c && typeof c.text === 'string' && typeof c.targetId === 'string')
            : []
        try {
            await db.passage.upsert({
                where: {
                    adventureId_nodeId: { adventureId, nodeId: node.nodeId },
                },
                update: { text: node.text, choices: JSON.stringify(choices) },
                create: {
                    adventureId,
                    nodeId: node.nodeId,
                    text: node.text,
                    choices: JSON.stringify(choices),
                },
            })
            count++
        } catch {
            /* skip duplicates or invalid */
        }
    }

    revalidatePath(`/admin/adventures/${adventureId}`)
    return { success: true, count }
}

/** Promote a DRAFT Adventure to ACTIVE. */
export async function promoteDraftToActive(adventureId: string) {
    await promoteService(adventureId)
    revalidatePath(`/admin/adventures/${adventureId}`)
    revalidatePath('/admin/adventures')
}
