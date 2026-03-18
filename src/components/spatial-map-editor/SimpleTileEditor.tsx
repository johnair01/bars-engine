'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Application, Graphics, Container } from 'pixi.js'
import type { RealmData, TilePoint, TileData } from '@/lib/spatial-map/types'

const TILE_SIZE = 32
const GRID_COLOR = 0x333333
const FLOOR_COLORS: Record<string, number> = {
  default: 0x4a5568,
  grass: 0x48bb78,
  stone: 0x718096,
  water: 0x4299e1,
}
const OBJECT_COLORS: Record<string, number> = {
  tree: 0x22543d,
  rock: 0x4b5563,
  bush: 0x166534,
  pillar: 0x78716c,
  crate: 0x92400e,
}

function coordKey(x: number, y: number): TilePoint {
  return `${x}, ${y}` as TilePoint
}

type Layer = 'floor' | 'object'
type Tool = 'brush' | 'fill' | 'rect'

type Props = {
  realmData: RealmData
  onRealmDataChange: (data: RealmData) => void
  readOnly?: boolean
}

/** BFS flood-fill: fill contiguous tiles matching targetValue with newValue */
function floodFill(
  tilemap: Record<TilePoint, TileData>,
  startX: number,
  startY: number,
  layer: Layer,
  targetValue: string,
  newValue: string,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): Record<TilePoint, TileData> {
  const getCurrent = (x: number, y: number): string => {
    const key = coordKey(x, y)
    const t = tilemap[key]
    if (layer === 'floor') return t?.floor ?? 'default'
    return t?.object ?? ''
  }
  const startVal = getCurrent(startX, startY)
  if (startVal !== targetValue) return tilemap

  const out = { ...tilemap }
  const visited = new Set<string>()
  const queue: [number, number][] = [[startX, startY]]
  visited.add(coordKey(startX, startY))

  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]
  let count = 0
  const MAX_FILL = 2000

  while (queue.length > 0 && count < MAX_FILL) {
    const [x, y] = queue.shift()!
    const key = coordKey(x, y)
    const tile = { ...out[key] }
    if (layer === 'floor') {
      tile.floor = newValue
    } else {
      tile.object = newValue || undefined
      if (!tile.object && Object.keys(tile).length <= 1) delete tile.object
    }
    if (Object.keys(tile).length === 0) {
      delete out[key]
    } else {
      out[key] = tile
    }
    count++

    for (const [dx, dy] of dirs) {
      const nx = x + dx
      const ny = y + dy
      const nk = coordKey(nx, ny)
      if (visited.has(nk)) continue
      if (nx < bounds.minX || nx > bounds.maxX || ny < bounds.minY || ny > bounds.maxY) continue
      if (getCurrent(nx, ny) !== targetValue) continue
      visited.add(nk)
      queue.push([nx, ny])
    }
  }

  return out
}

/** Fill rectangle from (x0,y0) to (x1,y1) */
function rectFill(
  tilemap: Record<TilePoint, TileData>,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  layer: Layer,
  value: string,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): Record<TilePoint, TileData> {
  const out = { ...tilemap }
  const minX = Math.max(bounds.minX, Math.min(x0, x1))
  const maxX = Math.min(bounds.maxX, Math.max(x0, x1))
  const minY = Math.max(bounds.minY, Math.min(y0, y1))
  const maxY = Math.min(bounds.maxY, Math.max(y0, y1))

  for (let gy = minY; gy <= maxY; gy++) {
    for (let gx = minX; gx <= maxX; gx++) {
      const key = coordKey(gx, gy)
      const tile = { ...out[key] }
      if (layer === 'floor') {
        tile.floor = value
      } else {
        tile.object = value || undefined
        if (!tile.object && Object.keys(tile).length <= 1) delete tile.object
      }
      if (Object.keys(tile).length === 0) {
        delete out[key]
      } else {
        out[key] = tile
      }
    }
  }
  return out
}

function getTilemapBounds(tilemap: Record<TilePoint, TileData>): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = 0, minY = 0, maxX = 50, maxY = 40
  for (const key of Object.keys(tilemap)) {
    const [x, y] = key.split(',').map(Number)
    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + 1)
      maxY = Math.max(maxY, y + 1)
    }
  }
  return { minX, minY, maxX, maxY }
}

