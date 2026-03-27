/**
 * @route POST /api/library/requests
 * @entity WIKI
 * @description Submit a library research request for documentation lookup or content generation
 * @permissions authenticated
 * @params requestText:string (body, required) - Request description
 * @params requestType:string (body, required) - Request type (e.g., "lookup", "generate")
 * @params privacy:string (body, optional) - Privacy level
 * @params contextJson:object (body, optional) - Additional context metadata
 * @relationships WIKI (LibraryRequest), PLAYER (requester)
 * @dimensions WHO:requester, WHAT:request content, WHERE:library system, ENERGY:knowledge request
 * @example POST /api/library/requests with {requestText:"Define BAR",requestType:"lookup"}
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { submitLibraryRequest } from '@/actions/library'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const result = await submitLibraryRequest({
            requestText: body.requestText ?? '',
            requestType: body.requestType,
            privacy: body.privacy,
            contextJson: body.contextJson
        })

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({
            requestId: result.requestId,
            result: result.result
        })
    } catch (e) {
        console.error('[library] POST /requests failed:', e)
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }
}
