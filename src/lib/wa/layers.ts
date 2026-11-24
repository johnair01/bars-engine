/**
 * The bars-engine compositor for the six WorkAdventure layer parts.
 *
 * The catalog/types live in `layer-catalog.ts` so routes that only list parts
 * do not bundle `sharp`. This module is for code that actually flattens a
 * selection into a PNG (preview, share card, export).
 */
import path from 'node:path'
import sharp from 'sharp'
import {
  layerTexturesForIds,
  type WokaLayerCatalog,
} from '@/lib/wa/layer-catalog'

export {
  WOKA_LAYER_ORDER,
  defaultLayerSelection,
  findLayerTexture,
  layerIdsForSelection,
  layerIdsFromAvatarConfig,
  layerSelection,
  layerTexturesForIds,
  loadWokaLayerCatalog,
} from '@/lib/wa/layer-catalog'
export type {
  WokaLayerCatalog,
  WokaLayerPart,
  WokaLayerSelection,
  WokaLayerTexture,
} from '@/lib/wa/layer-catalog'

const PUBLIC_ROOT = path.join(process.cwd(), 'public')

/**
 * Flatten a selection to one 96x128 RGBA PNG.
 *
 * The layers are partitioned from one source sheet, so stacking them in
 * `WOKA_LAYER_ORDER` reproduces the character. Unknown ids are rejected
 * before this function is called.
 */
export async function composeWokaLayers(
  catalog: WokaLayerCatalog,
  ids: string[],
): Promise<Buffer | null> {
  const textures = layerTexturesForIds(catalog, ids)
  if (!textures) return null

  const composites = textures.map((texture) => ({
    input: path.join(PUBLIC_ROOT, texture.path.replace(/^\/+/, '')),
    blend: 'over' as const,
  }))

  return sharp({
    create: {
      width: 96,
      height: 128,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer()
}
