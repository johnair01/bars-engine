'use client'

import Link from 'next/link'
import { useEffect, useId, useState, useTransition } from 'react'
import { createPartyMiniGameMomentBar, searchPlayersForPartyMiniGame } from '@/actions/party-mini-game-bar'
import type { PartyMiniGameSquare } from '@/lib/party-mini-game/definitions'

type LinkMode = 'player' | 'guest'

type Props = {
  square: PartyMiniGameSquare | null
  miniGameId: string
  eventKey: string
  gameTitle: string
  onClose: () => void
  /** After BAR is created successfully */
  onSaved: (squareId: string) => void
}

/**
 * Logged-in capture: who was this moment with? → server creates private CustomBar.
 */
export function PartyMiniGameSquareCaptureModal(props: Props) {
  const { square, ...rest } = props
  if (!square) return null
  return <PartyMiniGameSquareCaptureModalInner key={square.id} {...rest} square={square} />
}

function PartyMiniGameSquareCaptureModalInner({
  square,
  miniGameId,
  eventKey,
  gameTitle,
  onClose,
  onSaved,
}: Omit<Props, 'square'> & { square: PartyMiniGameSquare }) {
  const titleId = useId()
  const radioName = `pmg-link-${miniGameId}-${square.id}`
  const searchFieldId = `${square.id}-pmg-player-search`
  const guestFieldId = `${square.id}-pmg-guest-name`
  const [linkMode, setLinkMode] = useState<LinkMode>('player')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<{ id: string; name: string }[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (linkMode !== 'player') return
    const q = searchQuery.trim()
    if (q.length < 2) {
      const raf = requestAnimationFrame(() => setResults([]))
      return () => cancelAnimationFrame(raf)
    }
    const t = window.setTimeout(() => {
      void searchPlayersForPartyMiniGame(q).then(setResults)
    }, 320)
    return () => window.clearTimeout(t)
  }, [searchQuery, linkMode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSubmit =
    linkMode === 'player'
      ? !!selectedPlayerId
      : guestName.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit || pending) return
    setError(null)
    startTransition(() => {
      void (async () => {
        const res = await createPartyMiniGameMomentBar({
          miniGameId,
          eventKey,
          squareId: square.id,
          taggedPlayerId: linkMode === 'player' ? selectedPlayerId : null,
          guestName: linkMode === 'guest' ? guestName.trim() : null,
        })
        if ('error' in res) {
          setError(res.error)
          return
        }
        onSaved(square.id)
        onClose()
      })()
    })
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/70"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-zinc-600 bg-[#1a1a18] shadow-xl max-h-[90vh] overflow-y-auto"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 2px rgba(161,161,170,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 space-y-4 border-b border-zinc-800">
          <h2 id={titleId} className="text-base font-bold text-zinc-100">
            Save this moment
          </h2>
          <p className="text-xs text-zinc-500">
            <span className="text-zinc-400">{gameTitle}</span>
            {' · '}
            Private BAR in your vault
          </p>
          <p className="text-sm text-zinc-300 leading-snug">{square.text}</p>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Who was this with?
            </legend>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input
                type="radio"
                name={radioName}
                checked={linkMode === 'player'}
                onChange={() => {
                  setLinkMode('player')
                  setGuestName('')
                  setError(null)
                }}
                className="accent-zinc-400"
              />
              They play here (search by name)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
              <input
                type="radio"
                name={radioName}
                checked={linkMode === 'guest'}
                onChange={() => {
                  setLinkMode('guest')
                  setSelectedPlayerId(null)
                  setSearchQuery('')
                  setResults([])
                  setError(null)
                }}
                className="accent-zinc-400"
              />
              Not in the game yet (their name)
            </label>
          </fieldset>

          {linkMode === 'player' ? (
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500" htmlFor={searchFieldId}>
                Type at least 2 letters
              </label>
              <input
                id={searchFieldId}
                type="text"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedPlayerId(null)
                }}
                className="w-full rounded-lg bg-black/40 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35 min-h-[44px]"
                placeholder="Player name"
              />
              {results.length > 0 ? (
                <ul
                  className="max-h-40 overflow-y-auto rounded-lg border border-zinc-700/80 bg-black/30 divide-y divide-zinc-800"
                  role="listbox"
                  aria-label="Matching players"
                >
                  {results.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedPlayerId === p.id}
                        onClick={() => setSelectedPlayerId(p.id)}
                        className={`w-full text-left px-3 py-2.5 text-sm min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-white/30 ${
                          selectedPlayerId === p.id
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-300 hover:bg-zinc-800/60'
                        }`}
                      >
                        {p.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : searchQuery.trim().length >= 2 ? (
                <p className="text-xs text-zinc-600">No matches — try guest name instead.</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500" htmlFor={guestFieldId}>
                Their name (as you&apos;d like it in your vault)
              </label>
              <input
                id={guestFieldId}
                type="text"
                autoComplete="name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={120}
                className="w-full rounded-lg bg-black/40 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35 min-h-[44px]"
                placeholder="e.g. Alex"
              />
            </div>
          )}

          {error ? (
            <p className="text-sm text-red-400/90" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800/80 min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit || pending}
              onClick={handleSubmit}
              className="px-4 py-2.5 rounded-lg bg-zinc-200 text-zinc-900 text-sm font-bold hover:bg-white disabled:opacity-40 disabled:pointer-events-none min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
            >
              {pending ? 'Saving…' : 'Save to vault'}
            </button>
          </div>

          <p className="text-[10px] text-zinc-600 leading-relaxed">
            BARs are private drafts you can tend from{' '}
            <Link href="/hand" className="text-zinc-400 underline-offset-2 hover:underline">
              Hand
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
