'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { promoteVaultBarToHand, depositHandBarToVault } from '@/actions/hand'
import { HOLD_IN_HAND, RETURN_TO_VAULT, HAND_FULL_HINT } from '@/lib/hand-movement'

/**
 * Move a single owned BAR between the Hand and the Vault.
 *
 * - In Vault → "Hold in Hand" (promoteVaultBarToHand). Refused (non-blocking)
 *   when the Hand is full.
 * - In Hand → "Return to Vault" (depositHandBarToVault) — a gentle file-away,
 *   NOT compost/archive.
 *
 * Render only for owned, non-planted BARs (see isHandVaultMovable). `compact`
 * is for inline list rows; the default is the roomier detail-page treatment.
 */
export function HandLocationToggle({
    barId,
    inHand,
    handFull,
    compact = false,
}: {
    barId: string
    inHand: boolean
    handFull: boolean
    compact?: boolean
}) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [hint, setHint] = useState<string | null>(null)

    const move = () => {
        setHint(null)
        startTransition(async () => {
            if (inHand) {
                const res = await depositHandBarToVault({ barId })
                if ('error' in res) {
                    setHint(res.error)
                    return
                }
            } else {
                const res = await promoteVaultBarToHand({ barId })
                if ('error' in res) {
                    setHint(res.error)
                    return
                }
                if (!res.success) {
                    setHint(HAND_FULL_HINT)
                    return
                }
            }
            router.refresh()
        })
    }

    const label = inHand ? RETURN_TO_VAULT : HOLD_IN_HAND
    // Pre-empt the round-trip when we already know the Hand is full.
    const blocked = !inHand && handFull

    if (compact) {
        return (
            <button
                type="button"
                onClick={move}
                disabled={pending || blocked}
                title={blocked ? HAND_FULL_HINT : label}
                className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-md border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                {pending ? '…' : blocked ? 'Hand full' : label}
            </button>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                type="button"
                onClick={move}
                disabled={pending || blocked}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <span aria-hidden>{inHand ? '↩' : '✋'}</span>
                {pending ? 'Moving…' : label}
            </button>
            {(hint || blocked) && (
                <p className="text-xs text-amber-400/80">{hint ?? HAND_FULL_HINT}</p>
            )}
        </div>
    )
}
