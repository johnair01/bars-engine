import { Application } from 'pixi.js'
import {
  RoomRenderer,
  type AnchorData,
  type AgentData,
  type TileMapData,
} from '@/lib/spatial-world/pixi-room'

export type SpatialRoomMountInput = {
  container: HTMLElement
  tilemap: TileMapData
  anchors: AnchorData[]
  spawn: { x: number; y: number }
  walkableSpriteUrl: string | null
  onAgentClick: (agent: AgentData) => void
  /** Omit when portals are only used via proximity / UI, not pointer on tile. */
  onPortalActivate?: (anchor: AnchorData) => void
}

export type MountedSpatialRoomSession = {
  app: Application
  renderer: RoomRenderer
  dispose: () => void
}

/**
 * Imperative API: mount Pixi + RoomRenderer for one spatial layout.
 * Caller owns lifecycle — pair every mount with dispose (e.g. React effect cleanup).
 */
export async function mountSpatialRoomSession(
  input: SpatialRoomMountInput,
): Promise<MountedSpatialRoomSession> {
  const app = new Application()
  await app.init({
    backgroundColor: 0x09090b,
    resizeTo: input.container,
    antialias: false,
  })

  input.container.appendChild(app.canvas)

  const renderer = new RoomRenderer(app, input.tilemap)
  renderer.setPlayerPosition(input.spawn.x, input.spawn.y)
  renderer.setPlayerSpriteUrl(input.walkableSpriteUrl)
  renderer.setAnchors(input.anchors)
  renderer.onAgentClick(input.onAgentClick)
  if (input.onPortalActivate) {
    renderer.onPortalActivate(input.onPortalActivate)
  }

  let recenterRaf = 0
  recenterRaf = requestAnimationFrame(() => {
    recenterRaf = 0
    renderer.recenter()
  })

  const dispose = () => {
    if (recenterRaf) cancelAnimationFrame(recenterRaf)
    app.destroy({ removeView: true })
  }

  return { app, renderer, dispose }
}
