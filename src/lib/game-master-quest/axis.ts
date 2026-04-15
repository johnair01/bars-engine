import type { GameMasterFaceKey } from '@/lib/bar-forge/types'

/** Communion ↔ Agency (canonical order in API meta). */
export const GM_AXIS: { communion: GameMasterFaceKey[]; agency: GameMasterFaceKey[] } = {
  communion: ['shaman', 'diplomat', 'regent'],
  agency: ['challenger', 'architect', 'sage'],
}

export const ALL_GM_FACES: GameMasterFaceKey[] = [
  ...GM_AXIS.communion,
  ...GM_AXIS.agency,
]
