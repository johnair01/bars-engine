'use client'

import { useState } from 'react'
import { HandModal } from '@/components/world/HandModal'

/**
 * Vault-lobby affordance to open the Hand modal without leaving the Vault.
 * The Hand (bounded active inventory) is reachable from NOW, the Deck, and here.
 * Spec: mga-deck-vault-onboarding T3.3 (Hand openable from the Vault lobby).
 */
export function VaultHandButton() {
    const [open, setOpen] = useState(false)
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-emerald-800/70 bg-emerald-950/30 px-4 py-3 text-sm font-semibold text-emerald-100 hover:border-emerald-500/70 hover:bg-emerald-900/40 min-h-[44px] sm:min-w-[9rem]"
                title="Open your Hand"
            >
                <span aria-hidden>🎒</span>
                Hand
            </button>
            {open && <HandModal onClose={() => setOpen(false)} carryingBarId={null} />}
        </>
    )
}
