'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Application, Graphics, Container } from 'pixi.js'
import type { RealmData, TilePoint } from '@/lib/spatial-map/types'

const TILE_SIZE = 32
const GRID_COLOR = 0x333333
const FLOOR_COLORS: Record<string, number> = {
  default: 0x4a5568,
  grass: 0x48bb78,
  stone: 0x718096,
  water: 0x4299e1,
}

function coordKey(x: number, y: number): TilePoint {
  return `${x}, ${y}` as TilePoint
}

type Props = {
  realmData: RealmData
  onRealmDataChange: (data: RealmData) => void
  readOnly?: boolean
}

export function SimpleTileEditor({ realmData, onRealmDataChange, readOnly }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [roomIndex, setRoomIndex] = useState(realmData.spawnpoint.roomIndex)
  const [selectedTile, setSelectedTile] = useState<string>('default')
  const draggingRef = useRef(false)
  const handlersRef = useRef<{ place: (gx: number, gy: number) => void; erase: (gx: number, gy: number) => void }>({ place: () => {}, erase: () => {} })

  const room = realmData.rooms[roomIndex]
  if (!room) return null

  const placeTile = useCallback(
    (gx: number, gy: number) => {
      if (readOnly) return
      const key = coordKey(gx, gy)
      const next = { ...realmData }
      const tilemap = { ...next.rooms[roomIndex]!.tilemap }
      tilemap[key] = { ...tilemap[key], floor: selectedTile }
      next.rooms[roomIndex]!.tilemap = tilemap
      onRealmDataChange(next)
    },
    [realmData, roomIndex, selectedTile, onRealmDataChange, readOnly]
  )

  const eraseTile = useCallback(
    (gx: number, gy: number) => {
      if (readOnly) return
      const key = coordKey(gx, gy)
      const next = { ...realmData }
      const tilemap = { ...next.rooms[roomIndex]!.tilemap }
      delete tilemap[key]
      next.rooms[roomIndex]!.tilemap = tilemap
      onRealmDataChange(next)
    },
    [realmData, roomIndex, onRealmDataChange, readOnly]
  )

  handlersRef.current = { place: placeTile, erase: eraseTile }

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
        const color = FLOOR_COLORS[floorKey] ?? FLOOR_COLORS.default
        g.rect(gx * TILE_SIZE, gy * TILE_SIZE, TILE_SIZE, TILE_SIZE)
          .fill({ color })
          .stroke({ width: 1, color: GRID_COLOR })
        tiles.addChild(g)
      }
    }
    stage.addChild(tiles)

    const handlePointer = (e: { global: { x: number; y: number }; button: number }) => {
      const gx = Math.floor(e.global.x / TILE_SIZE)
      const gy = Math.floor(e.global.y / TILE_SIZE)
      const { place, erase } = handlersRef.current
      if (e.button === 0) place(gx, gy)
      else if (e.button === 2) erase(gx, gy)
    }

    app.stage.eventMode = 'static'
    const onDown = (e: { global: { x: number; y: number }; button: number }) => {
      draggingRef.current = true
      handlePointer(e)
    }
    const onMove = (e: { global: { x: number; y: number }; button: number }) => {
      if (draggingRef.current) handlePointer(e)
    }
    const onUp = () => {
      draggingRef.current = false
    }
    app.stage.on('pointerdown', onDown)
    app.stage.on('pointermove', onMove)
    app.stage.on('pointerup', onUp)
    app.stage.on('pointerupoutside', onUp)
    app.canvas.addEventListener?.('contextmenu', (e) => e.preventDefault())

    return () => {
      app.stage.off('pointerdown', onDown)
      app.stage.off('pointermove', onMove)
      app.stage.off('pointerup', onUp)
      app.stage.off('pointerupoutside', onUp)
    }
  }, [ready, room.tilemap, roomIndex])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Room</label>
          <select
            value={roomIndex}
            onChange={(e) => setRoomIndex(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
          >
            {realmData.rooms.map((r, i) => (
              <option key={i} value={i}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {!readOnly && (
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Tile</label>
            <select
              value={selectedTile}
              onChange={(e) => setSelectedTile(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
            >
              {Object.keys(FLOOR_COLORS).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className="w-full h-[480px] rounded border border-zinc-700 overflow-hidden"
      />
      {!readOnly && (
        <p className="text-xs text-zinc-500">
          Left-click to place tile. Right-click to erase.
        </p>
      )}
    </div>
  )
}
