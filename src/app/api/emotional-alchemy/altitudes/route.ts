import { NextResponse } from 'next/server'
import { SATISFACTION_ALTITUDES } from '@/lib/emotional-alchemy-api'

export async function GET() {
  return NextResponse.json({
    altitudes: [...SATISFACTION_ALTITUDES],
  })
}
