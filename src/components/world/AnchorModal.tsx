'use client'

import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import type { SpokeState } from '@/actions/campaign-spoke-states'
import type { WorldRoomNavMeta } from '@/lib/world/nation-room-gate'
import { QuestBoardModal } from './QuestBoardModal'
import { BarTableModal } from './BarTableModal'
import { AnomalyModal } from './AnomalyModal'
import { CyoaQuestModal } from './CyoaQuestModal'
import { SpokePortalModal } from './SpokePortalModal'
import { LibrarianNpcModal } from './LibrarianNpcModal'
import { GiacomoNpcModal } from './GiacomoNpcModal'
import { NationEmbassyModal } from './NationEmbassyModal'

export type WorldAnchorModalContext = {
  instanceSlug: string
  allRoomsNav: WorldRoomNavMeta[]
  playerNationKey: string | null
  bypassNationGate: boolean
}

type Props = {
  anchor: AnchorData
  playerId: string
  onClose: () => void
  spokeSeedStates?: SpokeState[]
  /** Card Club / lobby: librarian + embassy + nation gate targets */
  worldContext?: WorldAnchorModalContext | null
}

export function AnchorModal({ anchor, playerId, onClose, spokeSeedStates, worldContext }: Props) {
  function handleOverlay(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={handleOverlay}
    >
      <div onClick={e => e.stopPropagation()}>
        {anchor.anchorType === 'quest_board' && (
          <QuestBoardModal anchor={anchor} playerId={playerId} onClose={onClose} />
        )}
        {anchor.anchorType === 'bar_table' && (
          <BarTableModal anchor={anchor} playerId={playerId} onClose={onClose} />
        )}
        {anchor.anchorType === 'anomaly' && (
          <AnomalyModal anchor={anchor} playerId={playerId} onClose={onClose} />
        )}
        {anchor.anchorType === 'cyoa_quest' && (
          <CyoaQuestModal anchor={anchor} onClose={onClose} />
        )}
        {anchor.anchorType === 'spoke_portal' && (() => {
          let spokeIndex = 0
          if (anchor.config) {
            try { spokeIndex = (JSON.parse(anchor.config) as { spokeIndex?: number }).spokeIndex ?? 0 } catch { /* ignore */ }
          }
          const spokeState = spokeSeedStates?.find(s => s.spokeIndex === spokeIndex) ?? null
          return <SpokePortalModal anchor={anchor} spokeState={spokeState} onClose={onClose} />
        })()}
        {anchor.anchorType === 'librarian_npc' && (
          <LibrarianNpcModal anchor={anchor} onClose={onClose} />
        )}
        {anchor.anchorType === 'giacomo_npc' && <GiacomoNpcModal anchor={anchor} onClose={onClose} />}
        {anchor.anchorType === 'nation_embassy' && worldContext && (
          <NationEmbassyModal
            anchor={anchor}
            onClose={onClose}
            instanceSlug={worldContext.instanceSlug}
            allRoomsNav={worldContext.allRoomsNav}
            playerNationKey={worldContext.playerNationKey}
            bypassNationGate={worldContext.bypassNationGate}
          />
        )}
        {anchor.anchorType === 'nation_embassy' && !worldContext && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-white font-bold mb-2">{anchor.label ?? 'Embassy'}</h2>
            <p className="text-zinc-400 text-sm">Embassy navigation requires world context.</p>
            <button type="button" onClick={onClose} className="mt-4 text-zinc-500 hover:text-zinc-300 text-sm">
              Close
            </button>
          </div>
        )}
        {anchor.anchorType === 'npc_slot' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-white font-bold mb-2">{anchor.label ?? 'NPC'}</h2>
            <p className="text-zinc-400 text-sm">This NPC slot is not yet configured.</p>
            <button type="button" onClick={onClose} className="mt-4 text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
