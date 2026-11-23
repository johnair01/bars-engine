/**
 * WorkAdventure saves a player's chosen woka here. The woka id carries the
 * nation x archetype pair, so this writes the same `avatarConfig` the rest of
 * bars-engine already reads. Character creation and the WorkAdventure avatar
 * are one choice, not two.
 */
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { adminApiAuthorized, adminApiErrorResponse } from '@/lib/wa/admin-auth'
import { avatarConfigForTexture, loadWokaCatalog } from '@/lib/wa/woka'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SaveTexturesBody = {
  playUri?: string
  userIdentifier?: string
  textures?: string[]
}

export async function POST(request: NextRequest) {
  if (!adminApiAuthorized(request.headers.get('authorization'))) {
    return adminApiErrorResponse()
  }

  let body: SaveTexturesBody
  try {
    body = (await request.json()) as SaveTexturesBody
  } catch {
    return Response.json({ error: 'expected a JSON body' }, { status: 400 })
  }

  const userIdentifier = body.userIdentifier?.trim()
  const textureId = body.textures?.[0]?.trim()
  if (!userIdentifier || !textureId) {
    return Response.json({ error: 'userIdentifier and textures are required' }, { status: 400 })
  }

  const player = await db.player.findUnique({
    where: { id: userIdentifier },
    select: { id: true, avatarConfig: true },
  })
  if (!player) return Response.json({ error: 'player not found' }, { status: 404 })

  const catalog = loadWokaCatalog()
  const avatarConfig = avatarConfigForTexture(catalog, textureId, player.avatarConfig)
  if (!avatarConfig) {
    return Response.json({ error: `unknown woka texture: ${textureId}` }, { status: 400 })
  }

  await db.player.update({
    where: { id: player.id },
    data: { avatarConfig },
  })

  return new Response(null, { status: 204 })
}
