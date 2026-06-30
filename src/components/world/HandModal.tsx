'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPlayerHand } from '@/actions/hand'
import type { HandContents } from '@/lib/hand-service'

/**
 * HandModal — the player's bounded in-world inventory.
 *
 * **Hand vs Vault** (from the design conversation, 2026-04-11):
 *   - **Hand** is the bounded set of BARs the player can carry into the spatial
 *     world (Pokemon team / early Harvest Moon inventory). Limited size.
 *     Accessible via this modal without leaving the play space.
 *   - **Vault** is the unlimited storage of all the player's BARs (Bill's PC
 *     in Pokemon). Only accessible by leaving the play space (navigating to
 *     /hand, which is the legacy vault page until the rename ships).
 *
 * Hand contents are read from the slot-backed source of truth — `getPlayerHand()`
 * → the `HandSlot` table (6 ordered slots). This is the same hand that the
 * NOW-home Hand glance, "Send to BARS", and the Hand↔Vault toggle operate on,
 * so a BAR bound to a slot (e.g. a deck card just sent to BARS) shows up here.
 * The older derived heuristic in `player-hand.ts` did not, which is why this
 * modal looked disconnected from the real hand.
 *
 * Tapping a BAR opens its detail page (`/bars/:id`); the modal closes on
 * navigation. The "Open Vault" link DOES navigate away — that's the
 * the spatial room. The "Open Vault" link DOES navigate away — that's the
 * intended ceremony of "leaving the play space to access deep storage."
 */

type Props = {
    onClose: () => void
    carryingBarId: string | null
}

export function HandModal({ onClose, carryingBarId }: Props) {
    const [data, setData] = useState<HandContents | { error: string } | null>(null)

    useEffect(() => {
        let cancelled = false
        // Read the real, slot-backed hand (HandSlot table) — the same source the
        // NOW-home Hand and "Send to BARS" use. The old derived heuristic
        // (player-hand.ts) never showed slot-bound BARs like deck cards.
        getPlayerHand().then((result) => {
            if (!cancelled) setData(result)
        })
        return () => {
            cancelled = true
        }
    }, [])

    // Prefer the live carrying state from the hand; fall back to the prop.
    const liveCarryingBarId =
        data && !('error' in data) ? data.carryingBarId : null
    const shownCarryingBarId = liveCarryingBarId ?? carryingBarId
    const handBars =
        data && !('error' in data)
            ? data.slots.filter((s) => s.bar).map((s) => s.bar!)
            : []

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="sticky top-0 bg-zinc-900 px-5 pt-5 pb-3 border-b border-zinc-800 z-10">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-emerald-400">
                                In-World Inventory
                            </p>
                            <h2 className="text-white font-bold text-base mt-0.5">Your Hand</h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-zinc-500 hover:text-zinc-300 text-xs"
                        >
                            Close ✕
                        </button>
                    </div>
                </header>

                {/* Carrying section */}
                {shownCarryingBarId && (
                    <section className="px-5 py-3 border-b border-zinc-800 bg-emerald-950/20">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
                            Currently Carrying
                        </p>
                        <p className="text-xs text-zinc-300">
                            You have a BAR in your hands. Walk to a nursery to plant it.
                        </p>
                        <Link
                            href={`/bars/${shownCarryingBarId}`}
                            className="text-[10px] text-emerald-400/80 hover:text-emerald-300 font-mono mt-1 inline-block"
                        >
                            Open →
                        </Link>
                    </section>
                )}

                {/* Loading */}
                {!data && (
                    <div className="px-5 py-8 text-center text-xs text-zinc-500">
                        Gathering your hand...
                    </div>
                )}

                {/* Error */}
                {data && 'error' in data && (
                    <div className="px-5 py-8 text-center text-xs text-red-400">{data.error}</div>
                )}

                {/* Contents */}
                {data && !('error' in data) && (
                    <>
                        <section className="px-5 py-4 space-y-3">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-xs uppercase tracking-wider text-zinc-400">
                                    Active BARs
                                </h3>
                                <p className="text-[10px] text-zinc-500">
                                    {data.filledCount} / {data.size}
                                </p>
                            </div>

                            {handBars.length === 0 ? (
                                <p className="text-xs text-zinc-600 italic text-center py-4">
                                    Your hand is empty. Draw a card and Send it to BARS, or capture a charge to add one.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {handBars.map((bar) => (
                                        <li key={bar.id}>
                                            <Link
                                                href={`/bars/${bar.id}`}
                                                onClick={onClose}
                                                className="block border border-zinc-800 hover:border-zinc-600 rounded p-2.5 bg-zinc-950/40 transition-colors"
                                            >
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <p className="text-xs font-semibold text-zinc-200 truncate flex-1">
                                                        {bar.title}
                                                    </p>
                                                    {bar.moveType && (
                                                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 flex-shrink-0">
                                                            {bar.moveType}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between gap-2 mt-1">
                                                    <span className="text-[9px] text-zinc-700">{bar.type}</span>
                                                    <span className="text-[9px] text-zinc-500">Open →</span>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* Vault link footer */}
                        <footer className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/40">
                            <p className="text-[10px] text-zinc-500 mb-2 text-center">
                                Need to access more BARs? Leave the play space to enter the Vault.
                            </p>
                            <Link
                                href="/vault"
                                className="block w-full text-center px-3 py-2 rounded bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                            >
                                Open Vault →
                            </Link>
                            <p className="text-[9px] text-zinc-600 text-center mt-2 italic">
                                Leaving the world to enter the Vault is intentional. The Vault is your
                                deep storage; the Hand is what you carry into play.
                            </p>
                        </footer>
                    </>
                )}
            </div>
        </div>
    )
}
