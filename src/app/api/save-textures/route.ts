/**
 * WorkAdventure saves a player's chosen woka here. The woka id carries the
 * nation x archetype pair, so this writes the same `avatarConfig` the rest of
 * bars-engine already reads. Character creation and the WorkAdventure avatar
 * are one choice, not two.
 */
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { findPlayerByIdentifier, playerNotFoundResponse } from '@/lib/wa/player-lookup'
import { adminApiAuthorized, adminApiErrorResponse } from '@/lib/wa/admin-auth'
import { findLayerTexture, loadWokaLayerCatalog } from '@/lib/wa/layer-catalog'
import {
  ARGYRAN_DEFAULT_LOOK,
  isArgyranDefaultLook,
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
  const asked = (body.textures ?? []).map((texture) => texture.trim()).filter(Boolean)
  // The picker's one whole look is the tan Argyran body in the ceremonial robe, saved as its parts.
  const textures = asked.length === 1 && isArgyranDefaultLook(asked[0]) ? [...ARGYRAN_DEFAULT_LOOK.layerIds] : asked
  if (!userIdentifier || textures.length === 0) {
    return Response.json({ error: 'userIdentifier and textures are required' }, { status: 400 })
  }

  const player = await findPlayerByIdentifier(
    userIdentifier,
    { id: true, avatarConfig: true },
    'save-textures'
  )
  if (!player) return playerNotFoundResponse(userIdentifier)

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
