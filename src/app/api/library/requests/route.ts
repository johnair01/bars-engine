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
