/**
 * @route POST /api/docs/nodes/:id/merge
 * @entity WIKI
 * @description Merge source doc node into target node, preserving provenance
 * @permissions authenticated
 * @params id:string (path, required) - Source DocNode identifier
 * @params targetId:string (body, required) - Target DocNode identifier
 * @relationships WIKI (DocNode merge graph)
 * @dimensions WHO:author, WHAT:merged content, WHERE:wiki graph, ENERGY:knowledge consolidation
 * @example POST /api/docs/nodes/source123/merge with {targetId:"target456"}
 * @agentDiscoverable true
 */
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
