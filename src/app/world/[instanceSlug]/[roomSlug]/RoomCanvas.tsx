'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Application } from 'pixi.js'
import { RoomRenderer, type AnchorData, type AgentData } from '@/lib/spatial-world/pixi-room'
import { enterRoom, heartbeat } from '@/actions/room-presence'
import { getIntentAgentsForRoom } from '@/actions/intent-agents'
import { AnchorModal } from '@/components/world/AnchorModal'
import { IntentAgentPanel } from '@/components/world/IntentAgentPanel'
import { MapAvatarGate } from '@/components/world/MapAvatarGate'

type RoomCanvasProps = {
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
  instanceSlug: string
  spawnX: number
  spawnY: number
}

export function RoomCanvas({ player, room, allRooms, instanceSlug, spawnX, spawnY }: RoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<RoomRenderer | null>(null)
  const appRef = useRef<Application | null>(null)
  const mountedRef = useRef(false)
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
  posRef.current = playerPos

  // Init Pixi
  useEffect(() => {
    if (mountedRef.current || !containerRef.current || !spriteReady) return
    mountedRef.current = true

    const app = new Application()
    appRef.current = app

    void app.init({
      backgroundColor: 0x09090b,
      resizeTo: containerRef.current,
      antialias: false,
    }).then(() => {
      if (!containerRef.current || !appRef.current) return
      containerRef.current.appendChild(app.canvas)
      const renderer = new RoomRenderer(app, room.tilemap)
      rendererRef.current = renderer
      renderer.setPlayerPosition(spawnX, spawnY)
      if (player.walkableSpriteUrl) renderer.setPlayerSpriteUrl(player.walkableSpriteUrl)
      renderer.setAnchors(room.anchors)
      renderer.onAgentClick(setSelectedAgent)
    })

    return () => {
      mountedRef.current = false
      appRef.current?.destroy(true, { children: true })
      appRef.current = null
      rendererRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spriteReady, player.walkableSpriteUrl])

  // Update renderer when position changes
  useEffect(() => {
    rendererRef.current?.setPlayerPosition(playerPos.x, playerPos.y)
    rendererRef.current?.setPlayerDirection(lastMoveDirection)
    const anchor = rendererRef.current?.getProximateAnchor(playerPos.x, playerPos.y) ?? null
    setProximateAnchor(anchor)
  }, [playerPos, lastMoveDirection])

  // Update agents in renderer
  useEffect(() => {
    rendererRef.current?.setIntentAgents(agents)
  }, [agents])

  // WASD movement
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

  // Enter room + heartbeat
  useEffect(() => {
    if (!spriteReady) return
    void enterRoom(room.id, instanceSlug)
    const interval = setInterval(() => void heartbeat(room.id), 30_000)
    return () => clearInterval(interval)
  }, [room.id, instanceSlug, spriteReady])

  // Fetch intent agents
  useEffect(() => {
    if (!spriteReady) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void getIntentAgentsForRoom(room.id, room.tilemap as any).then(setAgents)
  }, [room.id, room.tilemap, spriteReady])

  const handleAnchorClick = useCallback(() => {
    if (!proximateAnchor) return
    if (proximateAnchor.anchorType === 'portal') {
      const target = allRooms.find(r => r.id === proximateAnchor.linkedId)
      if (target) router.push(`/world/${instanceSlug}/${target.slug}`)
      return
    }
    setModalAnchor(proximateAnchor)
    setModalKey(k => k + 1)
  }, [proximateAnchor, allRooms, instanceSlug, router])

  const promptPixel = proximateAnchor
    ? { left: proximateAnchor.tileX * 32, top: proximateAnchor.tileY * 32 - 36 }
    : null

  if (!spriteReady) {
    return <MapAvatarGate context="world" />
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

      <div className="absolute top-4 left-4 z-10 text-xs text-zinc-500">
        {room.name} · {instanceSlug} · WASD to move
      </div>
    </div>
  )
}
