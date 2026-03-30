import { NextRequest, NextResponse } from 'next/server'
import { barsApiAuthError } from '@/lib/bars-api-auth'
import { db } from '@/lib/db'
import { barForgeRecordToDto } from '@/lib/bar-forge/registry-dto'

/**
 * GET /api/bar-registry/[id]
 * Bearer: BARS_API_KEY
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = barsApiAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  const { id } = await params

  try {
    const row = await db.barForgeRecord.findUnique({
      where: { id },
    })
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ record: barForgeRecordToDto(row) })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load registry row'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
