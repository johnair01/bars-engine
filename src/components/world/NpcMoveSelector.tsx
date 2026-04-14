'use client'

import { useEffect, useState, useCallback } from 'react'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import {
    getNpcMovesForPlayer,
    selectMoveAtNpc,
    type FaceMoveCard,
    type NationFlavorCard,
    type GetNpcMovesResult,
} from '@/actions/npc-move-selection'
import type { WcgsStage } from '@/lib/nation/move-library-accessor'

/**
 * NpcMoveSelector — picker UI shown when a player asks an NPC
 * "what move can I make?"
 *
 * Two sections:
 *   1. **Face moves** (primary, always shown) — the 4 moves from THIS NPC's
 *      face lineage (e.g. Ignis offers Smell the Smoke / Cross the Forge /
 *      Shape the Edge / Stand in the Fire). These are PROMPTS the NPC asks;
 *      the player's response becomes a `player_response` BAR.
 *   2. **Nation flavor** (secondary, only when player's nation matches NPC's
 *      nation) — the player's nation moves, framed as "this NPC can teach
 *      these because they're also a {nation}." Empty when no alignment.
 *
 * Face moves are the main path. Nation flavor is alignment bonus.
 */

type Props = {
    face: GameMasterFace
    npcName: string
    campaignRef: string | null
    spokeIndex: number | null
    onCancel: () => void
    onSelected: (result: { barId: string; barTitle: string; moveName: string }) => void
}

const STAGE_ORDER: WcgsStage[] = ['wake_up', 'clean_up', 'grow_up', 'show_up']

const STAGE_META: Record<
    WcgsStage,
    { label: string; color: string; tag: string }
> = {
    wake_up: {
        label: 'Wake Up',
        color: 'text-amber-400',
        tag: 'border-amber-700/40 bg-amber-950/20',
    },
    clean_up: {
        label: 'Clean Up',
        color: 'text-cyan-400',
        tag: 'border-cyan-700/40 bg-cyan-950/20',
    },
    grow_up: {
        label: 'Grow Up',
        color: 'text-emerald-400',
        tag: 'border-emerald-700/40 bg-emerald-950/20',
    },
    show_up: {
        label: 'Show Up',
        color: 'text-rose-400',
        tag: 'border-rose-700/40 bg-rose-950/20',
    },
}

