'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  enterSpatialMap,
  getMapPresences,
  updateMapPosition,
  type MapPresence,
} from '@/actions/spatial-presence'
import { parseAvatarConfig, getWalkableSpriteUrl } from '@/lib/avatar-utils'

/** Frame index for 8-frame layout: N_idle, N_walk, S_idle, S_walk, E_idle, E_walk, W_idle, W_walk */
function getFrameOffset(direction: string): number {
  const d = direction.toLowerCase()
  if (d === 'north') return 0
  if (d === 'south') return 2
  if (d === 'east') return 4
  if (d === 'west') return 6
  return 2 // default south
}
import type { RealmData } from '@/lib/spatial-map/types'

const TILE_SIZE = 32

type Props = {
  mapId: string
  mapName: string
  realmData: RealmData
  playerId: string
  playerName: string
  playerAvatarConfig: string | null
}

function parseTilemapBounds(
  tilemap: Record<string, { floor?: string; above_floor?: string; object?: string; impassable?: boolean; teleporter?: unknown }>
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = 0,
    minY = 0,
    maxX = 10,
    maxY = 10
  for (const key of Object.keys(tilemap)) {
    const [x, y] = key.split(', ').map(Number)
    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + 1)
      maxY = Math.max(maxY, y + 1)
    }
  }
  return { minX, minY, maxX, maxY }
}

export function ConclaveSpaceClient({
  mapId,
  mapName,
  realmData,
  playerId,
  playerName: _playerName,
  playerAvatarConfig: _playerAvatarConfig,
}: Props) {
  const [entered, setEntered] = useState(false)
  const [entering, setEntering] = useState(false)
  const [presences, setPresences] = useState<MapPresence[]>([])
  const [myPosition, setMyPosition] = useState<{
    roomIndex: number
    x: number
    y: number
    direction: string
  } | null>(null)
  const [moving, setMoving] = useState(false)

  const roomIndex = realmData.spawnpoint.roomIndex
  const room = realmData.rooms[roomIndex]
  const tilemap = room?.tilemap ?? {}
  const bounds = parseTilemapBounds(tilemap)
  const width = Math.max(bounds.maxX - bounds.minX, 12)
  const height = Math.max(bounds.maxY - bounds.minY, 8)

  const checkPresence = useCallback(async () => {
    const { presences: p } = await getMapPresences(mapId)
    setPresences(p)
    const me = p.find((x) => x.playerId === playerId)
    if (me) {
      setEntered(true)
      setMyPosition({
        roomIndex: me.roomIndex,
        x: me.x,
        y: me.y,
        direction: me.direction,
      })
    }
  }, [mapId, playerId])

  useEffect(() => {
    checkPresence()
    const interval = setInterval(checkPresence, 3000)
    return () => clearInterval(interval)
  }, [checkPresence])

  const handleEnter = async () => {
    setEntering(true)
    const result = await enterSpatialMap(mapId)
    setEntering(false)
    if (result.error) {
      alert(result.error)
      return
    }
    if (result.position) {
      setEntered(true)
      setMyPosition({
        roomIndex: result.position.roomIndex,
        x: result.position.x,
        y: result.position.y,
        direction: 'south',
      })
    }
    await checkPresence()
  }

  const handleTileClick = async (gx: number, gy: number) => {
    if (!entered || !myPosition) return
    setMoving(true)
    await updateMapPosition(mapId, roomIndex, gx, gy, myPosition.direction)
    setMyPosition((prev) => (prev ? { ...prev, x: gx, y: gy } : null))
    setMoving(false)
    await checkPresence()
  }

  if (!entered) {
    return (
      <div className="max-w-lg mx-auto p-8 space-y-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center space-y-6">
          <h2 className="text-xl font-bold text-white">Enter the Conclave</h2>
          <p className="text-zinc-400 text-sm">
            Cross the threshold into {mapName}. You will see yourself and others in the space.
          </p>
          <button
            onClick={handleEnter}
            disabled={entering}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg"
          >
            {entering ? 'Entering…' : 'Enter'}
          </button>
        </div>
        <p className="text-xs text-zinc-600 text-center">
          <Link href="/conclave/space" className="text-zinc-500 hover:text-zinc-400">
            ← Back to spaces
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{mapName}</h1>
        <div className="flex gap-4">
          <span className="text-sm text-zinc-500">
            {presences.length} here
          </span>
          <Link
            href="/conclave/space"
            className="text-sm text-zinc-500 hover:text-zinc-400"
          >
            ← Spaces
          </Link>
        </div>
      </div>

      <div
        className="relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
        style={{
          width: width * TILE_SIZE,
          height: height * TILE_SIZE,
        }}
      >
        {/* Tile grid */}
        <div className="absolute inset-0 grid gap-0" style={{ gridTemplateColumns: `repeat(${width}, ${TILE_SIZE}px)` }}>
          {Array.from({ length: width * height }, (_, i) => {
            const gx = bounds.minX + (i % width)
            const gy = bounds.minY + Math.floor(i / width)
            const key = `${gx}, ${gy}` as const
            const tile = tilemap[key]
            const floor = tile?.floor ?? 'default'
            const isImpassable = tile?.impassable ?? false
            const bg =
              floor === 'grass'
                ? 'bg-emerald-900/50'
                : floor === 'stone'
                  ? 'bg-zinc-600/50'
                  : floor === 'water'
                    ? 'bg-blue-900/50'
                    : 'bg-zinc-800/50'
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleTileClick(gx, gy)}
                disabled={moving || isImpassable}
                className={`${bg} border border-zinc-700/50 hover:border-purple-500/50 disabled:opacity-50 transition`}
                style={{ width: TILE_SIZE, height: TILE_SIZE }}
              />
            )
          })}
        </div>

        {/* Avatars */}
        {presences.map((p) => {
          const config = parseAvatarConfig(p.avatarConfig)
          const spriteUrl = getWalkableSpriteUrl(config)
          const isMe = p.playerId === playerId
          const px = (p.x - bounds.minX) * TILE_SIZE
          const py = (p.y - bounds.minY) * TILE_SIZE

          return (
            <div
              key={p.playerId}
              className="absolute flex flex-col items-center pointer-events-none"
              style={{
                left: px,
                top: py,
                width: TILE_SIZE,
                height: TILE_SIZE,
              }}
            >
              <img
                src={spriteUrl}
                alt=""
                className="object-none"
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  objectFit: 'none',
                  objectPosition: `-${getFrameOffset(p.direction) * 64}px 0`,
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div
                className="hidden w-8 h-8 rounded-full bg-purple-600 items-center justify-center text-white text-xs font-bold"
                style={{ display: 'none' }}
              >
                {p.name.charAt(0)}
              </div>
              <span
                className={`text-[10px] truncate max-w-full ${isMe ? 'text-purple-400 font-bold' : 'text-zinc-400'}`}
              >
                {isMe ? 'You' : p.name}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Click a tile to move. Others will see your position update.
      </p>
    </div>
  )
}
