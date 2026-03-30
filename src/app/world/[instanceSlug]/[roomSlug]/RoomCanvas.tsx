'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AnchorData, AgentData } from '@/lib/spatial-world/pixi-room'
import { useSpatialRoomSession } from '@/lib/spatial-world/useSpatialRoomSession'
import { enterRoom, heartbeat } from '@/actions/room-presence'
import { getIntentAgentsForRoom } from '@/actions/intent-agents'
import { AnchorModal } from '@/components/world/AnchorModal'
import type { SpokeState } from '@/actions/campaign-spoke-states'
import { IntentAgentPanel } from '@/components/world/IntentAgentPanel'
import { MapAvatarGate } from '@/components/world/MapAvatarGate'
import { DPadOverlay } from '@/components/world/DPadOverlay'
import { NationRoomGateOverlay } from '@/components/world/NationRoomGateOverlay'
import type { WorldRoomNavMeta } from '@/lib/world/nation-room-gate'
import {
  canAccessNationRoom,
  formatNationKeyForDisplay,
} from '@/lib/world/nation-room-gate'

type RoomCanvasProps = {
  /** Canonical spatial bind from computeSpatialBindKey (server or client). */
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
    anchors: AnchorData[]  // AnchorData includes config?: string | null
  }
  allRooms: WorldRoomNavMeta[]
  instanceSlug: string
  spawnX: number
  spawnY: number
  spokeSeedStates?: SpokeState[]
  playerNationKey: string | null
  /** Admin or server-only SKIP_NATION_GATE — see nation-room-gate.ts */
  bypassNationGate: boolean
  artifactLedger: any[]
}

