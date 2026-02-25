"use server"

import { db } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const createAdventureSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    description: z.string().optional(),
    visibility: z.enum(["PUBLIC_ONBOARDING", "PRIVATE_QUEST"])
})

export async function createAdventure(prevState: any, formData: FormData) {
    const data = {
        title: formData.get("title"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        visibility: formData.get("visibility"),
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
                status: "DRAFT"
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
