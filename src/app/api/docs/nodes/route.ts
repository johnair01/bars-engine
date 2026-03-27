/**
 * @route POST /api/docs/nodes
 * @entity WIKI
 * @description Create a new documentation node with RST content
 * @permissions authenticated
 * @params title:string (body, required) - Node title
 * @params slug:string (body, required) - URL slug
 * @params nodeType:string (body, required) - Type of documentation node
 * @params scope:string (body, required) - Visibility scope
 * @params bodyRst:string (body, required) - ReStructuredText content
 * @params tags:string[] (body, optional) - Taxonomy tags
 * @relationships WIKI (DocNode provenance)
 * @dimensions WHO:author, WHAT:doc content, WHERE:documentation graph, ENERGY:knowledge contribution
 * @example POST /api/docs/nodes with {title:"Guide",slug:"guide",nodeType:"guide",scope:"public",bodyRst:"Content"}
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { createDocNode } from '@/actions/doc-node'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const result = await createDocNode({
            title: body.title ?? '',
            slug: body.slug ?? '',
            nodeType: body.nodeType,
            scope: body.scope,
            bodyRst: body.bodyRst,
            tags: body.tags
        })

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json({ id: result.id })
    } catch (e) {
        console.error('[docs] POST /nodes failed:', e)
        return NextResponse.json({ error: 'Failed to create doc node' }, { status: 500 })
    }
}
