import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { ElementKey } from '@/lib/ui/card-tokens'

/** Map GM face (from hub draw) to Wuxing element for portal frame tokens — UI_COVENANT channel 1. */
export function gmFaceToElement(face: GameMasterFace | undefined): ElementKey {
  switch (face) {
    case 'shaman':
      return 'wood'
    case 'challenger':
      return 'fire'
    case 'regent':
      return 'earth'
    case 'architect':
      return 'metal'
    case 'diplomat':
      return 'water'
    case 'sage':
      return 'metal'
    default:
      return 'wood'
  }
}
