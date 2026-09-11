'use client'

/**
 * BarPickerModal — choose a BAR visually instead of from a dropdown of titles.
 *
 * Player signal (2026-03-29, /campaign/[ref]/spoke/0/seeds):
 *   "when choosing a BAR we need a visual way for people to see their BARs. I
 *    think the simplest way is to bring up a modal of the vault page (or a
 *    simplified version that just pulls certain data from that page. Probably
 *    the BARs that are connected to the BASIC move they chose OR the Game Master
 *    Face, and a way to create a new BAR to plant that's grammatical to where
 *    the player encounters this."
 *
 * So: cards not <option>s, filters on move and face, search, and an inline
 * create that inherits the move from wherever the picker was opened.
 *
 * Deliberately generic — the same complaint was filed three times from three
 * surfaces (nursery beds, capture, the 3·2·1 flow), so this takes its options
 * and its create handler from the caller rather than reaching for data itself.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type BarPick = {
  id: string
  title: string
  type: string
  moveType: string | null
  gmFace: string | null
  nation: string | null
  maturity: string
  createdAt: string
  excerpt: string | null
}

const MOVE_LABELS: Record<string, string> = {
  wakeUp: 'Wake up',
  openUp: 'Open up',
  cleanUp: 'Clean up',
  growUp: 'Grow up',
  showUp: 'Show up',
}

const FACE_LABELS: Record<string, string> = {
  shaman: 'Shaman',
  challenger: 'Challenger',
  regent: 'Regent',
  architect: 'Architect',
  diplomat: 'Diplomat',
  sage: 'Sage',
}

const MATURITY_LABELS: Record<string, string> = {
  captured: 'captured',
  context_named: 'context named',
  elaborated: 'elaborated',
  shared_or_acted: 'shared / acted',
  integrated: 'integrated',
}

function label(map: Record<string, string>, key: string | null): string | null {
  if (!key) return null
  return map[key] ?? key
}

/**
 * `moveType` is stored inconsistently — at time of writing 771 BARs use camelCase
 * (`showUp`) and 8 use snake_case (`show_up`). Left alone the picker renders two
 * chips for one move, each filtering to a different subset. Normalizing here
 * fixes the view without rewriting anyone's rows; the underlying drift is worth
 * a separate cleanup.
 */
