import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** CUIDs are ~25 alphanumeric chars. Slugs are shorter or have dashes. */
function looksLikeCuid(s: string): boolean {
    return /^c[a-z0-9]{24}$/i.test(s)
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const node = looksLikeCuid(id)
        ? await db.docNode.findUnique({ where: { id } })
        : await db.docNode.findUnique({ where: { slug: id } })

    if (!node) {
        return NextResponse.json({ error: 'Doc node not found' }, { status: 404 })
    }

    return NextResponse.json({
        id: node.id,
        slug: node.slug,
        title: node.title,
        nodeType: node.nodeType,
        scope: node.scope,
        canonicalStatus: node.canonicalStatus,
        bodyRst: node.bodyRst,
        tags: node.tags,
        provenanceJson: node.provenanceJson
    })
}
