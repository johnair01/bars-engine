/**
 * The woka catalog WorkAdventure's customize screen reads.
 *
 * A woka texture is a single 96x128 sheet (3 frames x 4 facings, 32px cells).
 * The catalog is generated from ARDS-coloured walker sheets and validated by
 * `public/wa/check_assets.py`, so the list WA receives and the art the maps use
 * come from the same contract.
 *
 * The texture id carries the character choice: `wa:<nation>:<archetype>`.
 * Saving textures therefore writes `Player.avatarConfig`, and the portrait,
 * spatial walker, and WorkAdventure avatar all follow one stored choice.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseAvatarConfig, type AvatarConfig } from '@/lib/avatar-utils'
import {
  WOKA_LAYER_ORDER,
  findLayerTexture,
  layerTexturesForIds,
  type WokaLayerCatalog,
  type WokaLayerTexture,
} from '@/lib/wa/layer-catalog'

export type WokaTexture = {
  id: string
  name: string
  path: string
  nationKey: string
  archetypeKey: string
  genderKey?: AvatarConfig['genderKey']
  provisional?: boolean
}

export type WokaCatalog = {
  version: number
  collection: string
  about?: string
  textures: WokaTexture[]
}

export type WokaListTexture = {
  id: string
  name: string
  url: string
}

export type WokaList = Record<
  string,
  {
    collections: Array<{ name: string; textures: WokaListTexture[] }>
    required?: boolean
  }
>

const CATALOG_PATH = path.join(process.cwd(), 'public', 'wa', 'woka', 'catalog.json')

export function loadWokaCatalog(catalogPath = CATALOG_PATH): WokaCatalog {
  const raw = JSON.parse(readFileSync(catalogPath, 'utf8')) as WokaCatalog
  if (!Array.isArray(raw.textures) || raw.textures.length === 0) {
    throw new Error(`woka catalog at ${catalogPath} has no textures`)
  }
  return raw
}

function absolute(pathOrUrl: string, publicUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${publicUrl.replace(/\/+$/, '')}/${pathOrUrl.replace(/^\/+/, '')}`
}

export function wokaListFromCatalog(
  catalog: WokaCatalog,
  publicUrl: string,
  layers?: WokaLayerCatalog,
  frameHeight: number = 32,
): WokaList {
  // The wa-tall fork reads `frameHeight` to size spritesheet cells; stock WA
  // ignores the extra field. Texture URLs carry the same ?fh so sheets match.
  const fhParam = frameHeight === 32 ? '' : `?fh=${frameHeight}`
  // WokaList has an index signature over its parts, so frameHeight is attached
  // at the end and the cast documents the wa-tall extension.
  const list: WokaList = {
    woka: {
      required: true,
      collections: [
        {
          name: catalog.collection,
          textures: catalog.textures.map((texture) => ({
            id: texture.id,
            name: texture.name,
            url: absolute(texture.path, publicUrl) + fhParam,
          })),
        },
      ],
    },
  }
  if (layers) {
    for (const part of WOKA_LAYER_ORDER) {
      list[part] = {
        required: part === 'body',
        collections: [
          {
            name: `${catalog.collection} · ${part}`,
            textures: layers.parts[part].map((texture) => ({
              id: texture.id,
              name: texture.name,
              url: absolute(texture.path, publicUrl) + fhParam,
            })),
          },
        ],
      }
    }
  }
  return Object.assign(list, { frameHeight }) as WokaList
}

export function textureId(nationKey: string, archetypeKey: string): string {
  return `wa:${nationKey}:${archetypeKey}`
}

/**
 * Read WorkAdventure's `characterTextureIds` query parameter.
 *
 * WA's server uses axios, which serialises arrays as `characterTextureIds[]=...`
 * by default. Some proxies and manual calls use the bare repeated key. Accept
 * both (plus comma-separated values) so the Admin API does not silently see an
 * empty list and reject a valid anonymous pick.
 */
export function requestedTextureIds(searchParams: {
  getAll(name: string): string[]
}): string[] {
  const raw = [
    ...searchParams.getAll('characterTextureIds'),
    ...searchParams.getAll('characterTextureIds[]'),
  ]
  const seen = new Set<string>()
  const ids: string[] = []
  for (const value of raw) {
    for (const id of value.split(',')) {
      const trimmed = id.trim()
      if (!trimmed || seen.has(trimmed)) continue
      seen.add(trimmed)
      ids.push(trimmed)
    }
  }
  return ids
}

/**
 * The textures an unauthenticated client already chose, limited to the
 * catalog. WorkAdventure keeps an anonymous pick in localStorage because
 * there is no player row to save it to; the socket upgrade sends it back as
 * `characterTextureIds`, and the Admin API echoes the valid ones so the
 * client does not fall back to the placeholder sprite.
 */
export function resolveRequestedCharacter(
  catalog: WokaCatalog,
  layers: WokaLayerCatalog,
  ids: string[],
): { textures: Array<WokaTexture | WokaLayerTexture>; valid: boolean } {
  const hasLayerId = ids.some((id) => Boolean(findLayerTexture(layers, id)))
  if (hasLayerId) {
    const textures = layerTexturesForIds(layers, ids)
    return { textures: textures ?? [], valid: Boolean(textures) }
  }
  const textures = resolveRequestedWoka(catalog, ids)
  return { textures, valid: textures.length > 0 }
}

