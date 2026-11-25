/**
 * The six WorkAdventure layer parts, without the image compositor.
 *
 * This module is safe to import from routes/pages that must not pull `sharp`
 * into their serverless bundle (notably `/api/woka/list`). The compositor lives
 * in `layers.ts`.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

export const WOKA_LAYER_ORDER = [
  'body',
  'eyes',
  'hair',
  'clothes',
  'hat',
  'accessory',
] as const

export type WokaLayerPart = (typeof WOKA_LAYER_ORDER)[number]

export type WokaLayerTexture = {
  id: string
  name: string
  path: string
  part: WokaLayerPart
  nationKey?: string
  archetypeKey?: string
  tone?: string
}

export type WokaLayerCatalog = {
  version: number
  collection: string
  about?: string
  order: WokaLayerPart[]
  parts: Record<WokaLayerPart, WokaLayerTexture[]>
}

export type WokaLayerSelection = Partial<Record<WokaLayerPart, WokaLayerTexture>>

const LAYER_CATALOG_PATH = path.join(process.cwd(), 'public', 'wa', 'woka', 'layers', 'catalog.json')

export function loadWokaLayerCatalog(catalogPath = LAYER_CATALOG_PATH): WokaLayerCatalog {
  const raw = JSON.parse(readFileSync(catalogPath, 'utf8')) as WokaLayerCatalog
  for (const part of WOKA_LAYER_ORDER) {
    if (!Array.isArray(raw.parts?.[part])) {
      throw new Error(`layer catalog at ${catalogPath} is missing part "${part}"`)
    }
  }
  return raw
}

export function findLayerTexture(
  catalog: WokaLayerCatalog,
  id: string,
): WokaLayerTexture | undefined {
  for (const part of WOKA_LAYER_ORDER) {
    const texture = catalog.parts[part].find((item) => item.id === id)
    if (texture) return texture
  }
  return undefined
}

export function layerTexturesForIds(
  catalog: WokaLayerCatalog,
  ids: string[],
): WokaLayerTexture[] | null {
  const byPart = new Map<WokaLayerPart, WokaLayerTexture>()
  for (const id of ids) {
    const texture = findLayerTexture(catalog, id)
    if (!texture) return null
    if (byPart.has(texture.part)) return null
    byPart.set(texture.part, texture)
  }
  if (!byPart.has('body')) return null
  return WOKA_LAYER_ORDER.flatMap((part) => {
    const texture = byPart.get(part)
    return texture ? [texture] : []
  })
}

export function layerSelection(
  catalog: WokaLayerCatalog,
  ids: string[] | null | undefined,
): WokaLayerSelection | null {
  if (!ids?.length) return null
  const textures = layerTexturesForIds(catalog, ids)
  if (!textures) return null
  return Object.fromEntries(textures.map((texture) => [texture.part, texture])) as WokaLayerSelection
}

/**
 * The builder's opening state: a visible body, eyes, and hair, then the
 * nation/archetype outfit. Missing nation/archetype falls back to the first
 * catalog choice rather than an empty preview.
 */
export function defaultLayerSelection(
  catalog: WokaLayerCatalog,
  nationKey?: string | null,
  archetypeKey?: string | null,
): WokaLayerSelection {
  const pick = (part: WokaLayerPart, id?: string) =>
    (id ? catalog.parts[part].find((texture) => texture.id === id) : undefined) ??
    catalog.parts[part][0]

  const clothesId =
    nationKey && archetypeKey ? `wa:clothes:${nationKey}:${archetypeKey}` : undefined
  return {
    body: pick('body', 'wa:body:warm'),
    eyes: pick('eyes', 'wa:eyes:ink'),
    hair: pick('hair', 'wa:hair:black'),
    clothes: pick('clothes', clothesId),
    hat: pick('hat', nationKey ? `wa:hat:${nationKey}` : undefined),
    accessory: pick(
      'accessory',
      archetypeKey ? `wa:accessory:${archetypeKey}` : undefined,
    ),
  }
}

export function layerIdsForSelection(selection: WokaLayerSelection): string[] {
  return WOKA_LAYER_ORDER.flatMap((part) => {
    const texture = selection[part]
    return texture ? [texture.id] : []
  })
}

/** Read `avatarConfig.waLayers` without trusting the rest of the JSON. */
export function layerIdsFromAvatarConfig(
  avatarConfig: string | null | undefined,
): string[] | null {
  if (!avatarConfig?.trim()) return null
  try {
    const parsed = JSON.parse(avatarConfig) as Record<string, unknown>
    if (!Array.isArray(parsed.waLayers)) return null
    const ids = parsed.waLayers.filter((id): id is string => typeof id === 'string')
    return ids.length ? ids : null
  } catch {
    return null
  }
}
