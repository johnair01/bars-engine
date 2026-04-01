'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import { useSpatialRoomSession } from '@/lib/spatial-world/useSpatialRoomSession'
import { DPadOverlay } from '@/components/world/DPadOverlay'
import { curateToTrophy, updateProfileRoom } from '@/actions/profile-spatial'
import { Package, Edit2, Map as MapIcon, Save, X } from 'lucide-react'

type ProfileRoomCanvasProps = {
  spatialBindKey: string
  player: {
    id: string
    name: string
    avatarConfig: string | null
    walkableSpriteUrl: string | null
  }
  room: {
    id: string
    name: string
    tilemap: Record<string, { floor?: string; impassable?: boolean; object?: string }>
    anchors: AnchorData[]
  }
  isOwner: boolean
  selectedArtifact?: { id: string; type: 'BAR' | 'BAR_DECK'; name: string } | null
  onPlaced?: () => void
}

export function ProfileRoomCanvas({
  spatialBindKey,
  player,
  room,
  isOwner,
  selectedArtifact,
  onPlaced,
}: ProfileRoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [playerPos, setPlayerPos] = useState({ x: 5, y: 5 })
  const [lastMoveDirection, setLastMoveDirection] = useState<'north' | 'south' | 'east' | 'west'>('south')
  const [proximateAnchor, setProximateAnchor] = useState<AnchorData | null>(null)
  const spriteReady = !!player.avatarConfig

  const { rendererRef } = useSpatialRoomSession({
    spatialBindKey,
    containerRef,
    spriteReady,
    tilemap: room.tilemap,
    anchors: room.anchors,
    spawn: { x: 5, y: 5 },
    walkableSpriteUrl: player.walkableSpriteUrl ?? null,
    onAgentClick: () => {}, // No-op for personal museum
  })

  useEffect(() => {
    rendererRef.current?.setPlayerPosition(playerPos.x, playerPos.y)
    rendererRef.current?.setPlayerDirection(lastMoveDirection)
    setProximateAnchor(rendererRef.current?.getProximateAnchor(playerPos.x, playerPos.y) ?? null)
  }, [playerPos, lastMoveDirection])

  const handleDPadMove = useCallback((dx: number, dy: number, dir: 'north' | 'south' | 'east' | 'west') => {
    if (isEditing) return
    setPlayerPos((prev) => {
      const next = { x: prev.x + dx, y: prev.y + dy }
      if (rendererRef.current?.isWalkable(next.x, next.y)) {
        setLastMoveDirection(dir)
        return next
      }
      return prev
    })
  }, [isEditing, rendererRef])

  // Simple "Click to Toggle Impassable" editor for now
  const handleCanvasClick = useCallback(async (e: MouseEvent) => {
    if (!rendererRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const { x, y } = rendererRef.current.screenToTile(e.clientX - rect.left, e.clientY - rect.top)

    if (isEditing) {
        // Toggle walls
        const key = `${x},${y}`
        const current = room.tilemap[key] || { floor: true }
        const nextTilemap = { ...room.tilemap, [key]: { ...current, impassable: !current.impassable } }
        await updateProfileRoom(room.id, { tilemap: JSON.stringify(nextTilemap) })
        return
    }

    if (selectedArtifact) {
        // Place artifact
        await curateToTrophy(selectedArtifact.id, selectedArtifact.type, x, y, selectedArtifact.name)
        onPlaced?.()
    }
  }, [isEditing, selectedArtifact, room.id, room.tilemap, onPlaced, rendererRef, containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('click', handleCanvasClick)
    return () => el.removeEventListener('click', handleCanvasClick)
  }, [handleCanvasClick])

  return (
    <div className="relative w-full h-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
      <div ref={containerRef} className="w-full h-full" />

      {/* Owner Controls */}
      {isOwner && (
        <div className="absolute top-6 right-6 flex gap-2 z-20">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${
              isEditing 
                ? 'bg-amber-600 text-white shadow-amber-900/40' 
                : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {isEditing ? 'Finish Layout' : 'Edit Layout'}
          </button>
        </div>
      )}

      {/* Editor Overlay */}
      {isEditing && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-900/90 backdrop-blur-md border border-amber-500/50 rounded-2xl z-20 flex items-center gap-4 text-xs font-bold text-amber-200 uppercase tracking-widest">
           <MapIcon className="w-4 h-4" />
           Click tiles to toggle walls
        </div>
      )}

      {/* Proximity Prompt */}
      {proximateAnchor && !isEditing && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-purple-600 text-white rounded-2xl z-20 shadow-xl shadow-purple-900/40 animate-in fade-in slide-in-from-bottom-4">
           <div className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-0.5">{proximateAnchor.anchorType}</div>
           <div className="font-bold">{proximateAnchor.label}</div>
        </div>
      )}

      {!isEditing && <DPadOverlay onMove={handleDPadMove} />}

      <div className="absolute top-6 left-6 z-10">
        <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-[10px] text-zinc-400 uppercase font-black tracking-widest">
          {room.name}
        </div>
      </div>
    </div>
  )
}
