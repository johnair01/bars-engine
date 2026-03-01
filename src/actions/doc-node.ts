'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createDocNode(data: {
    title: string
    slug: string
    nodeType?: string
    scope?: string
    bodyRst?: string
    tags?: string[]
}): Promise<{ error?: string; id?: string }> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const withRoles = await db.player.findUnique({
        where: { id: player.id },
        include: { roles: { include: { role: true } } }
    })
    const isAdmin = withRoles?.roles.some((r) => r.role.key === 'admin')
    if (!isAdmin) return { error: 'Forbidden' }

    const slug = (data.slug || data.title || 'doc').trim().toLowerCase().replace(/\s+/g, '-')
    const existing = await db.docNode.findUnique({ where: { slug } })
    if (existing) return { error: 'Slug already exists' }

    const node = await db.docNode.create({
        data: {
            title: data.title.trim(),
            slug,
            nodeType: data.nodeType ?? 'handbook',
            scope: data.scope ?? 'experimental',
            bodyRst: data.bodyRst ?? null,
            tags: data.tags ? JSON.stringify(data.tags) : '[]',
            canonicalStatus: 'draft',
            bodySource: 'curated'
        }
    })
    revalidatePath('/admin/docs')
    revalidatePath('/docs')
    return { id: node.id }
}

export async function promoteDocNode(nodeId: string): Promise<{ error?: string }> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const withRoles = await db.player.findUnique({
        where: { id: player.id },
        include: { roles: { include: { role: true } } }
    })
    const isAdmin = withRoles?.roles.some((r) => r.role.key === 'admin')
    if (!isAdmin) return { error: 'Forbidden' }

    const node = await db.docNode.findUnique({ where: { id: nodeId } })
    if (!node) return { error: 'Doc node not found' }
    if (node.canonicalStatus !== 'validated') {
        return { error: 'Only validated docs can be promoted to canonical' }
    }

    await db.docNode.update({
        where: { id: nodeId },
        data: { canonicalStatus: 'canonical' }
    })
    revalidatePath('/admin/docs')
    revalidatePath('/docs')
    return {}
}

export async function mergeDocNode(
    sourceId: string,
    targetId: string
): Promise<{ error?: string }> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const withRoles = await db.player.findUnique({
        where: { id: player.id },
        include: { roles: { include: { role: true } } }
    })
    const isAdmin = withRoles?.roles.some((r) => r.role.key === 'admin')
    if (!isAdmin) return { error: 'Forbidden' }

    await db.docNode.update({
        where: { id: sourceId },
        data: { mergedIntoDocNodeId: targetId, canonicalStatus: 'deprecated' }
    })
    revalidatePath('/admin/docs')
    revalidatePath('/docs')
    return {}
}
