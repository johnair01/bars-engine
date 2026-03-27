'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CampaignStageCard } from './CampaignStageCard'
import { CampaignEntryBanner } from '@/components/campaign/CampaignEntryBanner'
import { CampaignMilestoneStrip } from '@/components/campaign/CampaignMilestoneStrip'
import type { CampaignMilestoneGuidance } from '@/lib/bruised-banana-milestone'

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
    activeInstance?: { name: string; targetDescription?: string; isEventMode?: boolean; stripeOneTimeUrl?: string; campaignRef?: string | null } | null
    eventGoal?: number
    eventCurrent?: number
    eventPct?: number
    formattedEventCurrent?: string
    formattedEventGoal?: string
    /** BBMT — when parent fetches getCampaignMilestoneGuidance */
    milestoneGuidance?: CampaignMilestoneGuidance | null
}

const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

export function CampaignModal({
    open,
    onClose,
    globalStage,
    campaignEntry,
    activeInstance,
    eventGoal = 0,
    eventCurrent: _eventCurrent = 0,
    eventPct = 0,
    formattedEventCurrent = '$0',
    formattedEventGoal = '$0',
    milestoneGuidance,
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
    const campaignRef = activeInstance?.campaignRef ?? DEFAULT_CAMPAIGN_REF
    const hubHref = `/campaign/hub?ref=${encodeURIComponent(campaignRef)}`
    const gameboardHref = `/campaign/board?ref=${encodeURIComponent(campaignRef)}`
    const marketplaceHref = `/campaign/marketplace?ref=${encodeURIComponent(campaignRef)}`

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
                                        {campaignRef === 'bruised-banana' && (
                                            <>
                                                <Link
                                                    href="/event#apr-4"
                                                    onClick={onClose}
                                                    className="px-4 py-2 rounded-lg bg-amber-950/40 border border-amber-800/50 hover:border-amber-600/50 text-amber-200 text-xs font-bold"
                                                >
                                                    Apr 4 night →
                                                </Link>
                                                <Link
                                                    href="/event#apr-5"
                                                    onClick={onClose}
                                                    className="px-4 py-2 rounded-lg bg-violet-950/40 border border-violet-800/50 hover:border-violet-600/50 text-violet-200 text-xs font-bold"
                                                >
                                                    Apr 5 →
                                                </Link>
                                            </>
                                        )}
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
                                {milestoneGuidance && (
                                    <CampaignMilestoneStrip data={milestoneGuidance} variant="dashboard" />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {campaignRef === 'bruised-banana' && !hasLiveInstance && (
                    <div className="mb-6 rounded-xl border border-amber-900/35 bg-amber-950/10 p-4 space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Show up — residency nights</p>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/event"
                                onClick={onClose}
                                className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-amber-600/50 text-zinc-200 text-xs font-bold"
                            >
                                Event page →
                            </Link>
                            <Link
                                href="/event#apr-4"
                                onClick={onClose}
                                className="px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs font-bold"
                            >
                                Apr 4 night →
                            </Link>
                            <Link
                                href="/event#apr-5"
                                onClick={onClose}
                                className="px-3 py-2 rounded-lg bg-violet-950/40 border border-violet-800/50 text-violet-200 text-xs font-bold"
                            >
                                Apr 5 →
                            </Link>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
                    <CampaignStageCard currentStage={globalStage} />
                    <Link
                        href={hubHref}
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition"
                    >
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">8 Portals</div>
                        <div className="text-zinc-200 font-bold">Campaign hub</div>
                    </Link>
                    <Link
                        href={gameboardHref}
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition"
                    >
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Instance deck</div>
                        <div className="text-zinc-200 font-bold">Featured field</div>
                    </Link>
                    <Link
                        href={marketplaceHref}
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:border-teal-900/50 transition"
                    >
                        <div className="text-[10px] uppercase tracking-widest text-teal-600 mb-1">Publish</div>
                        <div className="text-zinc-200 font-bold">Stalls</div>
                    </Link>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                        href={hubHref}
                        onClick={onClose}
                        className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white text-center font-medium rounded-lg transition-colors"
                    >
                        Explore hub →
                    </Link>
                    <Link
                        href={gameboardHref}
                        onClick={onClose}
                        className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-center font-medium rounded-lg transition-colors"
                    >
                        Featured field →
                    </Link>
                    <Link
                        href={marketplaceHref}
                        onClick={onClose}
                        className="flex-1 py-2 px-4 bg-teal-900/80 hover:bg-teal-800 text-teal-100 text-center font-medium rounded-lg transition-colors border border-teal-800/60"
                    >
                        Stalls →
                    </Link>
                </div>
            </div>
        </div>
    )
}
