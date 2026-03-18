'use client'

import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import { QuestBoardModal } from './QuestBoardModal'
import { BarTableModal } from './BarTableModal'
import { AnomalyModal } from './AnomalyModal'
import { CyoaQuestModal } from './CyoaQuestModal'

type Props = {
  anchor: AnchorData
  playerId: string
  onClose: () => void
}

export function AnchorModal({ anchor, playerId, onClose }: Props) {
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
        {anchor.anchorType === 'npc_slot' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-white font-bold mb-2">{anchor.label ?? 'NPC'}</h2>
            <p className="text-zinc-400 text-sm">This NPC slot is not yet configured.</p>
            <button onClick={onClose} className="mt-4 text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
