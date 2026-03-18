import { NextRequest, NextResponse } from 'next/server'
import { startForgeSession } from '@/actions/forge'

export async function POST(request: NextRequest) {
  try {
    let body: { frictionStart?: number } = {}
    try {
      body = (await request.json()) as typeof body
    } catch {
      // Empty body is ok
    }
    const result = await startForgeSession(body.frictionStart)
    if ('error' in result) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to start Forge session'
    const status = msg.includes('authenticated') ? 401 : msg.includes('Admin') || msg.includes('authorized') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
