import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const req = await db.libraryRequest.findUnique({
        where: { id },
        include: {
            resolvedDocNode: { select: { id: true, slug: true, title: true } },
            spawnedBacklogItem: { select: { id: true, title: true } },
            spawnedDocQuest: { select: { id: true, title: true } }
        }
    })

    if (!req) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({
        id: req.id,
        status: req.status,
        requestText: req.requestText,
        resolvedDocNode: req.resolvedDocNode
            ? { id: req.resolvedDocNode.id, slug: req.resolvedDocNode.slug, title: req.resolvedDocNode.title }
            : null,
        spawnedBacklogItem: req.spawnedBacklogItem
            ? { id: req.spawnedBacklogItem.id, title: req.spawnedBacklogItem.title }
            : null,
        spawnedDocQuest: req.spawnedDocQuest
            ? { id: req.spawnedDocQuest.id, title: req.spawnedDocQuest.title }
            : null
    })
}
