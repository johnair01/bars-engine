import { NextRequest, NextResponse } from 'next/server'
import { validateEmotionalState } from '@/lib/emotional-alchemy-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel, altitude } = body

    if (!channel || !altitude) {
      return NextResponse.json(
        { valid: false, error: 'Missing channel or altitude' },
        { status: 400 }
      )
    }

    const result = validateEmotionalState(channel, altitude)

    if (result.valid) {
      return NextResponse.json({
        valid: true,
        state_id: result.state_id,
      })
    }

    return NextResponse.json(
      { valid: false, error: result.error },
      { status: 400 }
    )
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
