'use client'

import { useState, useEffect } from 'react'
import type { BarCardData, ChargeType } from '@/lib/bar-card-data'

const CHARGE_GLOW: Record<ChargeType, string> = {
  anger: 'shadow-red-500/30 ring-red-500/40',
  joy: 'shadow-emerald-500/30 ring-emerald-500/40',
  sadness: 'shadow-blue-500/30 ring-blue-500/40',
  fear: 'shadow-zinc-400/30 ring-zinc-400/40',
  neutrality: 'shadow-amber-500/20 ring-amber-700/30',
}

export type BarCardVariant = 'compact' | 'full' | 'flip' | 'export'

interface BarCardProps {
  data: BarCardData
  variant?: BarCardVariant
  className?: string
  children?: React.ReactNode
  /** When true, animate card "arrival" (Shaman: reception ritual) */
  reception?: boolean
}

/**
 * Canonical BAR Card component. Poker-card proportions, paper texture, edge glow by charge type.
 * Spec: .specify/specs/bar-card-physical-and-game-map-ui/spec.md
 */
export function BarCard({ data, variant = 'compact', className = '', children, reception = false }: BarCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(!reception)
  const glow = CHARGE_GLOW[data.chargeType] ?? CHARGE_GLOW.neutrality

  useEffect(() => {
    if (reception && !hasAnimated) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setHasAnimated(true))
      })
      return () => cancelAnimationFrame(id)
    }
  }, [reception, hasAnimated])

  const isCompact = variant === 'compact' || variant === 'export'
  const isFlip = variant === 'flip'

  /** Front = hook: title + one-line action (Challenger lens) */
  const actionLine = data.actionLine ?? (data.description ? data.description.split('\n')[0].slice(0, 60) : '')

  const cardFront =
    variant === 'full' || isFlip ? (
      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-200 line-clamp-2">{data.title}</p>
        {actionLine && (
          <p className="text-xs text-zinc-400 line-clamp-1 italic">{actionLine}{actionLine.length >= 60 ? '…' : ''}</p>
        )}
        <p className="text-[10px] text-zinc-600">
          {new Date(data.createdAt).toLocaleDateString()}
        </p>
      </div>
    ) : (
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-200 truncate">{data.title}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          {new Date(data.createdAt).toLocaleDateString()}
        </p>
      </div>
    )

  const cardBack = (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-200">{data.title}</p>
      <p className="text-xs text-zinc-500 whitespace-pre-wrap">{data.description}</p>
      {data.attachments && data.attachments.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 pt-2">
          {data.attachments.map((att, i) =>
            att.kind === 'image' ? (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded overflow-hidden border border-zinc-700/60 hover:border-zinc-500"
              >
                <img src={att.url} alt={att.name ?? 'Attachment'} className="w-full h-16 object-cover" />
              </a>
            ) : (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 truncate block"
              >
                📎 {att.name ?? 'File'}
              </a>
            )
          )}
        </div>
      )}
      <p className="text-[10px] text-zinc-600">
        {data.creatorName && <span>by {data.creatorName}</span>}
        <span className="ml-2">{new Date(data.createdAt).toLocaleDateString()}</span>
      </p>
    </div>
  )

  const cardContent = isFlip ? (isFlipped ? cardBack : cardFront) : cardFront

  const cardInner = (
    <>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-60" />
      <div className="relative p-3 flex flex-col justify-between h-full">
        {cardContent}
        {children && !isFlip && <div className="mt-2 flex-shrink-0">{children}</div>}
      </div>
    </>
  )

  const cardWrapper = (
    <div
      className={`
        relative rounded-xl border overflow-hidden
        bg-zinc-950/80
        ring-1 ${glow}
        shadow-lg
        bg-[linear-gradient(135deg,rgba(24,24,27,0.95)_0%,rgba(9,9,11,0.98)_100%)]
        ${className}
      `}
      style={{
        aspectRatio: '2.5 / 3.5',
        minHeight: variant === 'full' || isFlip ? 140 : 72,
        width: isCompact ? 70 : undefined,
      }}
    >
      {cardInner}
    </div>
  )

  if (isFlip) {
    const cardBase = `
      relative rounded-xl border overflow-hidden
      bg-zinc-950/80 ring-1 ${glow} shadow-lg
      bg-[linear-gradient(135deg,rgba(24,24,27,0.95)_0%,rgba(9,9,11,0.98)_100%)]
    `
    const receptionStyle = reception
      ? {
          opacity: hasAnimated ? 1 : 0,
          transform: hasAnimated ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        }
      : undefined

    return (
      <div
        className="w-full mx-auto"
        style={{
          perspective: '1000px',
          maxWidth: 'min(calc(100vw - 2rem), calc((100dvh - 4rem) * 2.5 / 3.5))',
          ...receptionStyle,
        }}
      >
        <button
          type="button"
          onClick={() => setIsFlipped((f) => !f)}
          className="w-full text-left block"
          aria-label={isFlipped ? 'Show front' : 'Show back'}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              aspectRatio: '2.5 / 3.5',
            }}
          >
            <div
              className={`absolute inset-0 ${cardBase}`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-60" />
              <div className="relative p-4 flex flex-col justify-between h-full">
                {cardFront}
              </div>
            </div>
            <div
              className={`absolute inset-0 ${cardBase}`}
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-60" />
              <div className="relative p-4 flex flex-col justify-between h-full overflow-y-auto">
                {cardBack}
              </div>
            </div>
          </div>
        </button>
        <p className="text-[10px] text-zinc-600 mt-2 text-center">Tap to flip</p>
      </div>
    )
  }

  return cardWrapper
}
