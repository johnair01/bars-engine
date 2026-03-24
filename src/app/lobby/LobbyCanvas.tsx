'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AnchorData, AgentData } from '@/lib/spatial-world/pixi-room'
import { useSpatialRoomSession } from '@/lib/spatial-world/useSpatialRoomSession'
import { enterRoom, heartbeat } from '@/actions/room-presence'
import { getIntentAgentsForRoom } from '@/actions/intent-agents'
import { AnchorModal } from '@/components/world/AnchorModal'
import { IntentAgentPanel } from '@/components/world/IntentAgentPanel'
import { MapAvatarGate } from '@/components/world/MapAvatarGate'

const INSTANCE_SLUG_LOBBY = 'lobby'

type LobbyCanvasProps = {
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
  allRooms: { id: string; name: string; slug: string }[]
  spawnX: number
  spawnY: number
  mapName: string
}

export function LobbyCanvas({ spatialBindKey, player, room, allRooms, spawnX, spawnY, mapName }: LobbyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [playerPos, setPlayerPos] = useState({ x: spawnX, y: spawnY })
  const [lastMoveDirection, setLastMoveDirection] = useState<'north' | 'south' | 'east' | 'west'>('south')
  const [proximateAnchor, setProximateAnchor] = useState<AnchorData | null>(null)
  const [modalAnchor, setModalAnchor] = useState<AnchorData | null>(null)
  const [modalKey, setModalKey] = useState(0)
  const [agents, setAgents] = useState<AgentData[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null)
  const spriteReady = !!player.avatarConfig

  const posRef = useRef(playerPos)
  useLayoutEffect(() => { posRef.current = playerPos })

  const { rendererRef } = useSpatialRoomSession({
    spatialBindKey,
    containerRef,
    spriteReady,
    tilemap: room.tilemap,
    anchors: room.anchors,
    spawn: { x: spawnX, y: spawnY },
    walkableSpriteUrl: player.walkableSpriteUrl ?? null,
    onAgentClick: setSelectedAgent,
  })

  useEffect(() => {
    setPlayerPos({ x: spawnX, y: spawnY })
  }, [spatialBindKey, spawnX, spawnY])

  useEffect(() => {
    rendererRef.current?.setPlayerPosition(playerPos.x, playerPos.y)
    rendererRef.current?.setPlayerDirection(lastMoveDirection)
    const anchor = rendererRef.current?.getProximateAnchor(playerPos.x, playerPos.y) ?? null
    setProximateAnchor(anchor)
  }, [playerPos, lastMoveDirection])

  useEffect(() => {
    rendererRef.current?.setIntentAgents(agents)
  }, [agents])

  useEffect(() => {
    const DELTAS: Record<string, { dx: number; dy: number; dir: 'north' | 'south' | 'east' | 'west' }> = {
      w: { dx: 0, dy: -1, dir: 'north' }, ArrowUp: { dx: 0, dy: -1, dir: 'north' },
      s: { dx: 0, dy: 1, dir: 'south' }, ArrowDown: { dx: 0, dy: 1, dir: 'south' },
      a: { dx: -1, dy: 0, dir: 'west' }, ArrowLeft: { dx: -1, dy: 0, dir: 'west' },
      d: { dx: 1, dy: 0, dir: 'east' }, ArrowRight: { dx: 1, dy: 0, dir: 'east' },
    }
    const handler = (e: KeyboardEvent) => {
      const delta = DELTAS[e.key]
      if (!delta || !rendererRef.current) return
      const next = { x: posRef.current.x + delta.dx, y: posRef.current.y + delta.dy }
      if (rendererRef.current.isWalkable(next.x, next.y)) {
        setLastMoveDirection(delta.dir)
        setPlayerPos(next)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!spriteReady) return
    void enterRoom(room.id, INSTANCE_SLUG_LOBBY)
    const interval = setInterval(() => void heartbeat(room.id), 30_000)
    return () => clearInterval(interval)
  }, [room.id, spriteReady])

  useEffect(() => {
    if (!spriteReady) return
    void getIntentAgentsForRoom(room.id, room.tilemap as Record<string, unknown>).then(setAgents)
  }, [room.id, room.tilemap, spriteReady])

  const handleAnchorClick = useCallback(() => {
    if (!proximateAnchor) return
    if (proximateAnchor.anchorType === 'portal') {
      const target = allRooms.find(r => r.id === proximateAnchor.linkedId)
      if (target) router.push(`/lobby/${target.slug}`)
      return
    }
    setModalAnchor(proximateAnchor)
    setModalKey(k => k + 1)
  }, [proximateAnchor, allRooms, router])

  const promptPixel = proximateAnchor
    ? { left: proximateAnchor.tileX * 32, top: proximateAnchor.tileY * 32 - 36 }
    : null

  if (!spriteReady) {
    return <MapAvatarGate context="lobby" />
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {promptPixel && (
        <button
          onClick={handleAnchorClick}
          style={{ left: promptPixel.left, top: promptPixel.top }}
          className="absolute z-10 px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded shadow-lg"
        >
          {proximateAnchor?.label ?? 'Interact'}
        </button>
      )}

      {modalAnchor && (
        <AnchorModal
          key={modalKey}
          anchor={modalAnchor}
          playerId={player.id}
          onClose={() => setModalAnchor(null)}
        />
      )}

      {selectedAgent && (
        <IntentAgentPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-4">
        <span className="text-xs text-zinc-500">
          {mapName} · {room.name} · WASD to move
        </span>
        <div className="flex gap-2">
          <Link
            href="/campaign"
            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium rounded"
          >
            Join Campaign
          </Link>
          <Link
            href="/lobby/new"
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded"
          >
            Create Campaign
          </Link>
        </div>
      </div>
    </div>
  )
}
