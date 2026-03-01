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
