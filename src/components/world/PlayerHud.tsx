'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPlayerHudData, type PlayerHudData } from '@/actions/player-hud'
import { getWalkableSpriteUrl, parseAvatarConfig } from '@/lib/avatar-utils'
import { HandModal } from './HandModal'

/**
 * PlayerHud — persistent player overlay shown in the BOTTOM-RIGHT corner of
 * the spatial world view. Harvest-Moon-style: avatar, name, hand/vault counts,
 * quick action buttons.
 *
 * Position: bottom-right (top-right collided with the spoke welcome overlay).
 * D-pad is at bottom-left, carrying indicator is at bottom-center.
 *
 * Hand button opens a modal (NOT the /hand vault page). Vault is accessed by
 * leaving the play space (the modal links to /hand for now until /hand is
 * formally renamed to /vault).
 */

type Props = {
    /** Pass a key that changes when you want the HUD to refetch (e.g. after BAR creation). */
    refreshToken?: string | number
    /** The id of the BAR the player is currently carrying (from URL state). */
    carryingBarId?: string | null
}

export function PlayerHud({ refreshToken, carryingBarId }: Props) {
    const [data, setData] = useState<PlayerHudData | null>(null)
    const [handOpen, setHandOpen] = useState(false)

    useEffect(() => {
        let cancelled = false
        getPlayerHudData().then((result) => {
            if (!cancelled) setData(result)
        })
        return () => {
            cancelled = true
        }
    }, [refreshToken])

    if (!data) {
        return (
            <div className="absolute bottom-4 right-4 z-20 bg-black/70 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-500">
                ...
            </div>
        )
    }

    if ('error' in data) {
        // Silent on auth errors — HUD shouldn't shout in the corner.
        return null
    }

    const parsedConfig = parseAvatarConfig(data.avatarConfig)
    const spriteUrl = parsedConfig ? getWalkableSpriteUrl(parsedConfig) : null

    return (
        <>
            <div className="absolute bottom-4 right-4 z-20 bg-black/85 border border-zinc-700 rounded-lg shadow-lg backdrop-blur-sm overflow-hidden w-[180px] sm:w-[200px]">
                {/* Identity row */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-zinc-800">
                    {/* Avatar */}
                    <div
                        className="w-8 h-8 rounded border border-zinc-600 flex-shrink-0 overflow-hidden flex items-center justify-center"
                        style={{
                            backgroundColor: spriteUrl
                                ? 'transparent'
                                : `hsl(${data.avatarHue}, 40%, 30%)`,
                        }}
                        aria-label={data.name ? `${data.name}'s avatar` : 'Player avatar'}
                    >
                        {spriteUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={spriteUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                style={{
                                    imageRendering: 'pixelated',
                                    objectPosition: 'top left',
                                }}
                                onError={(e) => {
                                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        ) : (
                            <span className="text-zinc-200 text-xs font-bold">
                                {data.name?.[0]?.toUpperCase() ?? '?'}
                            </span>
                        )}
                    </div>

                    {/* Name + tags */}
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-100 font-semibold truncate">
                            {data.name ?? 'Player'}
                        </p>
                        <p className="text-[9px] text-zinc-500 truncate">
                            {[data.nationName, data.archetypeName].filter(Boolean).join(' · ') || '—'}
                        </p>
                    </div>
                </div>

                {/* Counts row */}
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-zinc-800">
                    <div className="text-center flex-1">
                        <p className="text-[8px] uppercase tracking-wider text-zinc-500">Hand</p>
                        <p className="text-sm font-bold text-emerald-400 leading-none">
                            {data.handCount}
                        </p>
                    </div>
                    <div className="text-center flex-1 border-l border-zinc-800/60">
                        <p className="text-[8px] uppercase tracking-wider text-zinc-500">Vault</p>
                        <p className="text-sm font-bold text-purple-400 leading-none">
                            {data.vaultCount}
                        </p>
                    </div>
                    <div className="text-center flex-1 border-l border-zinc-800/60">
                        <p className="text-[8px] uppercase tracking-wider text-zinc-500">Charge</p>
                        <p className="text-sm font-bold text-amber-400 leading-none">
                            {data.chargeCount}
                        </p>
                    </div>
                </div>

                {/* Quick action buttons */}
                <div className="flex items-stretch divide-x divide-zinc-800">
                    <Link
                        href="/capture"
                        className="flex-1 px-2 py-1.5 text-center text-[10px] text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                        title="Capture a BAR"
                    >
                        <span aria-hidden="true">⚡</span>
                        <span className="ml-1">Capture</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setHandOpen(true)}
                        className="flex-1 px-2 py-1.5 text-center text-[10px] text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                        title="Open hand"
                    >
                        <span aria-hidden="true">🎒</span>
                        <span className="ml-1">Hand</span>
                    </button>
                </div>
            </div>

            {handOpen && (
                <HandModal
                    onClose={() => setHandOpen(false)}
                    carryingBarId={carryingBarId ?? null}
                />
            )}
        </>
    )
}
