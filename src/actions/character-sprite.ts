'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { loadWokaLayerCatalog } from '@/lib/wa/layer-catalog'
import {
  avatarConfigForLayers,
  avatarConfigForTexture,
  loadWokaCatalog,
} from '@/lib/wa/woka'

export type SaveCharacterSpriteInput =
  | { textureId: string }
  | { textureIds: string[] }

export type SaveCharacterSpriteResult =
  | { success: true; avatarConfig: string; wokaId?: string; layers?: string[] }
  | { success: false; error: 'unauthorized' | 'unknown_texture' | 'no_player' }

/**
 * The bars-engine sprite builder's write path.
 *
 * The player is taken from the session; the client never supplies an identity.
 * A preset id writes `waWokaId`; a layer array writes `waLayers` in WA's order.
 */
export async function saveCharacterSprite(
  input: SaveCharacterSpriteInput,
): Promise<SaveCharacterSpriteResult> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'unauthorized' }

  const row = await db.player.findUnique({
    where: { id: player.id },
    select: { id: true, avatarConfig: true },
  })
  if (!row) return { success: false, error: 'no_player' }

  let avatarConfig: string | null = null
  let wokaId: string | undefined
  let layers: string[] | undefined

  if ('textureIds' in input) {
    const ids = input.textureIds.map((id) => id.trim()).filter(Boolean)
    if (ids.length === 0) return { success: false, error: 'unknown_texture' }
    const catalog = loadWokaLayerCatalog()
    avatarConfig = avatarConfigForLayers(catalog, ids, row.avatarConfig)
    if (!avatarConfig) return { success: false, error: 'unknown_texture' }
    layers = ids
  } else {
    const id = input.textureId.trim()
    if (!id) return { success: false, error: 'unknown_texture' }
    const catalog = loadWokaCatalog()
    avatarConfig = avatarConfigForTexture(catalog, id, row.avatarConfig)
    if (!avatarConfig) return { success: false, error: 'unknown_texture' }
    wokaId = id
  }

  await db.player.update({
    where: { id: player.id },
    data: { avatarConfig },
  })

  revalidatePath('/character/create')
  revalidatePath('/character/[shareToken]', 'page')
  revalidatePath('/')

  return { success: true, avatarConfig, wokaId, layers }
}
