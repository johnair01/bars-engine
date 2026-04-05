'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { PartyMiniGameDefinition, PartyMiniGameSquare } from '@/lib/party-mini-game/definitions'
import {
  buildPartyMiniGameSessionKey,
  parseStoredCheckedIds,
  serializeCheckedIds,
} from '@/lib/party-mini-game/session-storage'
import { altitudeCssVars, elementCssVars } from '@/lib/ui/card-tokens'
import { PartyMiniGameSquareCaptureModal } from '@/components/party-mini-game/PartyMiniGameSquareCaptureModal'

type Props = {
  game: PartyMiniGameDefinition
  /** Isolates storage from other campaigns/dates — e.g. BB_APR2026_EVENT_STORE_KEY */
  eventKey: string
  sectionId?: string
  /** When set, tap opens BAR capture (who with); when unset, tap toggles session only. */
  playerId?: string | null
}

/**
 * Phase 2: sessionStorage + progress. Logged-in: tap → save private BAR + who (in-game or guest name).
 * @see .specify/specs/party-mini-game-event-layer/spec.md
 */
export function PartyMiniGameGridInteractive({ game, eventKey, sectionId, playerId }: Props) {
  const loggedIn = !!playerId
  const headingId = `${game.id}-grid-title`
  const cardStyle: CSSProperties = {
    ...elementCssVars(game.element),
    ...altitudeCssVars('neutral'),
  }

  const validIdSet = useMemo(
    () => new Set(game.squares.map((s) => s.id)),
    [game.squares],
  )

  const storageKey = useMemo(
    () => buildPartyMiniGameSessionKey(eventKey, game.id),
    [eventKey, game.id],
  )

  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  const [hydrated, setHydrated] = useState(false)
  const [captureSquare, setCaptureSquare] = useState<PartyMiniGameSquare | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const raw = sessionStorage.getItem(storageKey)
        const ids = parseStoredCheckedIds(raw, validIdSet)
        setChecked(new Set(ids))
      } catch {
        setChecked(new Set())
      }
      setHydrated(true)
    })
    return () => cancelAnimationFrame(id)
  }, [storageKey, validIdSet])

  const persist = useCallback(
    (next: Set<string>) => {
      setChecked(next)
      try {
        if (typeof window === 'undefined') return
        if (next.size === 0) {
          sessionStorage.removeItem(storageKey)
        } else {
          sessionStorage.setItem(storageKey, serializeCheckedIds(next))
        }
      } catch {
        /* private mode / quota */
      }
    },
    [storageKey],
  )

  const toggle = useCallback(
    (squareId: string) => {
      if (!validIdSet.has(squareId)) return
      const next = new Set(checked)
      if (next.has(squareId)) next.delete(squareId)
      else next.add(squareId)
      persist(next)
    },
    [checked, persist, validIdSet],
  )

  const markSquareSaved = useCallback(
    (squareId: string) => {
      if (!validIdSet.has(squareId)) return
      setChecked((prev) => {
        const next = new Set(prev)
        next.add(squareId)
        try {
          if (typeof window !== 'undefined') {
            if (next.size === 0) sessionStorage.removeItem(storageKey)
            else sessionStorage.setItem(storageKey, serializeCheckedIds(next))
          }
        } catch {
          /* private mode / quota */
        }
        return next
      })
    },
    [storageKey, validIdSet],
  )

  const reset = useCallback(() => {
    persist(new Set())
  }, [persist])

  const handleCellClick = (sq: PartyMiniGameSquare) => {
    if (loggedIn) {
      setCaptureSquare(sq)
      return
    }
    toggle(sq.id)
  }

  const total = game.squares.length
  const count = checked.size
  const progressId = `${game.id}-progress`
  const loginHref = '/login?callbackUrl=' + encodeURIComponent('/event')

  return (
    <>
      <PartyMiniGameSquareCaptureModal
        square={captureSquare}
        miniGameId={game.id}
        eventKey={eventKey}
        gameTitle={game.title}
        onClose={() => setCaptureSquare(null)}
        onSaved={markSquareSaved}
      />

      <section
        id={sectionId}
        className="scroll-mt-24"
        aria-labelledby={headingId}
      >
        <div className="cultivation-card p-4 sm:p-5" style={cardStyle}>
          <div className="space-y-1 mb-3">
            <h4 id={headingId} className="text-base font-bold text-zinc-100 tracking-tight">
              {game.title}
            </h4>
            {game.goalLine ? (
              <p className="text-xs text-zinc-500 leading-snug">{game.goalLine}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p
                id={progressId}
                className="text-xs text-zinc-400 tabular-nums"
                aria-live="polite"
                aria-atomic="true"
              >
                {hydrated ? (
                  <>
                    <span className="text-zinc-500">Progress:</span>{' '}
                    <span className="text-zinc-200 font-medium">
                      {count} / {total}
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-600">Loading…</span>
                )}
              </p>
              <button
                type="button"
                onClick={reset}
                className="text-[11px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 px-2 py-1.5 min-h-[44px] sm:min-h-0 rounded-md border border-transparent hover:border-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35"
              >
                Clear marks
              </button>
            </div>
            {hydrated && loggedIn ? (
              <p className="text-[10px] text-zinc-600 leading-snug pt-0.5">
                Tap a square to save a <strong className="text-zinc-500 font-medium">private BAR</strong> and note who
                you shared the moment with. Session checkmarks update when you save.
              </p>
            ) : null}
            {hydrated && !loggedIn ? (
              <p className="text-[10px] text-zinc-600 leading-snug pt-0.5">
                Tap to mark squares for this browser session only.{' '}
                <Link href={loginHref} className="text-zinc-400 underline-offset-2 hover:underline font-medium">
                  Log in
                </Link>{' '}
                to save each moment as a BAR in your vault with someone&apos;s name.
              </p>
            ) : null}
          </div>

          {/* Completion celebration */}
          {hydrated && count === total && (
            <div className="rounded-xl border-2 p-4 text-center space-y-2 animate-in zoom-in-95 duration-500 mb-3"
              style={{
                borderColor: 'var(--element-glow)',
                background: 'color-mix(in srgb, var(--element-frame) 15%, transparent)',
              }}
            >
              <div className="text-2xl">✦</div>
              <p className="text-sm font-bold text-white">Bingo complete!</p>
              <p className="text-xs text-zinc-400">
                {loggedIn
                  ? 'Every square captured. Check your vault for the moments you saved.'
                  : 'Every square marked. Log in to save these as BARs in your vault.'}
              </p>
              {loggedIn && (
                <Link
                  href="/hand"
                  className="inline-block mt-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                  style={{
                    borderColor: 'var(--element-frame)',
                    color: 'var(--element-glow)',
                  }}
                >
                  View vault →
                </Link>
              )}
            </div>
          )}

          <ul
            className="grid grid-cols-3 gap-2 list-none m-0 p-0"
            role="list"
            aria-label={`${game.title} prompts`}
            aria-describedby={progressId}
          >
            {game.squares.map((sq) => {
              const on = checked.has(sq.id)
              const label = loggedIn
                ? `${sq.text} — save to vault`
                : `${on ? 'Marked: ' : ''}${sq.text}`
              return (
                <li key={sq.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => handleCellClick(sq)}
                    aria-pressed={loggedIn ? undefined : on}
                    aria-label={label}
                    className={[
                      'min-h-[44px] w-full flex gap-1.5 items-start rounded-lg px-1.5 py-2 text-left sm:px-2.5',
                      'transition-[box-shadow,background-color,border-color] duration-150',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40',
                      on
                        ? 'border-2 bg-white/[0.06]'
                        : 'border border-zinc-700/40 bg-black/30',
                    ].join(' ')}
                    style={
                      on
                        ? {
                            borderColor: 'color-mix(in srgb, var(--element-frame) 55%, transparent)',
                            boxShadow:
                              '0 0 0 1px color-mix(in srgb, var(--element-glow) 35%, transparent)',
                          }
                        : undefined
                    }
                  >
                    <span
                      className="shrink-0 mt-0.5 font-mono text-sm select-none text-zinc-500"
                      aria-hidden
                    >
                      {on ? '☑' : '☐'}
                    </span>
                    <span className="text-sm text-zinc-300 leading-snug">{sq.text}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
