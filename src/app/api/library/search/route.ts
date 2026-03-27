/**
 * @route GET /api/library/search
 * @entity WIKI
 * @description Search documentation nodes by query text, type, and scope
 * @permissions public
 * @query q:string (optional) - Search query text
 * @query type:string (optional) - Filter by node type
 * @query scope:string (optional) - Filter by scope
 * @query limit:number (optional) - Result limit (default: 10)
 * @relationships WIKI (DocNode search)
 * @dimensions WHO:searcher, WHAT:search query, WHERE:wiki graph, ENERGY:knowledge discovery
 * @example /api/library/search?q=BAR&type=glossary&limit=5
 * @agentDiscoverable true
 */
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
