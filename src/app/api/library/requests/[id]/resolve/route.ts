import { NextResponse } from 'next/server'
import { resolveLibraryRequest } from '@/actions/library'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const body = await request.json()
        const docNodeId = body.docNodeId as string
        if (!docNodeId) {
            return NextResponse.json({ error: 'docNodeId required' }, { status: 400 })
        }

        const result = await resolveLibraryRequest(id, docNodeId)
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 403 })
        }
        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('[library] POST /resolve failed:', e)
        return NextResponse.json({ error: 'Failed to resolve' }, { status: 500 })
    }
}
