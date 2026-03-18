'use client'

import { useState } from 'react'

type AssetLike = { id: string; url: string; mimeType?: string | null; metadataJson?: string | null; side?: string | null }

function getRotation(asset: { metadataJson?: string | null }): number {
  if (!asset.metadataJson) return 0
  try {
    const meta = JSON.parse(asset.metadataJson) as { rotationDegrees?: number }
    const d = meta.rotationDegrees
    if (typeof d === 'number' && [0, 90, 180, 270].includes(d)) return d
  } catch {
    /* ignore */
  }
  return 0
}

function getFrontBack(assets: AssetLike[]) {
  const images = assets.filter((a) => a.mimeType?.startsWith('image/'))
  const front = images.find((a) => a.side === 'front' || a.side == null)
  const back = images.find((a) => a.side === 'back')
  return { front, back }
}

type BarFlipCardProps = {
  assets: AssetLike[]
  description?: string
  className?: string
  /** Compact mode for list views (e.g. hand page) */
  compact?: boolean
}

/**
 * Card-style flip UI for BARs with front and back photos.
 * Click/tap to flip. When only one side exists, shows it without flip.
 */
export function BarFlipCard({ assets, description, className = '', compact = false }: BarFlipCardProps) {
  const [flipped, setFlipped] = useState(false)
  const { front, back } = getFrontBack(assets)

  const aspectClass = compact ? 'aspect-square' : 'aspect-[4/3]'
  const padClass = compact ? 'p-2' : 'p-4'
  const textClass = compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'

  if (!front && !back) {
    return (
      <div className={`rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900/50 ${className}`}>
        {description && (
          <div className={padClass}>
            <p className={`font-mono text-zinc-300 ${textClass}`}>{description.split(/\r?\n/)[0]?.trim() || description}</p>
          </div>
        )}
      </div>
    )
  }

  if (!back) {
    const rotation = getRotation(front!)
    return (
      <div className={`rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900/50 ${className}`}>
        <div className={`${aspectClass} overflow-hidden flex items-center justify-center bg-zinc-900`}>
          <img
            src={front!.url}
            alt=""
            className="max-w-full max-h-full object-contain"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        </div>
        {description && (
          <div className={padClass}>
            <p className={`font-mono text-zinc-300 ${textClass}`}>{description.split(/\r?\n/)[0]?.trim() || description}</p>
          </div>
        )}
      </div>
    )
  }

  const frontRotation = getRotation(front!)
  const backRotation = getRotation(back)

  return (
    <div
      className={`rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900/50 ${className}`}
      style={{ perspective: '1000px' }}
    >
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={`block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-xl ${compact ? 'group' : ''}`}
        aria-label={flipped ? 'Show front' : 'Show back'}
      >
        <div className={`relative ${aspectClass} overflow-hidden`} style={{ transformStyle: 'preserve-3d' }}>
          <div
            className="absolute inset-0 flex items-center justify-center bg-zinc-900 transition-transform duration-300 ease-in-out"
            style={{
              backfaceVisibility: 'hidden',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <img
              src={front!.url}
              alt=""
              className="max-w-full max-h-full object-contain"
              style={{ transform: `rotate(${frontRotation}deg)` }}
            />
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center bg-zinc-900 transition-transform duration-300 ease-in-out"
            style={{
              backfaceVisibility: 'hidden',
              transform: flipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            }}
          >
            <img
              src={back.url}
              alt=""
              className="max-w-full max-h-full object-contain"
              style={{ transform: `rotate(${backRotation}deg)` }}
            />
          </div>
          {compact && (
            <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded py-0.5">
              <span className={!flipped ? 'text-purple-400 font-medium' : ''}>Front</span>
              <span>|</span>
              <span className={flipped ? 'text-purple-400 font-medium' : ''}>Back</span>
              <span>— tap to flip</span>
            </div>
          )}
        </div>
        {!compact && (
          <div className="p-2 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <span className={!flipped ? 'text-purple-400 font-medium' : ''}>Front</span>
            <span>|</span>
            <span className={flipped ? 'text-purple-400 font-medium' : ''}>Back</span>
            <span className="text-zinc-600">— tap to flip</span>
          </div>
        )}
      </button>
      {description && (
        <div className={`${padClass} border-t border-zinc-800`}>
          <p className={`font-mono text-zinc-300 ${textClass}`}>{description.split(/\r?\n/)[0]?.trim() || description}</p>
        </div>
      )}
    </div>
  )
}
