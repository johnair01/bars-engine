import { NextRequest, NextResponse } from 'next/server'
import { completeForgeSession, type CompleteForgeInput } from '@/actions/forge'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let routing: CompleteForgeInput | undefined
    try {
      const body = (await request.json()) as CompleteForgeInput
      if (body && typeof body === 'object') routing = body
    } catch {
      // Empty body ok
    }
    const result = await completeForgeSession(id, routing)
    if ('error' in result) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to complete Forge session'
    const status = msg.includes('authenticated') ? 401 : msg.includes('Admin') || msg.includes('authorized') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
