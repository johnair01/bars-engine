import { NextRequest, NextResponse } from 'next/server'
import { resolveEmotionalMove } from '@/lib/emotional-alchemy-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, to, context } = body

    if (!from || !to) {
      return NextResponse.json(
        {
          status: 'unresolved',
          error_code: 'missing_input',
          message: 'Missing from or to state',
        },
        { status: 400 }
      )
    }

    if (!from.channel || !from.altitude || !to.channel || !to.altitude) {
      return NextResponse.json(
        {
          status: 'unresolved',
          error_code: 'invalid_input',
          message: 'from and to must have channel and altitude',
        },
        { status: 400 }
      )
    }

    const result = resolveEmotionalMove({
      from: { channel: from.channel, altitude: from.altitude },
      to: { channel: to.channel, altitude: to.altitude },
      context,
    })

    if (result.status === 'resolved') {
      return NextResponse.json(result)
    }

    return NextResponse.json(result, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      {
        status: 'unresolved',
        error_code: 'internal_error',
        message,
      },
      { status: 500 }
    )
  }
}
