/**
 * WorkAdventure asks this before a player joins a room.
 *
 * `userIdentifier` is what the WorkAdventure pusher sends: the OIDC `sub`
 * (bars-engine `Player.id`) when it has it, or the account's email identifier.
 * Everything private is re-read here; the browser is never trusted for identity.
 *
 * @see docs/WA_IDENTITY_AND_ASSETS.md
 */
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { adminApiAuthorized, adminApiErrorResponse } from '@/lib/wa/admin-auth'
import { WA_ADMIN_API_URL } from '@/lib/wa/config'
import { canEditForPlayer, emailForPlayer, tagsForPlayer } from '@/lib/wa/player'
import { loadWokaLayerCatalog } from '@/lib/wa/layer-catalog'
import {
  loadWokaCatalog,
  requestedTextureIds,
  resolveRequestedCharacter,
  resolveWokaForPlayer,
  resolveWokaLayersForPlayer,
  wokaDetail,
} from '@/lib/wa/woka'

export const runtime = 'nodejs'

/** Env switch for the tall-character race: WA_WOKA_FRAME_HEIGHT=64 + wa-tall play fork. */
const FRAME_HEIGHT = Number(process.env.WA_WOKA_FRAME_HEIGHT ?? 32) === 64 ? 64 : 32
export const dynamic = 'force-dynamic'

function anonymousResponse(userIdentifier: string, playUri: string, requested: string[]) {
  const catalog = loadWokaCatalog()
  const layers = loadWokaLayerCatalog()
  const { textures, valid } = resolveRequestedCharacter(catalog, layers, requested)
  return {
    status: 'ok' as const,
    email: null,
    username: null,
    userUuid: userIdentifier || 'anonymous',
    tags: [] as string[],
    visitCardUrl: null,
    // Anonymous players choose locally; echo a valid saved choice so the
    // socket carries it into the room. With no choice yet, send them to the
    // picker instead of letting WorkAdventure draw its placeholder sprite.
    isCharacterTexturesValid: valid,
    characterTextures: textures.map((texture) => wokaDetail(texture, WA_ADMIN_API_URL, FRAME_HEIGHT)),
    isCompanionTextureValid: true,
    companionTexture: undefined,
    userRoomToken: undefined,
    activatedInviteUser: true,
    canEdit: false,
    // Rooms on this box are /_/global/... URLs, not the /@/org/world shape
    // WorkAdventure uses for world grouping, so do not claim a false group.
    world: '',
    canRecord: false,
    analyticsEventsEnabled: false,
  }
}

const PLAYER_SELECT = {
  id: true,
  name: true,
  contactType: true,
  contactValue: true,
  avatarConfig: true,
  roles: { select: { role: { select: { key: true } } } },
} as const

export async function GET(request: NextRequest) {
  if (!adminApiAuthorized(request.headers.get('authorization'))) {
    return adminApiErrorResponse()
  }

  const userIdentifier = request.nextUrl.searchParams.get('userIdentifier') ?? ''
  const playUri = request.nextUrl.searchParams.get('playUri') ?? ''
  const requested = requestedTextureIds(request.nextUrl.searchParams)

  if (!userIdentifier) return Response.json(anonymousResponse('', playUri, requested))

  // The pusher relays whatever identifier it minted its JWT with: the OIDC
  // `sub` (Player.id) or the account email. Resolve both; never trust the
  // client-supplied id beyond choosing which row to read.
  const player =
    (await db.player.findUnique({
      where: { id: userIdentifier },
      select: PLAYER_SELECT,
    })) ??
    (await db.player.findFirst({
      where: { contactValue: userIdentifier, contactType: 'email' },
      select: PLAYER_SELECT,
    }))

  if (!player) return Response.json(anonymousResponse(userIdentifier, playUri, requested))

  const catalog = loadWokaCatalog()
  const layers = loadWokaLayerCatalog()
  const layerLook = resolveWokaLayersForPlayer(layers, player.avatarConfig)
  const look = layerLook ? null : resolveWokaForPlayer(catalog, player.avatarConfig)
  const textures = layerLook ?? (look ? [look] : [])
  const tags = tagsForPlayer(player)
  const canEdit = canEditForPlayer(player)

  return Response.json({
    status: 'ok',
    email: emailForPlayer(player),
    username: player.name,
    userUuid: player.id,
    tags,
    visitCardUrl: `${WA_ADMIN_API_URL}/garden`,
    // A player who has never chosen a look is sent to WorkAdventure's own
    // customize screen. The choice comes back through /api/save-textures and
    // becomes Player.avatarConfig.
    isCharacterTexturesValid: textures.length > 0,
    characterTextures: textures.map((texture) => wokaDetail(texture, WA_ADMIN_API_URL, FRAME_HEIGHT)),
    isCompanionTextureValid: true,
    companionTexture: undefined,
    userRoomToken: undefined,
    activatedInviteUser: true,
    canEdit,
    // Rooms on this box are /_/global/... URLs, not the /@/org/world shape
    // WorkAdventure uses for world grouping, so do not claim a false group.
    world: '',
    canRecord: false,
    analyticsEventsEnabled: false,
  })
}