function normalizeMoveKey(raw: string | null): string | null {
  if (!raw) return null
  return raw.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

type PickerProps = {
  isOpen: boolean
  onClose: () => void
  bars: BarPick[]
  onPick: (barId: string) => void
  /** Omit to hide the inline-create panel (surfaces where minting is wrong). */
  onCreate?: (input: { title: string; description: string }) => void
  title?: string
  /** The move this picker was opened from — inline-created BARs inherit it. */
  contextMove?: string | null
  /** Human phrase for where the player is, e.g. "the Clean up bed". */
  contextLabel?: string
  busy?: boolean
  emptyHint?: string
}

/**
 * Mounts the body only while open, so filters and the draft reset naturally on
 * each open instead of being cleared by an effect.
 */
export function BarPickerModal(props: PickerProps) {
  if (!props.isOpen) return null
  return <PickerBody {...props} />
}

function PickerBody({
  onClose,
  bars,
  onPick,
  onCreate,
  title = 'Choose a BAR',
  contextMove,
  contextLabel,
  busy = false,
  emptyHint,
}: PickerProps) {
  const [query, setQuery] = useState('')
  // Default to the bed the player is standing in — the whole point is "the BARs
  // connected to the BASIC move they chose".
  const [moveFilter, setMoveFilter] = useState<string>(normalizeMoveKey(contextMove ?? null) ?? 'all')
  const [faceFilter, setFaceFilter] = useState<string>('all')
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(t)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const movesPresent = useMemo(
    () => [
      ...new Set(
        bars.map((b) => normalizeMoveKey(b.moveType)).filter((m): m is string => !!m)
      ),
    ],
    [bars]
  )
  const facesPresent = useMemo(
    () => [...new Set(bars.map((b) => b.gmFace).filter((f): f is string => !!f))],
    [bars]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bars.filter((b) => {
      if (moveFilter !== 'all' && normalizeMoveKey(b.moveType) !== moveFilter) return false
      if (faceFilter !== 'all' && b.gmFace !== faceFilter) return false
      if (!q) return true
      return (
        b.title.toLowerCase().includes(q) || (b.excerpt ?? '').toLowerCase().includes(q)
      )
    })
  }, [bars, query, moveFilter, faceFilter])

  // Filtering to the current bed can hide everything; say so rather than
  // showing an empty box that reads as "you have no BARs".
  const hiddenByFilter = bars.length > 0 && filtered.length === 0

  if (typeof document === 'undefined') return null

  const chipBase =
    'rounded-full border px-3 py-1.5 text-xs transition min-h-[36px] disabled:opacity-50'

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-default bg-black/60 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-h-[92dvh] flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 sm:max-h-[86dvh] sm:max-w-2xl sm:rounded-xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-zinc-100">{title}</h2>
            {contextLabel ? (
              <p className="mt-1 text-xs text-zinc-500">Planting into {contextLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="shrink-0 space-y-3 border-b border-zinc-800 px-5 py-3">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your BARs…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 min-h-[44px]"
          />
          {movesPresent.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setMoveFilter('all')}
                className={`${chipBase} ${moveFilter === 'all' ? 'border-emerald-600 text-emerald-300' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
              >
                All moves
              </button>
              {movesPresent.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMoveFilter(m)}
                  className={`${chipBase} ${moveFilter === m ? 'border-emerald-600 text-emerald-300' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                >
                  {label(MOVE_LABELS, m)}
                </button>
              ))}
            </div>
          )}
          {facesPresent.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFaceFilter('all')}
                className={`${chipBase} ${faceFilter === 'all' ? 'border-fuchsia-600 text-fuchsia-300' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
              >
                All faces
              </button>
              {facesPresent.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFaceFilter(f)}
                  className={`${chipBase} ${faceFilter === f ? 'border-fuchsia-600 text-fuchsia-300' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                >
                  {label(FACE_LABELS, f)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {bars.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {emptyHint ?? 'No BARs yet — make one below.'}
            </p>
          ) : hiddenByFilter ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">
                None of your {bars.length} BARs match these filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMoveFilter('all')
                  setFaceFilter('all')
                  setQuery('')
                }}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[44px]"
              >
                Show all {bars.length}
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onPick(b.id)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-left transition hover:border-emerald-700/60 hover:bg-zinc-900 disabled:opacity-50"
                  >
                    <p className="font-medium text-zinc-100">{b.title}</p>
                    {b.excerpt && b.excerpt !== b.title ? (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{b.excerpt}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-zinc-500">
                      <span className="rounded border border-zinc-800 px-1.5 py-0.5">{b.type}</span>
                      {b.moveType ? (
                        <span className="rounded border border-emerald-900/60 px-1.5 py-0.5 text-emerald-400/90">
                          {label(MOVE_LABELS, normalizeMoveKey(b.moveType))}
                        </span>
                      ) : null}
                      {b.gmFace ? (
                        <span className="rounded border border-fuchsia-900/60 px-1.5 py-0.5 text-fuchsia-400/90">
                          {label(FACE_LABELS, b.gmFace)}
                        </span>
                      ) : null}
                      {b.nation ? (
                        <span className="rounded border border-zinc-800 px-1.5 py-0.5">{b.nation}</span>
                      ) : null}
                      <span className="rounded border border-zinc-800 px-1.5 py-0.5">
                        {label(MATURITY_LABELS, b.maturity)}
                      </span>
                      <span className="ml-auto">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inline create */}
        {onCreate && (
          <div className="shrink-0 border-t border-zinc-800 px-5 py-4">
            {creating ? (
              <div className="space-y-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Name the BAR"
                  autoFocus
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 min-h-[44px]"
                />
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={2}
                  placeholder="What is it, in your words? (optional)"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busy || !newTitle.trim()}
                    onClick={() => onCreate({ title: newTitle.trim(), description: newBody.trim() })}
                    className="rounded-lg border border-emerald-600/70 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50 min-h-[44px]"
                  >
                    {busy ? 'Planting…' : 'Create & plant'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setCreating(false)}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  {contextMove ? (
                    <span className="text-[11px] text-zinc-600">
                      inherits {label(MOVE_LABELS, normalizeMoveKey(contextMove))}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => setCreating(true)}
                className="w-full rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-400 hover:border-emerald-700/60 hover:text-emerald-300 disabled:opacity-50 min-h-[44px]"
              >
                + Make a new BAR for this bed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
