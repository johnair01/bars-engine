/**
 * WorkAdventure asks for the map behind a room. The dojo WAM is the default home;
 * any room URL that names a map in the box's map-storage is translated to the
 * public map-storage URL so `exitUrl` travel keeps working.
 */
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { adminApiAuthorized, adminApiErrorResponse } from '@/lib/wa/admin-auth'
import { resolveMapForPlayUri } from '@/lib/wa/map'
import { canEditForPlayer } from '@/lib/wa/player'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!adminApiAuthorized(request.headers.get('authorization'))) {
    return adminApiErrorResponse()
  }

  const playUri = request.nextUrl.searchParams.get('playUri') ?? ''
  const userId = request.nextUrl.searchParams.get('userId') ?? ''

  let editable = false
  if (userId) {
    const player = await db.player.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        roles: { select: { role: { select: { key: true } } } },
      },
    })
    if (player) editable = canEditForPlayer(player)
  }

  return Response.json(resolveMapForPlayUri(playUri, editable))
}
