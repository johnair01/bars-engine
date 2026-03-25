'use client'

import { useEffect, useLayoutEffect, useRef, type MutableRefObject, type RefObject } from 'react'
import type { AnchorData, AgentData, RoomRenderer, TileMapData } from '@/lib/spatial-world/pixi-room'
import { mountSpatialRoomSession } from '@/lib/spatial-world/spatial-room-session'

export type UseSpatialRoomSessionArgs = {
  /** From computeSpatialBindKey — when this changes, layout session is disposed and rebuilt. */
  spatialBindKey: string
  containerRef: RefObject<HTMLElement | null>
  spriteReady: boolean
  tilemap: TileMapData
  anchors: AnchorData[]
  spawn: { x: number; y: number }
  walkableSpriteUrl: string | null
  onAgentClick: (agent: AgentData) => void
  onPortalActivate?: (anchor: AnchorData) => void
}

/**
 * Owns Pixi Application + RoomRenderer lifecycle for one spatial bind key.
 * Anti-fragile: remount is driven only by spatialBindKey + spriteReady, not mountedRef hacks.
 */
export function useSpatialRoomSession(args: UseSpatialRoomSessionArgs): {
  rendererRef: MutableRefObject<RoomRenderer | null>
} {
  const rendererRef = useRef<RoomRenderer | null>(null)
  const sessionDisposeRef = useRef<(() => void) | null>(null)
  const generationRef = useRef(0)

  const onAgentClickRef = useRef(args.onAgentClick)
  onAgentClickRef.current = args.onAgentClick

  // useLayoutEffect: containerRef must be attached before mount; useEffect can run too early
  // and skip Pixi init forever (black screen with chrome still visible).
  useLayoutEffect(() => {
    if (!args.spriteReady || !args.containerRef.current) return

    const myGen = ++generationRef.current
    sessionDisposeRef.current?.()
    sessionDisposeRef.current = null
    rendererRef.current = null

    const container = args.containerRef.current
    const { tilemap, anchors, spawn, walkableSpriteUrl, onPortalActivate } = args

    void mountSpatialRoomSession({
      container,
      tilemap,
      anchors,
      spawn,
      walkableSpriteUrl,
      onAgentClick: agent => onAgentClickRef.current(agent),
      onPortalActivate,
    })
      .then(session => {
        if (myGen !== generationRef.current) {
          session.dispose()
          return
        }
        sessionDisposeRef.current = session.dispose
        rendererRef.current = session.renderer
      })
      .catch(err => {
        console.error('[useSpatialRoomSession] Pixi mount failed', err)
      })

    return () => {
      generationRef.current++
      sessionDisposeRef.current?.()
      sessionDisposeRef.current = null
      rendererRef.current = null
    }
    // spatialBindKey is the contract for tilemap+anchors; other fields read at mount time.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: layout identity is spatialBindKey
  }, [args.spatialBindKey, args.spriteReady])

  useEffect(() => {
    rendererRef.current?.setPlayerSpriteUrl(args.walkableSpriteUrl)
  }, [args.walkableSpriteUrl, args.spatialBindKey])

  return { rendererRef }
}
