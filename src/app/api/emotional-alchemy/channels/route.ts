import { NextResponse } from 'next/server'
import { EMOTIONAL_CHANNELS } from '@/lib/emotional-alchemy-api'

export async function GET() {
  return NextResponse.json({
    channels: [...EMOTIONAL_CHANNELS],
  })
}
