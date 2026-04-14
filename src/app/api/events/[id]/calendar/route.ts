import { NextRequest, NextResponse } from 'next/server'
import { getEventCalendarExport } from '@/actions/event-artifact'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getEventCalendarExport(id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }
  return new NextResponse(result.ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="event-${id}.ics"`,
    },
  })
}
