/**
 * @route GET /api/events/:eventId/ics
 * @entity EVENT
 * @description Download single-event iCalendar (.ics) file for calendar integration
 * @permissions authenticated
 * @params eventId:string (path, required) - Event artifact identifier
 * @relationships EVENT (EventArtifact), PLAYER (host/participant access)
 * @dimensions WHO:player access, WHAT:calendar data, WHERE:event context, ENERGY:participation
 * @example /api/events/abc123/ics
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { playerCanAccessEventCalendar } from '@/actions/campaign-invitation'
import { buildSingleEventIcs } from '@/lib/build-event-ics'

function safeFilename(title: string): string {
  const t = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60) || 'event'
  return `${t}.ics`
}
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await ctx.params
  const player = await getCurrentPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await playerCanAccessEventCalendar(player.id, eventId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ev = await db.eventArtifact.findUnique({
    where: { id: eventId },
    select: {
      title: true,
      description: true,
      locationDetails: true,
      startTime: true,
      endTime: true,
    },
  })
  if (!ev?.startTime) {
    return NextResponse.json({ error: 'Event has no start time' }, { status: 400 })
  }

  const start = new Date(ev.startTime)
  const end = ev.endTime ? new Date(ev.endTime) : null
  const ics = buildSingleEventIcs({
    uid: `${eventId}@bars-engine`,
    title: ev.title,
    description: ev.description,
    location: ev.locationDetails,
    start,
    end,
    stamp: new Date(),
  })

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename(ev.title)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
