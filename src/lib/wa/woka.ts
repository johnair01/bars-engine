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

export function wokaListFromCatalog(catalog: WokaCatalog, publicUrl: string): WokaList {
  return {
    woka: {
      required: true,
      collections: [
        {
          name: catalog.collection,
          textures: catalog.textures.map((texture) => ({
            id: texture.id,
            name: texture.name,
            url: absolute(texture.path, publicUrl),
          })),
        },
      ],
    },
  }
}

export function textureId(nationKey: string, archetypeKey: string): string {
  return `wa:${nationKey}:${archetypeKey}`
}

/**
 * The textures an unauthenticated client already chose, limited to the
 * catalog. WorkAdventure keeps an anonymous pick in localStorage because
 * there is no player row to save it to; the socket upgrade sends it back as
 * `characterTextureIds`, and the Admin API echoes the valid ones so the
 * client does not fall back to the placeholder sprite.
 */
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

export function wokaDetail(texture: WokaTexture, publicUrl: string) {
  return { id: texture.id, url: absolute(texture.path, publicUrl) }
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
  const next: AvatarConfig = {
    nationKey: texture.nationKey,
    archetypeKey: texture.archetypeKey,
    variant: 'default',
    genderKey: texture.genderKey ?? existing?.genderKey ?? 'default',
  }
  if (existing?.domainKey) next.domainKey = existing.domainKey
  return JSON.stringify(next)
}
