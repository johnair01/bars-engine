'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPlayerHandContents, type HandContents } from '@/actions/player-hand'

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
 * Hand contents (current heuristic):
 *   - The BAR currently being carried (highest priority — show first)
 *   - Active drafts (unplaced personal work)
 *   - Active unplaced quests (quests not yet bound to a campaign cell)
 *
 * Hand limit: soft cap at 6 for now (Pokemon team size). Future work will
 * formalize this against the prompt deck system (backlog 1.34 PDH).
 *
 * The modal does NOT navigate away. Players close the modal and remain in
 * the spatial room. The "Open Vault" link DOES navigate away — that's the
 * intended ceremony of "leaving the play space to access deep storage."
 */

const HAND_LIMIT = 6

type Props = {
    onClose: () => void
    carryingBarId: string | null
}

export function HandModal({ onClose, carryingBarId }: Props) {
    const [data, setData] = useState<HandContents | null>(null)

    useEffect(() => {
        let cancelled = false
        getPlayerHandContents().then((result) => {
            if (!cancelled) setData(result)
        })
        return () => {
            cancelled = true
        }
    }, [])

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
                {carryingBarId && (
                    <section className="px-5 py-3 border-b border-zinc-800 bg-emerald-950/20">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
                            Currently Carrying
                        </p>
                        <p className="text-xs text-zinc-300">
                            You have a BAR in your hands. Walk to a nursery to plant it.
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1">
                            {carryingBarId.slice(0, 12)}...
                        </p>
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
                {data && 'success' in data && (
                    <>
                        <section className="px-5 py-4 space-y-3">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-xs uppercase tracking-wider text-zinc-400">
                                    Active BARs
                                </h3>
                                <p className="text-[10px] text-zinc-500">
                                    {data.bars.length} / {HAND_LIMIT}
                                </p>
                            </div>

                            {data.bars.length === 0 ? (
                                <p className="text-xs text-zinc-600 italic text-center py-4">
                                    Your hand is empty. Talk to an NPC or capture a charge to add a BAR.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {data.bars.slice(0, HAND_LIMIT).map((bar) => (
                                        <li
                                            key={bar.id}
                                            className="border border-zinc-800 rounded p-2.5 bg-zinc-950/40"
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
                                            {bar.description && (
                                                <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                                                    {bar.description}
                                                </p>
                                            )}
                                            <p className="text-[9px] text-zinc-700 mt-1">
                                                {bar.type}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {data.bars.length > HAND_LIMIT && (
                                <p className="text-[10px] text-amber-500 text-center italic">
                                    Hand is over capacity. {data.bars.length - HAND_LIMIT} extra
                                    BARs need to be moved to your Vault.
                                </p>
                            )}
                        </section>

                        {/* Vault link footer */}
                        <footer className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/40">
                            <p className="text-[10px] text-zinc-500 mb-2 text-center">
                                Need to access more BARs? Leave the play space to enter the Vault.
                            </p>
                            <Link
                                href="/hand"
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
