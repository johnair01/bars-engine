'use client'

import { useCallback, useEffect, useId, useState, type KeyboardEvent } from 'react'
import type { PartyMiniGameDefinition } from '@/lib/party-mini-game/definitions'
import { PartyMiniGameGridInteractive } from '@/components/party-mini-game/PartyMiniGameGridInteractive'

type Props = {
  game: PartyMiniGameDefinition
  eventKey: string
  sectionId?: string
  playerId: string | null
  buttonLabel: string
  /** Optional anchor id for deep links (hash scroll still lands near the button). */
  anchorId?: string
  buttonClassName?: string
}

/**
 * Bingo / party mini-game behind a button + modal so /event stays scannable (NEV).
 */
export function PartyMiniGameInModal({
  game,
  eventKey,
  sectionId,
  playerId,
  buttonLabel,
  anchorId,
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false)
  const titleId = useId()

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div id={anchorId} className="scroll-mt-24 space-y-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          'inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-lg border border-fuchsia-700/50 bg-fuchsia-950/40 px-4 py-2.5 text-sm font-semibold text-fuchsia-100 hover:bg-fuchsia-900/50 hover:border-fuchsia-500/60 transition-colors'
        }
      >
        {buttonLabel}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
          role="presentation"
          onClick={() => setOpen(false)}
          onKeyDown={onKeyDown}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full sm:max-w-lg max-h-[min(92vh,720px)] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-fuchsia-900/50 bg-zinc-950 shadow-2xl shadow-fuchsia-950/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3">
              <h3 id={titleId} className="text-sm font-bold text-white truncate pr-2">
                {game.title}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <PartyMiniGameGridInteractive game={game} eventKey={eventKey} sectionId={sectionId} playerId={playerId} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