export function RoomCanvas({
  spatialBindKey,
  player,
  room,
  allRooms,
  instanceSlug,
  spawnX,
  spawnY,
  spokeSeedStates,
  playerNationKey,
  bypassNationGate,
  artifactLedger,
}: RoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [playerPos, setPlayerPos] = useState({ x: spawnX, y: spawnY })
  const [lastMoveDirection, setLastMoveDirection] = useState<'north' | 'south' | 'east' | 'west'>('south')
  const [proximateAnchor, setProximateAnchor] = useState<AnchorData | null>(null)
  const [modalAnchor, setModalAnchor] = useState<AnchorData | null>(null)
  const [modalKey, setModalKey] = useState(0)
  const [agents, setAgents] = useState<AgentData[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null)
  const [nationGateBlock, setNationGateBlock] = useState<{ nationDisplayName: string } | null>(null)
  const spriteReady = !!player.avatarConfig

  const posRef = useRef(playerPos)
  posRef.current = playerPos

  const navigateToWorldRoom = useCallback(
    (targetSlug: string) => {
      const meta = allRooms.find((r) => r.slug === targetSlug)
      if (meta?.roomType === 'nation_room' && meta.nationKey) {
        if (!canAccessNationRoom(meta.nationKey, playerNationKey, bypassNationGate)) {
          setNationGateBlock({ nationDisplayName: formatNationKeyForDisplay(meta.nationKey) })
          return
        }
      }
      setNationGateBlock(null)
      router.push(`/world/${instanceSlug}/${targetSlug}`)
    },
    [allRooms, playerNationKey, bypassNationGate, instanceSlug, router]
  )

  // Stable ref so the playerPos effect never needs to expand its deps
  const portalNavigateRef = useRef<(anchor: AnchorData) => void>(() => {})
  portalNavigateRef.current = (anchor: AnchorData) => {
    // Spoke portals: same affordance as stepping onto the tile — open chooser modal.
    // (Do not router.push here: a pointerdown on the Pixi anchor was bypassing the modal
    // and felt like "kicked back" or broken CTAs — see SCL / world lobby parity.)
    if (anchor.anchorType === 'spoke_portal') {
      setModalAnchor(anchor)
      setModalKey((k) => k + 1)
      return
    }

    // Campaign portal — routes to /campaign/hub (or custom href via config)
    if (anchor.anchorType === 'campaign_portal') {
      let href = '/campaign/hub'
      if (anchor.config) {
        try {
          const cfg = JSON.parse(anchor.config) as { href?: string; campaignRef?: string }
          href = cfg.href ?? (cfg.campaignRef ? `/campaign/hub?ref=${cfg.campaignRef}` : '/campaign/hub')
        } catch { /* ignore */ }
      }
      router.push(href)
      return
    }

    if (anchor.anchorType === 'portal') {
      if (anchor.config) {
        try {
          const cfg = JSON.parse(anchor.config) as {
            externalPath?: string
            targetInstanceSlug?: string
            targetRoomSlug?: string
            targetSlug?: string
          }
          if (typeof cfg.externalPath === 'string' && cfg.externalPath.startsWith('/')) {
            router.push(cfg.externalPath)
            return
          }
          if (cfg.targetInstanceSlug && cfg.targetRoomSlug) {
            router.push(`/world/${cfg.targetInstanceSlug}/${cfg.targetRoomSlug}`)
            return
          }
          if (cfg.targetSlug) {
            const bySlug = allRooms.find(r => r.slug === cfg.targetSlug)
            if (bySlug) {
              navigateToWorldRoom(bySlug.slug)
              return
            }
          }
        } catch { /* ignore */ }
      }
      let target = allRooms.find(r => r.id === anchor.linkedId)
      if (!target && anchor.config) {
        try {
          const cfg = JSON.parse(anchor.config) as { targetSlug?: string }
          if (cfg.targetSlug) target = allRooms.find(r => r.slug === cfg.targetSlug)
        } catch { /* ignore */ }
      }
      if (!target && anchor.label?.startsWith('To ')) {
        const labelName = anchor.label.slice(3).toLowerCase()
        target = allRooms.find(
          r => r.name.toLowerCase() === labelName || r.slug === labelName.replace(/\s+/g, '-')
        )
      }
      if (target) navigateToWorldRoom(target.slug)
    }
  }

  const navigateToEncounter = useCallback(() => {
    // For now, redirect to a mock combat run
    // In Phase 5 proper, this will create a ThresholdEncounter record
    router.push('/adventures/challenger-combat-v1/play')
  }, [router])
  const walkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { rendererRef } = useSpatialRoomSession({
    spatialBindKey,
    containerRef,
    spriteReady,
    tilemap: room.tilemap,
    anchors: room.anchors,
    spawn: { x: spawnX, y: spawnY },
    walkableSpriteUrl: player.walkableSpriteUrl ?? null,
    onAgentClick: setSelectedAgent,
    onPortalActivate: anchor => portalNavigateRef.current(anchor),
  })

  useEffect(() => {
    setPlayerPos({ x: spawnX, y: spawnY })
  }, [spatialBindKey, spawnX, spawnY])

  const cancelWalk = useCallback(() => {
    if (walkIntervalRef.current !== null) {
      clearInterval(walkIntervalRef.current)
      walkIntervalRef.current = null
    }
  }, [])

  const walkPath = useCallback((path: { x: number; y: number }[]) => {
    cancelWalk()
    let i = 0
    walkIntervalRef.current = setInterval(() => {
      if (i >= path.length) { cancelWalk(); return }
      const step = path[i]!
      let dir: 'north' | 'south' | 'east' | 'west' = 'south'
      if (i > 0) {
        const prev = path[i - 1]!
        if (step.x > prev.x) dir = 'east'
        else if (step.x < prev.x) dir = 'west'
        else if (step.y < prev.y) dir = 'north'
        else dir = 'south'
      }
      setLastMoveDirection(dir)
      setPlayerPos(step)
      i++
    }, 150)
  }, [cancelWalk])

  // Tap-to-move: click/tap on canvas → BFS to tile
  const handleCanvasTap = useCallback((e: MouseEvent | TouchEvent) => {
    if (!rendererRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]!.clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]!.clientY : (e as MouseEvent).clientY
    // Account for camera offset when converting screen → tile coords
    const { x: tileX, y: tileY } = rendererRef.current.screenToTile(clientX - rect.left, clientY - rect.top)
    const path = rendererRef.current.findPath(posRef.current.x, posRef.current.y, tileX, tileY)
    if (path.length > 1) walkPath(path.slice(1))
  }, [walkPath])

  // D-pad: single step move
  const handleDPadMove = useCallback((dx: number, dy: number, dir: 'north' | 'south' | 'east' | 'west') => {
    cancelWalk()
    const next = { x: posRef.current.x + dx, y: posRef.current.y + dy }
    if (rendererRef.current?.isWalkable(next.x, next.y)) {
      setLastMoveDirection(dir)
      setPlayerPos(next)
    }
  }, [cancelWalk])

  // Update renderer when position changes; auto-navigate portals on touch
  useEffect(() => {
    rendererRef.current?.setPlayerPosition(playerPos.x, playerPos.y)
    rendererRef.current?.setPlayerDirection(lastMoveDirection)
    const anchor = rendererRef.current?.getProximateAnchor(playerPos.x, playerPos.y) ?? null
    setProximateAnchor(anchor)

    // Step onto a portal tile → navigate immediately (spoke_portal shows modal instead)
    if (
      anchor &&
      (anchor.anchorType === 'portal' ||
        anchor.anchorType === 'campaign_portal') &&
      anchor.tileX === playerPos.x &&
      anchor.tileY === playerPos.y
    ) {
      // P5: Resonance Check
      if (anchor.config) {
        try {
            const cfg = JSON.parse(anchor.config)
            if (cfg.requiredBlueprintKey) {
                const hasKey = (artifactLedger || []).some(a => a.blueprintKey === cfg.requiredBlueprintKey)
                if (!hasKey) {
                    // console.warn("LOCKED: Missing required resonance", cfg.requiredBlueprintKey)
                    return 
                }
            }
        } catch { /* ignore */ }
      }
      portalNavigateRef.current(anchor)
    }
    
    // P5: Wild Grass Logic (Encounter Spawn)
    if (
        anchor &&
        anchor.anchorType === 'encounter_spawn' &&
        anchor.tileX === playerPos.x &&
        anchor.tileY === playerPos.y
    ) {
        navigateToEncounter()
    }

    if (
      anchor &&
      anchor.anchorType === 'spoke_portal' &&
      anchor.tileX === playerPos.x &&
      anchor.tileY === playerPos.y
    ) {
      setModalAnchor(anchor)
      setModalKey(k => k + 1)
    }
  }, [playerPos, lastMoveDirection])

  // Update agents in renderer
  useEffect(() => {
    rendererRef.current?.setIntentAgents(agents)
  }, [agents])

  // Tap-to-move listener
  useEffect(() => {
    const el = containerRef.current
    if (!el || !spriteReady) return
    el.addEventListener('click', handleCanvasTap as EventListener)
    el.addEventListener('touchstart', handleCanvasTap as EventListener, { passive: true })
    return () => {
      el.removeEventListener('click', handleCanvasTap as EventListener)
      el.removeEventListener('touchstart', handleCanvasTap as EventListener)
    }
  }, [spriteReady, handleCanvasTap])

  // Arrow key movement
  useEffect(() => {
    const DELTAS: Record<string, { dx: number; dy: number; dir: 'north' | 'south' | 'east' | 'west' }> = {
      ArrowUp: { dx: 0, dy: -1, dir: 'north' },
      ArrowDown: { dx: 0, dy: 1, dir: 'south' },
      ArrowLeft: { dx: -1, dy: 0, dir: 'west' },
      ArrowRight: { dx: 1, dy: 0, dir: 'east' },
    }
    const handler = (e: KeyboardEvent) => {
      const delta = DELTAS[e.key]
      if (!delta || !rendererRef.current) return
      cancelWalk()
      const next = { x: posRef.current.x + delta.dx, y: posRef.current.y + delta.dy }
      if (rendererRef.current.isWalkable(next.x, next.y)) {
        setLastMoveDirection(delta.dir)
        setPlayerPos(next)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cancelWalk])

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
    if (
      proximateAnchor.anchorType === 'portal' ||
      proximateAnchor.anchorType === 'campaign_portal'
    ) {
      portalNavigateRef.current(proximateAnchor)
      return
    }
    setModalAnchor(proximateAnchor)
    setModalKey(k => k + 1)
  }, [proximateAnchor])

  const promptPixel = proximateAnchor && rendererRef.current
    ? (() => {
        const { left, top } = rendererRef.current!.worldToScreen(proximateAnchor.tileX, proximateAnchor.tileY)
        if (!Number.isFinite(left) || !Number.isFinite(top)) return null
        return { left, top: top - 36 }
      })()
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
          spokeSeedStates={spokeSeedStates}
          worldContext={{
            instanceSlug,
            allRoomsNav: allRooms,
            playerNationKey,
            bypassNationGate,
          }}
        />
      )}

      {nationGateBlock && (
        <NationRoomGateOverlay
          instanceSlug={instanceSlug}
          nationDisplayName={nationGateBlock.nationDisplayName}
          onDismiss={() => setNationGateBlock(null)}
        />
      )}

      {selectedAgent && (
        <IntentAgentPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      <DPadOverlay onMove={handleDPadMove} />

      <div className="absolute top-4 left-4 z-10 text-xs text-zinc-500">
        {room.name} · {instanceSlug}
      </div>
    </div>
  )
}