export function NpcMoveSelector({
    face,
    npcName,
    campaignRef,
    spokeIndex,
    onCancel,
    onSelected,
}: Props) {
    const [data, setData] = useState<GetNpcMovesResult | null>(null)
    const [submitting, setSubmitting] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        getNpcMovesForPlayer({ face }).then((result) => {
            if (!cancelled) setData(result)
        })
        return () => {
            cancelled = true
        }
    }, [face])

    const handleSelectFaceMove = useCallback(
        async (move: FaceMoveCard) => {
            setSubmitting(move.moveId)
            setError(null)
            const result = await selectMoveAtNpc({
                moveId: move.moveId,
                moveName: move.shortName,
                moveDescription: move.description,
                wcgsStage: move.wcgsStage,
                face,
                source: 'face',
                prompt: move.prompt,
                trialSlug: move.trialSlug,
                campaignRef,
                spokeIndex,
            })
            setSubmitting(null)
            if ('error' in result) {
                setError(result.error)
                return
            }
            onSelected({
                barId: result.barId,
                barTitle: result.barTitle,
                moveName: move.shortName,
            })
        },
        [face, campaignRef, spokeIndex, onSelected],
    )

    const handleSelectNationMove = useCallback(
        async (move: NationFlavorCard) => {
            setSubmitting(move.moveId)
            setError(null)
            const result = await selectMoveAtNpc({
                moveId: move.moveId,
                moveName: move.moveName,
                moveDescription: move.description,
                wcgsStage: move.wcgsStage,
                face,
                source: 'nation',
                campaignRef,
                spokeIndex,
            })
            setSubmitting(null)
            if ('error' in result) {
                setError(result.error)
                return
            }
            onSelected({
                barId: result.barId,
                barTitle: result.barTitle,
                moveName: move.moveName,
            })
        },
        [face, campaignRef, spokeIndex, onSelected],
    )

    if (!data) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
                <p className="text-zinc-500 text-sm">Gathering {npcName}&apos;s offerings...</p>
            </div>
        )
    }

    if ('error' in data) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-3">
                <p className="text-red-400 text-sm">{data.error}</p>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-zinc-500 hover:text-zinc-300 text-sm"
                >
                    Back
                </button>
            </div>
        )
    }

    // Group face moves by stage (they should be one per stage, but defensive).
    const faceMovesByStage: Record<WcgsStage, FaceMoveCard[]> = {
        wake_up: [],
        clean_up: [],
        grow_up: [],
        show_up: [],
    }
    for (const m of data.faceMoves) faceMovesByStage[m.wcgsStage].push(m)

    // Group nation flavor moves by stage too.
    const nationMovesByStage: Record<WcgsStage, NationFlavorCard[]> = {
        wake_up: [],
        clean_up: [],
        grow_up: [],
        show_up: [],
    }
    for (const m of data.nationFlavorMoves) nationMovesByStage[m.wcgsStage].push(m)

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-5">
            {/* Sticky header */}
            <header className="space-y-1 sticky top-0 bg-zinc-900 -mx-5 -mt-5 px-5 pt-5 pb-3 border-b border-zinc-800 z-10">
                <p className="text-[10px] uppercase tracking-widest text-purple-400">
                    {npcName} asks
                </p>
                <h2 className="text-white font-bold text-base leading-tight">
                    What move do you want to make?
                </h2>
            </header>

            {error && (
                <div className="bg-red-950/40 border border-red-900/50 rounded p-2 text-xs text-red-400">
                    {error}
                </div>
            )}

            {/* ─── PRIMARY: FACE MOVES ─────────────────────────────────────── */}
            <section className="space-y-3">
                <div className="space-y-0.5">
                    <h3 className="text-[10px] uppercase tracking-widest text-purple-400">
                        {npcName.split(' ')[0]}&apos;s Lineage
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                        Pick a move to make this prompt yours
                    </p>
                </div>

                <ul className="space-y-2">
                    {STAGE_ORDER.map((stage) => {
                        const moves = faceMovesByStage[stage]
                        if (!moves || moves.length === 0) return null
                        const meta = STAGE_META[stage]
                        return moves.map((move) => (
                            <li key={move.moveId}>
                                <button
                                    type="button"
                                    disabled={submitting !== null}
                                    onClick={() => handleSelectFaceMove(move)}
                                    className={`w-full text-left border rounded p-3 transition disabled:opacity-50 hover:border-purple-500 ${meta.tag}`}
                                >
                                    <div className="flex items-baseline justify-between gap-2 mb-1">
                                        <span className="text-sm font-semibold text-zinc-100">
                                            {move.shortName}
                                        </span>
                                        <span className={`text-[9px] uppercase tracking-wider ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 italic mb-1">
                                        {move.tagline}
                                    </p>
                                    <p className="text-[11px] text-zinc-500 leading-snug">
                                        &ldquo;{move.prompt}&rdquo;
                                    </p>
                                    {move.trialSlug && (
                                        <p className="text-[9px] text-purple-400 mt-1.5 uppercase tracking-wide">
                                            Trial available
                                        </p>
                                    )}
                                    {submitting === move.moveId && (
                                        <p className="text-[10px] text-purple-400 mt-2">
                                            Committing...
                                        </p>
                                    )}
                                </button>
                            </li>
                        ))
                    })}
                </ul>
            </section>

            {/* ─── SECONDARY: NATION FLAVOR (only when nation aligns) ───────── */}
            {data.nationAligns && data.nationFlavorMoves.length > 0 && (
                <section className="space-y-3 pt-2 border-t border-zinc-800">
                    <div className="space-y-0.5">
                        <h3 className="text-[10px] uppercase tracking-widest text-amber-500">
                            {data.npcNationKey} Nation Offerings
                        </h3>
                        <p className="text-[10px] text-zinc-500">
                            {npcName.split(' ')[0]} is also of your nation. These moves are yours.
                        </p>
                    </div>

                    <ul className="space-y-2">
                        {STAGE_ORDER.map((stage) => {
                            const moves = nationMovesByStage[stage]
                            if (!moves || moves.length === 0) return null
                            const meta = STAGE_META[stage]
                            return moves.map((move) => (
                                <li key={move.moveId}>
                                    <button
                                        type="button"
                                        disabled={submitting !== null}
                                        onClick={() => handleSelectNationMove(move)}
                                        className="w-full text-left border border-zinc-800 hover:border-amber-700/60 rounded p-3 transition disabled:opacity-50 bg-zinc-950/40"
                                    >
                                        <div className="flex items-baseline justify-between gap-2 mb-1">
                                            <span className="text-sm font-semibold text-zinc-200">
                                                {move.moveName}
                                            </span>
                                            <span className={`text-[9px] uppercase tracking-wider ${meta.color}`}>
                                                {meta.label}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 leading-snug">
                                            {move.description}
                                        </p>
                                        {submitting === move.moveId && (
                                            <p className="text-[10px] text-amber-400 mt-2">
                                                Committing...
                                            </p>
                                        )}
                                    </button>
                                </li>
                            ))
                        })}
                    </ul>
                </section>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-800">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting !== null}
                    className="text-zinc-500 hover:text-zinc-300 text-xs disabled:opacity-50"
                >
                    ← Back to {npcName}
                </button>
            </div>
        </div>
    )
}
