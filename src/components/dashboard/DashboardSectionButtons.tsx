'use client'

import { useState } from 'react'
import { ExploreModal } from './ExploreModal'
import { CharacterModal } from './CharacterModal'
import { CampaignModal } from './CampaignModal'
import type { CampaignMilestoneGuidance } from '@/lib/bruised-banana-milestone'

type CampaignEntryData = {
    nation: { id: string; name: string } | null
    archetype: { id: string; name: string } | null
    intendedImpact: string[]
    starterQuests: { id: string; title: string }[]
}

type DashboardSectionButtonsProps = {
    player: {
        nation?: { id: string; name: string; description: string; element?: string } | null
        archetype?: { name: string; description?: string | null; wakeUp?: string | null } | null
        roles: { id: string; role: { key: string } }[]
    }
    globalStage: number
    campaignEntry?: CampaignEntryData | null
    activeInstance?: {
        name: string
        targetDescription?: string
        isEventMode?: boolean
        stripeOneTimeUrl?: string
        campaignRef?: string | null
    } | null
    milestoneGuidance?: CampaignMilestoneGuidance | null
    eventGoal?: number
    eventCurrent?: number
    eventPct?: number
    formattedEventCurrent?: string
    formattedEventGoal?: string
}

export function DashboardSectionButtons({
    player,
    globalStage,
    campaignEntry,
    activeInstance,
    milestoneGuidance = null,
    eventGoal = 0,
    eventCurrent = 0,
    eventPct = 0,
    formattedEventCurrent = '$0',
    formattedEventGoal = '$0',
}: DashboardSectionButtonsProps) {
    const [exploreOpen, setExploreOpen] = useState(false)
    const [characterOpen, setCharacterOpen] = useState(false)
    const [campaignOpen, setCampaignOpen] = useState(false)

    return (
        <div className="flex w-full justify-center gap-2 sm:gap-4">
            <button
                type="button"
                onClick={() => setExploreOpen(true)}
                className="flex-1 min-w-0 px-4 py-2 bg-zinc-900/50 border border-zinc-600 rounded-xl hover:border-zinc-500 hover:bg-zinc-800/50 transition font-medium text-zinc-200"
            >
                Explore
            </button>
            <button
                type="button"
                onClick={() => setCharacterOpen(true)}
                className="flex-1 min-w-0 px-4 py-2 bg-purple-900/20 border border-purple-700/50 rounded-xl hover:border-purple-600 hover:bg-purple-900/30 transition font-medium text-purple-200"
            >
                Character
            </button>
            <button
                type="button"
                onClick={() => setCampaignOpen(true)}
                className="flex-1 min-w-0 px-4 py-2 bg-emerald-900/20 border border-emerald-700/50 rounded-xl hover:border-emerald-600 hover:bg-emerald-900/30 transition font-medium text-emerald-200"
            >
                Campaign
            </button>
            <ExploreModal open={exploreOpen} onClose={() => setExploreOpen(false)} />
            <CharacterModal open={characterOpen} onClose={() => setCharacterOpen(false)} player={player} />
            <CampaignModal
                open={campaignOpen}
                onClose={() => setCampaignOpen(false)}
                globalStage={globalStage}
                campaignEntry={campaignEntry}
                activeInstance={activeInstance}
                milestoneGuidance={milestoneGuidance}
                eventGoal={eventGoal}
                eventCurrent={eventCurrent}
                eventPct={eventPct}
                formattedEventCurrent={formattedEventCurrent}
                formattedEventGoal={formattedEventGoal}
            />
        </div>
    )
}
