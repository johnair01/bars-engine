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