export function resolveRequestedWoka(catalog: WokaCatalog, ids: string[]): WokaTexture[] {
  const seen = new Set<string>()
  const textures: WokaTexture[] = []
  for (const id of ids) {
    if (seen.has(id)) continue
    const texture = findTexture(catalog, id)
    if (!texture) continue
    seen.add(id)
    textures.push(texture)
  }
  return textures
}

export function findTexture(catalog: WokaCatalog, id: string): WokaTexture | undefined {
  return catalog.textures.find((texture) => texture.id === id)
}

/**
 * The saved look, if the player has one. The `waWokaId` key is a forward
 * compatible escape hatch for a texture that is not a nation x archetype pair;
 * today every entry is one, so `avatarConfig` alone is enough.
 */
export function resolveWokaForPlayer(
  catalog: WokaCatalog,
  avatarConfig: string | null | undefined,
): WokaTexture | null {
  if (!avatarConfig?.trim()) return null
  let raw: Record<string, unknown> = {}
  try {
    raw = JSON.parse(avatarConfig) as Record<string, unknown>
  } catch {
    return null
  }

  if (typeof raw.waWokaId === 'string') {
    const explicit = findTexture(catalog, raw.waWokaId)
    if (explicit) return explicit
  }

  const parsed = parseAvatarConfig(avatarConfig)
  if (!parsed?.nationKey || !parsed.archetypeKey) return null
  return (
    findTexture(catalog, textureId(parsed.nationKey, parsed.archetypeKey)) ??
    catalog.textures.find(
      (texture) =>
        texture.nationKey === parsed.nationKey &&
        texture.archetypeKey === parsed.archetypeKey,
    ) ??
    null
  )
}

export function wokaDetail(texture: { id: string; path: string }, publicUrl: string) {
  return { id: texture.id, url: absolute(texture.path, publicUrl) }
}

/** Extra keys the bridge stores inside `Player.avatarConfig`. */
export type WokaConfigExtras = {
  waWokaId?: string
  waLayers?: string[]
}

export function readWokaExtras(
  avatarConfig: string | null | undefined,
): WokaConfigExtras {
  if (!avatarConfig?.trim()) return {}
  try {
    const raw = JSON.parse(avatarConfig) as Record<string, unknown>
    return {
      waWokaId: typeof raw.waWokaId === 'string' ? raw.waWokaId : undefined,
      waLayers: Array.isArray(raw.waLayers)
        ? raw.waLayers.filter((id): id is string => typeof id === 'string')
        : undefined,
    }
  } catch {
    return {}
  }
}

/** The saved layer stack, if the player built one. */
export function resolveWokaLayersForPlayer(
  layers: WokaLayerCatalog,
  avatarConfig: string | null | undefined,
): WokaLayerTexture[] | null {
  const ids = readWokaExtras(avatarConfig).waLayers
  if (!ids?.length) return null
  return layerTexturesForIds(layers, ids)
}

/**
 * Turn a WorkAdventure texture choice into bars-engine's stored avatar config.
 * Returns null when the id is not in the catalog, so the caller can reject a
 * forged or stale selection instead of writing it.
 */
export function avatarConfigForTexture(
  catalog: WokaCatalog,
  id: string,
  existingAvatarConfig?: string | null,
): string | null {
  const texture = findTexture(catalog, id)
  if (!texture) return null

  const existing = parseAvatarConfig(existingAvatarConfig ?? null)
  const raw = readRawConfig(existingAvatarConfig)
  const next: AvatarConfig = {
    nationKey: texture.nationKey,
    archetypeKey: texture.archetypeKey,
    variant: 'default',
    genderKey: texture.genderKey ?? existing?.genderKey ?? 'default',
  }
  if (existing?.domainKey) next.domainKey = existing.domainKey
  delete raw.waLayers
  if (texture.id === textureId(texture.nationKey, texture.archetypeKey)) {
    delete raw.waWokaId
  } else {
    raw.waWokaId = texture.id
  }
  return JSON.stringify({ ...raw, ...next })
}

/**
 * Turn a native WA layer selection into `avatarConfig`. The clothes layer
 * carries the nation x archetype pair when the player has no identity yet;
 * an existing narrative identity is preserved.
 */
export function avatarConfigForLayers(
  layers: WokaLayerCatalog,
  ids: string[],
  existingAvatarConfig?: string | null,
): string | null {
  const textures = layerTexturesForIds(layers, ids)
  if (!textures) return null

  const existing = parseAvatarConfig(existingAvatarConfig ?? null)
  const raw = readRawConfig(existingAvatarConfig)
  const clothes = textures.find((texture) => texture.part === 'clothes')
  const nationKey = existing?.nationKey || clothes?.nationKey || ''
  const archetypeKey = existing?.archetypeKey || clothes?.archetypeKey || ''
  if (!nationKey || !archetypeKey) return null

  const next: AvatarConfig = {
    nationKey,
    archetypeKey,
    variant: 'default',
    genderKey: existing?.genderKey ?? 'default',
  }
  if (existing?.domainKey) next.domainKey = existing.domainKey

  delete raw.waWokaId
  return JSON.stringify({
    ...raw,
    ...next,
    waLayers: textures.map((texture) => texture.id),
  })
}

function readRawConfig(avatarConfig?: string | null): Record<string, unknown> {
  if (!avatarConfig?.trim()) return {}
  try {
    const parsed = JSON.parse(avatarConfig) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}
