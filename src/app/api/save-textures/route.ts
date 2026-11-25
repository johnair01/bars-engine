/**
 * WorkAdventure saves a player's chosen woka here. The woka id carries the
 * nation x archetype pair, so this writes the same `avatarConfig` the rest of
 * bars-engine already reads. Character creation and the WorkAdventure avatar
 * are one choice, not two.
 */
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { adminApiAuthorized, adminApiErrorResponse } from '@/lib/wa/admin-auth'
import { logWaMiss, resolveWaPlayer } from '@/lib/wa/lookup'
import { findLayerTexture, loadWokaLayerCatalog } from '@/lib/wa/layer-catalog'
import {
  avatarConfigForLayers,
  avatarConfigForTexture,
  loadWokaCatalog,
} from '@/lib/wa/woka'

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
  const textures = (body.textures ?? []).map((texture) => texture.trim()).filter(Boolean)
  if (!userIdentifier || textures.length === 0) {
    return Response.json({ error: 'userIdentifier and textures are required' }, { status: 400 })
  }

  const select = { id: true, avatarConfig: true } as const
  const { player } = await resolveWaPlayer(userIdentifier, {
    byId: (id) => db.player.findUnique({ where: { id }, select }),
    byEmail: (email) => db.player.findFirst({ where: { contactValue: email, contactType: 'email' }, select }),
  })
  if (!player) {
    logWaMiss('save-textures', userIdentifier)
    return Response.json({ error: 'player not found' }, { status: 404 })
  }

  const catalog = loadWokaCatalog()
  const layers = loadWokaLayerCatalog()
  const layerIds = textures.filter((id) => findLayerTexture(layers, id))

  let avatarConfig: string | null
  if (layerIds.length > 0) {
    if (layerIds.length !== textures.length) {
      return Response.json({ error: 'cannot mix a woka preset with layer parts' }, { status: 400 })
    }
    avatarConfig = avatarConfigForLayers(layers, textures, player.avatarConfig)
    if (!avatarConfig) {
      return Response.json({ error: 'unknown or incomplete woka layer selection' }, { status: 400 })
    }
  } else {
    if (textures.length !== 1) {
      return Response.json({ error: 'a woka preset must be a single texture' }, { status: 400 })
    }
    avatarConfig = avatarConfigForTexture(catalog, textures[0], player.avatarConfig)
    if (!avatarConfig) {
      return Response.json({ error: `unknown woka texture: ${textures[0]}` }, { status: 400 })
    }
  }

  await db.player.update({
    where: { id: player.id },
    data: { avatarConfig },
  })

  return new Response(null, { status: 204 })
}
