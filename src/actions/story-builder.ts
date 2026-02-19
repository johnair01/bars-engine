'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) throw new Error('Not logged in')

    const adminRole = await db.playerRole.findFirst({
        where: { playerId, role: { key: 'admin' } }
    })
    if (!adminRole) throw new Error('Admin access required')
    return playerId
}

export async function createStitchedStory(title: string, description: string) {
    try {
        const adminId = await requireAdmin()
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

        const story = await db.twineStory.create({
            data: {
                title,
                slug: `${slug}-${Date.now()}`,
                sourceType: 'stitched',
                sourceText: description,
                parsedJson: JSON.stringify({
                    title,
                    startPassage: 'Start',
                    passages: [
                        { name: 'Start', text: 'Begin your journey...', links: [] }
                    ]
                }),
                isPublished: false,
                createdById: adminId,
            }
        })

        revalidatePath('/admin/twine')
        return { success: true, storyId: story.id }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function updatePassage(storyId: string, passageName: string, text: string, links: { label: string, target: string }[]) {
    try {
        await requireAdmin()
        const story = await db.twineStory.findUnique({ where: { id: storyId } })
        if (!story) return { error: 'Story not found' }

        const parsed = JSON.parse(story.parsedJson)
        let passage = parsed.passages.find((p: any) => p.name === passageName)

        if (!passage) {
            passage = { name: passageName, text, links }
            parsed.passages.push(passage)
        } else {
            passage.text = text
            passage.links = links
        }

        await db.twineStory.update({
            where: { id: storyId },
            data: { parsedJson: JSON.stringify(parsed) }
        })

        revalidatePath(`/admin/twine/stitcher/${storyId}`)
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function bindActionToPassage(storyId: string, passageName: string, actionType: string, payload: any) {
    try {
        const adminId = await requireAdmin()

        await db.twineBinding.create({
            data: {
                storyId,
                scopeType: 'passage',
                scopeId: passageName,
                actionType,
                payload: JSON.stringify(payload),
                createdById: adminId
            }
        })

        revalidatePath(`/admin/twine/stitcher/${storyId}`)
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}
