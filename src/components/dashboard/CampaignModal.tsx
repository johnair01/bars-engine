'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CampaignStageCard } from './CampaignStageCard'
import { CampaignEntryBanner } from '@/components/campaign/CampaignEntryBanner'

type CampaignEntryData = {
    nation: { id: string; name: string } | null
    archetype: { id: string; name: string } | null
    intendedImpact: string[]
    starterQuests: { id: string; title: string }[]
}

type CampaignModalProps = {
    open: boolean
    onClose: () => void
    globalStage: number
    campaignEntry?: CampaignEntryData | null
    activeInstance?: { name: string; targetDescription?: string; isEventMode?: boolean; stripeOneTimeUrl?: string } | null
    eventGoal?: number
    eventCurrent?: number
    eventPct?: number
    formattedEventCurrent?: string
    formattedEventGoal?: string
}

const GAMEBOARD_URL = '/campaign/board?ref=bruised-banana'

export function CampaignModal({
    open,
    onClose,
    globalStage,
    campaignEntry,
    activeInstance,
    eventGoal = 0,
    eventCurrent = 0,
    eventPct = 0,
    formattedEventCurrent = '$0',
    formattedEventGoal = '$0',
}: CampaignModalProps) {
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        },
        [onClose]
    )

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [open, handleEscape])

    if (!open) return null

    const hasCampaignEntry = campaignEntry && (campaignEntry.nation || campaignEntry.archetype || campaignEntry.starterQuests.length > 0)
    const hasLiveInstance = activeInstance?.isEventMode

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            aria-label="Campaign"
        >
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative max-w-lg w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>
                <h2 className="text-xl font-bold text-white mb-4">Campaign</h2>

                {/* Merged Campaign Entry + Live Instance */}
                {(hasCampaignEntry || hasLiveInstance) && (
                    <div className="space-y-4 mb-6">
                        {hasCampaignEntry && (
                            <CampaignEntryBanner
                                nation={campaignEntry!.nation}
                                archetype={campaignEntry!.archetype}
                                intendedImpact={campaignEntry!.intendedImpact}
                                starterQuests={campaignEntry!.starterQuests}
                            />
                        )}
                        {hasLiveInstance && activeInstance && (
                            <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/40 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-[10px] uppercase tracking-widest text-green-400 font-bold mb-1">Live Instance</div>
                                        <div className="text-lg font-bold text-white truncate">{activeInstance.name}</div>
                                        {activeInstance.targetDescription && (
                                            <div className="text-sm text-zinc-400 mt-1">{activeInstance.targetDescription}</div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Link href="/event" onClick={onClose} className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-green-600/60 text-zinc-200 text-xs font-bold">
                                            Event Page →
                                        </Link>
                                        {activeInstance.stripeOneTimeUrl && (
                                            <a href={activeInstance.stripeOneTimeUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold">
                                                Donate
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {eventGoal > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-zinc-500 font-mono">
                                            <span>{formattedEventCurrent}</span>
                                            <span>{formattedEventGoal}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-black border border-zinc-800 overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${Math.round(eventPct * 100)}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
                    <CampaignStageCard currentStage={globalStage} />
                    <Link
                        href={GAMEBOARD_URL}
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition"
                    >
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Campaign</div>
                        <div className="text-zinc-200 font-bold">Gameboard</div>
                    </Link>
                </div>
                <Link
                    href={GAMEBOARD_URL}
                    onClick={onClose}
                    className="block w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white text-center font-medium rounded-lg transition-colors"
                >
                    View full page →
                </Link>
            </div>
        </div>
    )
}
