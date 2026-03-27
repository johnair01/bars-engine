/**
 * @route POST /api/docs/nodes/:id/promote
 * @entity WIKI
 * @description Promote a doc node to canonical status in the knowledge graph
 * @permissions authenticated
 * @params id:string (path, required) - DocNode identifier
 * @relationships WIKI (canonical status)
 * @dimensions WHO:curator, WHAT:canonical content, WHERE:wiki authority, ENERGY:knowledge elevation
 * @example POST /api/docs/nodes/abc123/promote
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { promoteDocNode } from '@/actions/doc-node'

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const result = await promoteDocNode(id)
    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
}
