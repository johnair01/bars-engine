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
/** Pixi resizeTo can fail or behave badly when the container has 0×0 layout (flex/routing race). */
async function waitForNonZeroSize(el: HTMLElement, maxMs = 3000): Promise<void> {
  const start = Date.now()
  while (el.clientWidth < 2 || el.clientHeight < 2) {
    if (Date.now() - start > maxMs) return
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }
}

export async function mountSpatialRoomSession(
  input: SpatialRoomMountInput,
): Promise<MountedSpatialRoomSession> {
  await waitForNonZeroSize(input.container)

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
