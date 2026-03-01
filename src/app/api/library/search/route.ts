import { NextResponse } from 'next/server'
import { searchDocNodes } from '@/actions/library'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q') ?? ''
        const type = searchParams.get('type') ?? undefined
        const scope = searchParams.get('scope') ?? undefined
        const limit = parseInt(searchParams.get('limit') ?? '10', 10)

        const results = await searchDocNodes({ q, type, scope, limit })
        return NextResponse.json({ results })
    } catch (e) {
        console.error('[library] GET /search failed:', e)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