export function SimpleTileEditor({ realmData, onRealmDataChange, readOnly }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [roomIndex, setRoomIndex] = useState(realmData.spawnpoint.roomIndex)
  const [layer, setLayer] = useState<Layer>('floor')
  const [tool, setTool] = useState<Tool>('brush')
  const [selectedTile, setSelectedTile] = useState<string>('default')
  const draggingRef = useRef(false)
  const rectStartRef = useRef<{ x: number; y: number } | null>(null)
  const handlersRef = useRef<{
    place: (gx: number, gy: number) => void
    erase: (gx: number, gy: number) => void
    fill: (gx: number, gy: number) => void
    rectStart: (gx: number, gy: number) => void
    rectEnd: (gx: number, gy: number) => void
  }>({ place: () => {}, erase: () => {}, fill: () => {}, rectStart: () => {}, rectEnd: () => {} })

  const room = realmData.rooms[roomIndex]
  if (!room) return null

  const tilemap = room.tilemap
  const bounds = getTilemapBounds(tilemap)
  const palette = layer === 'floor' ? FLOOR_COLORS : OBJECT_COLORS

  const placeTile = useCallback(
    (gx: number, gy: number) => {
      if (readOnly) return
      const key = coordKey(gx, gy)
      const next = { ...realmData }
      const tm = { ...next.rooms[roomIndex]!.tilemap }
      const tile = { ...tm[key] }
      if (layer === 'floor') {
        tile.floor = selectedTile
      } else {
        tile.object = selectedTile || undefined
        if (!tile.object) delete tile.object
      }
      if (Object.keys(tile).length === 0) delete tm[key]
      else tm[key] = tile
      next.rooms[roomIndex]!.tilemap = tm
      onRealmDataChange(next)
    },
    [realmData, roomIndex, layer, selectedTile, onRealmDataChange, readOnly]
  )

  const eraseTile = useCallback(
    (gx: number, gy: number) => {
      if (readOnly) return
      const key = coordKey(gx, gy)
      const next = { ...realmData }
      const tm = { ...next.rooms[roomIndex]!.tilemap }
      const tile = tm[key]
      if (!tile) return
      const updated = { ...tile }
      if (layer === 'floor') {
        delete updated.floor
      } else {
        delete updated.object
      }
      if (Object.keys(updated).length === 0) delete tm[key]
      else tm[key] = updated
      next.rooms[roomIndex]!.tilemap = tm
      onRealmDataChange(next)
    },
    [realmData, roomIndex, layer, onRealmDataChange, readOnly]
  )

  const doFill = useCallback(
    (gx: number, gy: number) => {
      if (readOnly) return
      const key = coordKey(gx, gy)
      const tile = tilemap[key]
      const targetVal = layer === 'floor' ? (tile?.floor ?? 'default') : (tile?.object ?? '')
      const newTilemap = floodFill(tilemap, gx, gy, layer, targetVal, selectedTile, bounds)
      const next = { ...realmData }
      next.rooms[roomIndex]!.tilemap = newTilemap
      onRealmDataChange(next)
    },
    [realmData, roomIndex, layer, selectedTile, tilemap, bounds, onRealmDataChange, readOnly]
  )

  const doRectStart = useCallback((gx: number, gy: number) => {
    rectStartRef.current = { x: gx, y: gy }
  }, [])

  const doRectEnd = useCallback(
    (gx: number, gy: number) => {
      const start = rectStartRef.current
      rectStartRef.current = null
      if (!start || readOnly) return
      const newTilemap = rectFill(tilemap, start.x, start.y, gx, gy, layer, selectedTile, bounds)
      const next = { ...realmData }
      next.rooms[roomIndex]!.tilemap = newTilemap
      onRealmDataChange(next)
    },
    [realmData, roomIndex, layer, selectedTile, tilemap, bounds, onRealmDataChange, readOnly]
  )

  handlersRef.current = {
    place: placeTile,
    erase: eraseTile,
    fill: doFill,
    rectStart: doRectStart,
    rectEnd: doRectEnd,
  }

  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const app = new Application()
    appRef.current = app
    let mounted = true
    let initComplete = false

    const init = async () => {
      try {
        await app.init({
          backgroundColor: 0x1a1a1a,
          resizeTo: containerRef.current!,
          antialias: false,
        })
        initComplete = true
        if (!mounted || !containerRef.current) {
          app.destroy(true, { children: true })
          return
        }
        containerRef.current.appendChild(app.canvas)
        setReady(true)
      } catch (err) {
        if (mounted) console.error('Pixi init failed:', err)
      }
    }
    void init()

    return () => {
      mounted = false
      if (initComplete) {
        app.destroy(true, { children: true })
      }
      appRef.current = null
      setReady(false)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const app = appRef.current
    if (!app?.stage) return

    const stage = app.stage
    stage.removeChildren()

    const tiles = new Container()
    const w = Math.ceil((app.screen.width || 800) / TILE_SIZE) + 2
    const h = Math.ceil((app.screen.height || 600) / TILE_SIZE) + 2

    for (let gy = 0; gy < h; gy++) {
      for (let gx = 0; gx < w; gx++) {
        const g = new Graphics()
        const key = coordKey(gx, gy)
        const tile = room.tilemap[key]
        const floorKey = tile?.floor ?? 'default'
        const floorColor = FLOOR_COLORS[floorKey] ?? FLOOR_COLORS.default
        const objKey = tile?.object ?? ''
        const objColor = objKey ? (OBJECT_COLORS[objKey] ?? 0x6b7280) : 0
        g.rect(gx * TILE_SIZE, gy * TILE_SIZE, TILE_SIZE, TILE_SIZE)
          .fill({ color: floorColor })
          .stroke({ width: 1, color: GRID_COLOR })
        if (objColor) {
          g.rect(gx * TILE_SIZE + 4, gy * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8)
            .fill({ color: objColor })
        }
        tiles.addChild(g)
      }
    }
    stage.addChild(tiles)

    const getTile = (e: { global: { x: number; y: number } }) => {
      const gx = Math.floor(e.global.x / TILE_SIZE)
      const gy = Math.floor(e.global.y / TILE_SIZE)
      return { gx, gy }
    }

    const handlePointerDown = (e: { global: { x: number; y: number }; button: number }) => {
      const { gx, gy } = getTile(e)
      const { place, erase, fill, rectStart } = handlersRef.current
      if (e.button === 2) {
        erase(gx, gy)
        return
      }
      if (tool === 'brush') {
        draggingRef.current = true
        place(gx, gy)
      } else if (tool === 'fill') {
        fill(gx, gy)
      } else if (tool === 'rect') {
        rectStart(gx, gy)
      }
    }

    const handlePointerMove = (e: { global: { x: number; y: number }; button: number }) => {
      if (!draggingRef.current || tool !== 'brush') return
      const { gx, gy } = getTile(e)
      if (e.button === 0) handlersRef.current.place(gx, gy)
      else if (e.button === 2) handlersRef.current.erase(gx, gy)
    }

    const handlePointerUp = (e: { global?: { x: number; y: number } }) => {
      if (tool === 'rect' && rectStartRef.current && e.global) {
        const { gx, gy } = getTile(e as { global: { x: number; y: number } })
        handlersRef.current.rectEnd(gx, gy)
      }
      draggingRef.current = false
    }

    app.stage.eventMode = 'static'
    app.stage.on('pointerdown', handlePointerDown)
    app.stage.on('pointermove', handlePointerMove)
    app.stage.on('pointerup', handlePointerUp)
    app.stage.on('pointerupoutside', handlePointerUp)
    app.canvas.addEventListener?.('contextmenu', (e) => e.preventDefault())

    return () => {
      if (!app.stage) return
      app.stage.off('pointerdown', handlePointerDown)
      app.stage.off('pointermove', handlePointerMove)
      app.stage.off('pointerup', handlePointerUp)
      app.stage.off('pointerupoutside', handlePointerUp)
    }
  }, [ready, room.tilemap, roomIndex, layer, tool])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Room</label>
          <select
            value={roomIndex}
            onChange={(e) => setRoomIndex(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm min-h-[44px] touch-manipulation"
          >
            {realmData.rooms.map((r, i) => (
              <option key={i} value={i}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {!readOnly && (
          <>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Layer</label>
              <select
                value={layer}
                onChange={(e) => setLayer(e.target.value as Layer)}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm min-h-[44px] touch-manipulation"
              >
                <option value="floor">Floor</option>
                <option value="object">Object</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Tool</label>
              <div className="flex gap-1 min-h-[44px] items-center">
                {(['brush', 'fill', 'rect'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTool(t)}
                    className={`min-w-[44px] min-h-[44px] px-3 py-2 rounded text-sm font-medium touch-manipulation ${
                      tool === t
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {t === 'brush' ? 'Brush' : t === 'fill' ? 'Fill' : 'Rect'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                {layer === 'floor' ? 'Floor' : 'Object'}
              </label>
              <div className="flex flex-wrap gap-2 min-h-[44px] items-center">
                {(layer === 'floor' ? Object.keys(FLOOR_COLORS) : ['', ...Object.keys(OBJECT_COLORS)]).map((k) => (
                  <button
                    key={k || '_erase'}
                    type="button"
                    onClick={() => setSelectedTile(k || '')}
                    className={`min-w-[44px] min-h-[44px] rounded border-2 touch-manipulation flex items-center justify-center ${
                      selectedTile === (k || '')
                        ? 'border-purple-500 ring-2 ring-purple-500/50'
                        : 'border-zinc-600 hover:border-zinc-500'
                    } ${!k && layer === 'object' ? 'bg-zinc-800' : ''}`}
                    style={
                      k
                        ? { backgroundColor: `#${(palette[k] ?? 0x4a5568).toString(16).padStart(6, '0')}` }
                        : undefined
                    }
                    title={k || 'Erase object'}
                  >
                    {!k && layer === 'object' && (
                      <span className="text-zinc-500 text-lg leading-none">✕</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <div
        ref={containerRef}
        className="w-full min-h-[320px] rounded border border-zinc-700 overflow-hidden touch-none select-none"
        style={{ touchAction: 'none' }}
      />
      {!readOnly && (
        <p className="text-xs text-zinc-500">
          {tool === 'brush' && 'Drag to paint. Right-click to erase.'}
          {tool === 'fill' && 'Click to flood-fill contiguous same-tile region.'}
          {tool === 'rect' && 'Click two corners to fill a rectangle.'}
        </p>
      )}
    </div>
  )
}
