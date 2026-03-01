import { NextResponse } from 'next/server'
import { mergeDocNode } from '@/actions/doc-node'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: sourceId } = await params

    const body = await request.json()
    const targetId = body.targetId as string
    if (!targetId) {
        return NextResponse.json({ error: 'targetId required' }, { status: 400 })
    }

    const result = await mergeDocNode(sourceId, targetId)
    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
}
