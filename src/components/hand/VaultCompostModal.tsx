'use client'

/**
 * VaultCompostModal — compost without leaving the page you are on.
 *
 * Player signal (2026-04-15, /capture, with screenshot):
 *   "I should be able to click that link and have the vault open up as a modal
 *    for me to do composting or open the compost function in a modal so I don't
 *    have the leave the screen to clear up charge"
 *
 * The screenshot shows the Vault-cap error rendering its route as bare text —
 * "use Vault Compost (/vault/compost)" — under a charge the player had already
 * typed ("Grief at finally having a flow I like"). It was not clickable, and
 * following it would have thrown that charge away. So: same compost UI, in a
 * modal, over whatever you were doing.
 *
 * Wraps the existing VaultCompostClient rather than reimplementing salvage, so
 * the two surfaces cannot drift.
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { listCompostEligible } from '@/actions/vault-compost'
import { VaultCompostClient, type CompostEligibleRow } from '@/components/hand/VaultCompostClient'

export function VaultCompostModal({
  isOpen,
  onClose,
  reason,
}: {
  isOpen: boolean
  onClose: () => void
  /** Why the modal opened, e.g. the Vault-cap message. */
  reason?: string | null
}) {
  if (!isOpen) return null
  return <CompostBody onClose={onClose} reason={reason} />
}

function CompostBody({ onClose, reason }: { onClose: () => void; reason?: string | null }) {
  const [items, setItems] = useState<CompostEligibleRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    listCompostEligible()
      .then((res) => {
        if (!alive) return
        if ('error' in res) setError(res.error)
        else setItems(res.items)
      })
      .catch(() => {
        if (alive) setError('Could not load compostable items.')
      })
    return () => {
      alive = false
    }
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

  if (typeof document === 'undefined') return null

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Vault Compost"
    >
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-default bg-black/60 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-h-[92dvh] flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 sm:max-h-[88dvh] sm:max-w-3xl sm:rounded-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-zinc-100">Vault Compost</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Salvage the lines that still matter, then release the rest — care, not shame.
            </p>
            {reason ? <p className="mt-2 text-xs text-red-400">{reason}</p> : null}
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="space-y-3">
              <p className="text-sm text-red-400">{error}</p>
              <Link
                href="/vault/compost"
                className="inline-block rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[44px]"
              >
                Open the Compost room instead →
              </Link>
            </div>
          ) : items === null ? (
            <p className="text-sm text-zinc-500">Loading what can be composted…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nothing is eligible for composting right now.
            </p>
          ) : (
            <VaultCompostClient items={items} />
          )}
        </div>

        <div className="shrink-0 border-t border-zinc-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[44px]"
          >
            Back to what I was doing
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
