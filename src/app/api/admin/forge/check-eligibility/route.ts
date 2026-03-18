import { NextRequest, NextResponse } from 'next/server'
import { checkForgeEligibility } from '@/actions/forge'

export async function POST(request: NextRequest) {
  try {
    let body: { distortionIntensity?: number } = {}
    try {
      body = (await request.json()) as typeof body
    } catch {
      // Empty body is ok
    }
    const result = await checkForgeEligibility(body.distortionIntensity)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forge eligibility check failed'
    const status = msg.includes('authenticated') ? 401 : msg.includes('Admin') || msg.includes('authorized') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
