/**
 * WorkAdventure saves a player's display name here when `api/save-name` is
 * advertised. The name is bounded by the same rule as bars-engine's profile.
 */
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { adminApiAuthorized, adminApiErrorResponse } from '@/lib/wa/admin-auth'
import { logWaMiss, resolveWaPlayer } from '@/lib/wa/lookup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SaveNameBody = {
  name?: string
  roomUrl?: string
  userIdentifier?: string
}

export async function POST(request: NextRequest) {
  if (!adminApiAuthorized(request.headers.get('authorization'))) {
    return adminApiErrorResponse()
  }

  let body: SaveNameBody
  try {
    body = (await request.json()) as SaveNameBody
  } catch {
    return Response.json({ error: 'expected a JSON body' }, { status: 400 })
  }

  const userIdentifier = body.userIdentifier?.trim()
  const name = body.name?.trim()
  if (!userIdentifier || !name) {
    return Response.json({ error: 'userIdentifier and name are required' }, { status: 400 })
  }
  if (name.length > 50) {
    return Response.json({ error: 'name is longer than 50 characters' }, { status: 400 })
  }

  const select = { id: true } as const
  const { player } = await resolveWaPlayer(userIdentifier, {
    byId: (id) => db.player.findUnique({ where: { id }, select }),
    byEmail: (email) => db.player.findFirst({ where: { contactValue: email, contactType: 'email' }, select }),
  })
  if (!player) {
    logWaMiss('save-name', userIdentifier)
    return Response.json({ error: 'player not found' }, { status: 404 })
  }

  await db.player.update({ where: { id: player.id }, data: { name } })
  return new Response(null, { status: 204 })
}
