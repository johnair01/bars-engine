'use client'

import { useState } from 'react'

type Direction = 'north' | 'south' | 'east' | 'west'

type Props = {
  onMove: (dx: number, dy: number, dir: Direction) => void
}

const BUTTONS: { dir: Direction; dx: number; dy: number; label: string; className: string }[] = [
  { dir: 'north', dx: 0,  dy: -1, label: '▲', className: 'col-start-2 row-start-1' },
  { dir: 'west',  dx: -1, dy: 0,  label: '◄', className: 'col-start-1 row-start-2' },
  { dir: 'east',  dx: 1,  dy: 0,  label: '►', className: 'col-start-3 row-start-2' },
  { dir: 'south', dx: 0,  dy: 1,  label: '▼', className: 'col-start-2 row-start-3' },
]

function readTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function DPadOverlay({ onMove }: Props) {
  const [isTouch] = useState(readTouchDevice)

  if (!isTouch) return null

  return (
    <div className="absolute bottom-6 left-4 z-20 grid grid-cols-3 grid-rows-3 gap-1 select-none">
      {BUTTONS.map(({ dir, dx, dy, label, className }) => (
        <button
          key={dir}
          className={`${className} w-12 h-12 flex items-center justify-center rounded-lg bg-zinc-900/80 border border-zinc-700/60 text-zinc-300 text-lg active:bg-zinc-700/80 touch-none`}
          onTouchStart={e => {
            e.preventDefault()
            onMove(dx, dy, dir)
          }}
          onTouchEnd={e => e.preventDefault()}
        >
          {label}
        </button>
      ))}
      {/* Center blank cell */}
      <div className="col-start-2 row-start-2 w-12 h-12 rounded-lg bg-zinc-900/40 border border-zinc-800/40" />
    </div>
  )
}
