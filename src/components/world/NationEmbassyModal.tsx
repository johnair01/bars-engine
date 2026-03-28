'use client'

import { useRouter } from 'next/navigation'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import type { WorldRoomNavMeta } from '@/lib/world/nation-room-gate'
import {
  canAccessNationRoom,
  formatNationKeyForDisplay,
} from '@/lib/world/nation-room-gate'

type Props = {
  anchor: AnchorData
  onClose: () => void
  instanceSlug: string
  allRoomsNav: WorldRoomNavMeta[]
  playerNationKey: string | null
  bypassNationGate: boolean
}

function parseEmbassyNationKey(config: string | null | undefined): string | null {
  if (!config) return null
  try {
    const j = JSON.parse(config) as { nationKey?: string }
    const k = j.nationKey?.trim().toLowerCase()
    return k || null
  } catch {
    return null
  }
}

export function NationEmbassyModal({
  anchor,
  onClose,
  instanceSlug,
  allRoomsNav,
  playerNationKey,
  bypassNationGate,
}: Props) {
  const router = useRouter()
  const embassyKey = parseEmbassyNationKey(anchor.config)
  const targetRoom = embassyKey
    ? allRoomsNav.find((r) => r.roomType === 'nation_room' && r.nationKey?.toLowerCase() === embassyKey)
    : undefined

  const displayNation = embassyKey ? formatNationKeyForDisplay(embassyKey) : 'this nation'
  const roomKey = targetRoom?.nationKey ?? null
  const allowed = roomKey ? canAccessNationRoom(roomKey, playerNationKey, bypassNationGate) : false

  function goEnter() {
    if (!targetRoom || !allowed) return
    onClose()
    router.push(`/world/${instanceSlug}/${targetRoom.slug}`)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-white font-bold">{anchor.label ?? 'Embassy'}</h2>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm shrink-0">
          Close
        </button>
      </div>
      {!embassyKey || !targetRoom ? (
        <p className="text-zinc-400 text-sm">This embassy is not linked to a hall yet.</p>
      ) : (
        <>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Beyond this door is <span className="text-blue-200/90">{displayNation}</span>&apos;s hall — a ritual
            boundary. Only members of that nation are admitted.
          </p>
          {allowed ? (
            <button
              type="button"
              onClick={goEnter}
              className="w-full px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium"
            >
              Enter {displayNation} hall
            </button>
          ) : (
            <p className="text-amber-200/90 text-sm">
              You are not a member of {displayNation}. Return to the Card Club to choose another path.
            </p>
          )}
        </>
      )}
    </div>
  )
}
