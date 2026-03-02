'use client'

import { getMarketContent } from '@/actions/market'
import { updateCampaignDomainPreference } from '@/actions/campaign-domain-preference'
import { getWorldData } from '@/actions/onboarding'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { QuestDetailModal } from '@/components/QuestDetailModal'
import { StageIndicator } from '@/components/StageIndicator'
import { Avatar } from '@/components/Avatar'
import { KOTTER_STAGES, KotterStage } from '@/lib/kotter'
import { CampaignPathForm } from '@/components/CampaignPathForm'
import { ALLYSHIP_DOMAINS, parseCampaignDomainPreference } from '@/lib/allyship-domains'
import Link from 'next/link'

type MarketContent = {
    packs: any[]
    quests: any[]
    graveyardQuests?: any[]
    campaignDomainPreference?: string | null
    activeInstanceKotterStage?: number | null
    activeInstanceName?: string | null
}

export default function AvailableBarsPage() {
    const router = useRouter()
    const [content, setContent] = useState<MarketContent | null>(null)
    const [worldData, setWorldData] = useState<{ nations: any[], playbooks: any[] }>({ nations: [], playbooks: [] })
    const [isPending, startTransition] = useTransition()
    const [selectedQuest, setSelectedQuest] = useState<any | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeStage, setActiveStage] = useState<number | null>(null)
    const [selectedNations, setSelectedNations] = useState<string[]>([])
    const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([])
    const [selectedDomains, setSelectedDomains] = useState<string[]>([])
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showCampaignPath, setShowCampaignPath] = useState(false)

    const refreshContent = () => getMarketContent().then(data => setContent(data as any))

    const hasDomainFilter = parseCampaignDomainPreference(content?.campaignDomainPreference ?? null).length > 0
    const hasClientFilters = searchQuery !== '' || activeStage !== null || selectedNations.length > 0 || selectedArchetypes.length > 0 || selectedDomains.length > 0
    const hasAnyFilter = hasDomainFilter || hasClientFilters

    const handleClearAllFilters = async () => {
        setSearchQuery('')
        setActiveStage(null)
        setSelectedNations([])
        setSelectedArchetypes([])
        setSelectedDomains([])
        await updateCampaignDomainPreference([])
        await refreshContent()
    }

    useEffect(() => {
        refreshContent()
        getWorldData().then(data => {
            setWorldData({ nations: data[0], playbooks: data[1] })
        })
    }, [])

    const others = (content?.quests || []).filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.description.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStage = activeStage === null || q.kotterStage === activeStage

        const creatorNation = q.creator?.nation?.name
        const creatorArchetype = q.creator?.playbook?.name

        const matchesNation = selectedNations.length === 0 || (creatorNation && selectedNations.includes(creatorNation))
        const matchesArchetype = selectedArchetypes.length === 0 || (creatorArchetype && selectedArchetypes.includes(creatorArchetype))
        const matchesDomain = selectedDomains.length === 0 || (q.allyshipDomain && selectedDomains.includes(q.allyshipDomain))

        return matchesSearch && matchesStage && matchesNation && matchesArchetype && matchesDomain
    })

    // Get active filter options (nations/archetypes that have quests)
    const activeNations = Array.from(new Set((content?.quests || []).map(q => q.creator?.nation?.name).filter(Boolean)))
    const activeArchetypes = Array.from(new Set((content?.quests || []).map(q => q.creator?.playbook?.name).filter(Boolean)))

    if (!content) {
        return <div className="p-8 text-zinc-500">Loading commissions...</div>
    }

    const toggleFilter = (list: string[], setList: (v: string[]) => void, value: string) => {
        if (list.includes(value)) {
            setList(list.filter(v => v !== value))
        } else {
            setList([...list, value])
        }
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
                        ←
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">The Market</h1>
                        <p className="text-zinc-400">
                            Collective quests and commissions awaiting activation.
                        </p>
                        {content?.activeInstanceKotterStage && (
                            <p className="text-xs text-teal-400 mt-1">
                                Campaign: Stage {content.activeInstanceKotterStage} — {KOTTER_STAGES[content.activeInstanceKotterStage as KotterStage]?.name ?? 'Urgency'}
                                {content.activeInstanceName && ` (${content.activeInstanceName})`}
                            </p>
                        )}
                    </div>
                </div>
                    <div className="flex items-center gap-2">
                        {hasAnyFilter && (
                            <button
                                onClick={handleClearAllFilters}
                                className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800"
                            >
                                Clear all filters
                            </button>
                        )}
                        <button
                            onClick={() => setShowCampaignPath(!showCampaignPath)}
                            className="text-xs font-bold text-teal-500 hover:text-teal-400 transition-colors flex items-center gap-1 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800"
                        >
                            {showCampaignPath ? 'Hide' : 'Update campaign path'} {showCampaignPath ? '▴' : '▾'}
                        </button>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800"
                        >
                            {showAdvanced ? 'Hide Advanced' : 'Advanced Filters'} {showAdvanced ? '▴' : '▾'}
                        </button>
                    </div>
            </header>

            {/* Campaign Path (Choose your domains) */}
            {showCampaignPath && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold text-white mb-2">Choose your campaign path</h3>
                    <CampaignPathForm
                        initialPreference={content?.campaignDomainPreference ?? null}
                        onSaved={() => {
                            refreshContent()
                        }}
                    />
                </div>
            )}

            {/* Filter UI */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                    <div className="relative w-full md:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
                        <input
                            type="text"
                            placeholder="Search quests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-purple-500 outline-none transition-colors"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        <div className="text-xs text-zinc-500 w-full md:w-auto mb-1 md:mb-0 px-1">Filter by domain</div>
                        {ALLYSHIP_DOMAINS.map(d => (
                            <button
                                key={d.key}
                                onClick={() => toggleFilter(selectedDomains, setSelectedDomains, d.key)}
                                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedDomains.includes(d.key) ? 'bg-teal-600 border-teal-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'}`}
                            >
                                {d.short}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <div className="text-xs text-zinc-500 w-full mb-1 px-1">Filter by Nation</div>
                        {worldData.nations.filter(n => activeNations.includes(n.name)).map(nation => (
                            <button
                                key={nation.id}
                                onClick={() => toggleFilter(selectedNations, setSelectedNations, nation.name)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${selectedNations.includes(nation.name) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                            >
                                {nation.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Archetype Filters */}
                <div className="bg-zinc-900/10 p-2 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2">
                        {worldData.playbooks.filter(p => activeArchetypes.includes(p.name)).map(pb => (
                            <button
                                key={pb.id}
                                onClick={() => toggleFilter(selectedArchetypes, setSelectedArchetypes, pb.name)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedArchetypes.includes(pb.name) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}
                            >
                                {pb.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced / Kotter Filters */}
                {showAdvanced && (
                    <div className="flex gap-2 overflow-x-auto pb-2 animate-in slide-in-from-top-2 duration-300">
                        <button
                            onClick={() => setActiveStage(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeStage === null ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500'}`}
                        >
                            All Stages
                        </button>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(stage => (
                            <button
                                key={stage}
                                onClick={() => setActiveStage(stage)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeStage === stage ? 'bg-yellow-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}
                            >
                                Stage {stage}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* All Quests */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {others.length === 0 ? (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                            {(content?.quests || []).length === 0 ? (
                                <>
                                    <p className="text-zinc-500">No commissions yet. Create one to get started.</p>
                                    <Link href="/bars" className="text-purple-400 hover:text-purple-300 font-bold mt-2 inline-block">
                                        Create BAR
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-zinc-500">No quests found.</p>
                                    <button onClick={handleClearAllFilters} className="text-purple-400 hover:text-purple-300 font-bold mt-2">
                                        Clear all filters
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        others.map(bar => (
                            <QuestCard
                                key={bar.id}
                                bar={bar}
                                onSelect={() => setSelectedQuest(bar)}
                                isPending={isPending}
                            />
                        ))
                    )}
                </div>
            </section>

            {/* Modal for detail view and pickup */}
            {selectedQuest && (
                <QuestDetailModal
                    isOpen={!!selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    quest={selectedQuest}
                />
            )}

            {/* Admin Graveyard Section */}
            {content.graveyardQuests && content.graveyardQuests.length > 0 && (
                <section className="mt-16 pt-8 border-t border-zinc-800">
                    <div className="flex items-center gap-2 mb-6 text-zinc-500">
                        <span className="text-xl">🪦</span>
                        <h2 className="text-xl font-bold uppercase tracking-tighter">The Graveyard</h2>
                        <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-600 font-mono">Completed Certification Quests</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                        {content.graveyardQuests.map(bar => (
                            <QuestCard
                                key={bar.id}
                                bar={bar}
                                onSelect={() => setSelectedQuest(bar)}
                                isPending={isPending}
                                isGraveyard
                                onRestore={async () => {
                                    const { restoreCertificationQuest } = await import('@/actions/admin-certification')
                                    const result = await restoreCertificationQuest(bar.id)
                                    if (result.success) {
                                        window.location.reload()
                                    } else {
                                        alert(result.error)
                                    }
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

function QuestCard({
    bar,
    onSelect,
    isPending,
    isGraveyard = false,
    onRestore
}: {
    bar: any,
    onSelect: () => void,
    isPending: boolean,
    isGraveyard?: boolean,
    onRestore?: () => Promise<void>
}) {
    const stageInfo = KOTTER_STAGES[bar.kotterStage as KotterStage]
    const creator = bar.creator
    const nation = creator?.nation
    const playbook = creator?.playbook
    const isAnonymous = bar.isAnonymous || (bar.visibility === 'public' && !bar.showCreatorName) // Derived or explicit

    const [isRestoring, setIsRestoring] = useState(false)

    return (
        <div className={`bg-zinc-900 border ${isGraveyard ? 'border-zinc-800/50' : 'border-zinc-800'} rounded-xl overflow-hidden transition-colors hover:border-zinc-700 flex flex-col`}>
            <div className="p-5 space-y-4 flex-1">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <h3 className={`font-bold ${isGraveyard ? 'text-zinc-500' : 'text-white'} text-lg`}>{bar.title}</h3>
                        </div>
                        <span className={`text-xs font-mono ${isGraveyard ? 'text-zinc-700 bg-zinc-900/50' : 'text-yellow-500 bg-yellow-900/20'} px-2 py-1 rounded`}>
                            {bar.reward}ⓥ
                        </span>
                    </div>

                    {/* Creator Identity */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {nation && (
                            <span className={`px-1.5 py-0.5 rounded ${isGraveyard ? 'bg-zinc-900/50 text-zinc-600' : 'bg-blue-900/20 text-blue-400'} text-[9px] font-bold border ${isGraveyard ? 'border-zinc-800' : 'border-blue-800/50'} uppercase tracking-tighter`}>
                                {nation.name}
                            </span>
                        )}
                        {playbook && (
                            <span className={`px-1.5 py-0.5 rounded ${isGraveyard ? 'bg-zinc-900/50 text-zinc-600' : 'bg-purple-900/20 text-purple-400'} text-[9px] font-bold border ${isGraveyard ? 'border-zinc-800' : 'border-purple-800/50'} uppercase tracking-tighter`}>
                                {playbook.name}
                            </span>
                        )}
                        {bar.allyshipDomain && (
                            <span className={`px-1.5 py-0.5 rounded ${isGraveyard ? 'bg-zinc-900/50 text-zinc-600' : 'bg-teal-900/20 text-teal-400'} text-[9px] font-bold border ${isGraveyard ? 'border-zinc-800' : 'border-teal-800/50'} uppercase tracking-tighter`}>
                                {ALLYSHIP_DOMAINS.find(d => d.key === bar.allyshipDomain)?.short ?? bar.allyshipDomain}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[9px] text-zinc-600 italic ml-auto pt-0.5">
                            {!isAnonymous && creator && (
                                <Avatar player={{ name: creator.name ?? 'System', avatarConfig: creator.avatarConfig }} size="sm" />
                            )}
                            by {isAnonymous ? 'Anonymous' : (creator?.name || 'System')}
                        </span>
                    </div>
                </div>

                <p className={`text-sm ${isGraveyard ? 'text-zinc-600' : 'text-zinc-400'} line-clamp-3`}>
                    {bar.description}
                </p>

                {stageInfo && !isGraveyard && (
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span>{stageInfo.emoji}</span>
                        <span>Stage {bar.kotterStage}: {stageInfo.name}</span>
                    </div>
                )}
            </div>

            <div className="p-5 pt-0">
                {isGraveyard ? (
                    <button
                        onClick={async (e) => {
                            e.stopPropagation()
                            setIsRestoring(true)
                            await onRestore?.()
                            setIsRestoring(false)
                        }}
                        disabled={isRestoring}
                        className="w-full py-2 bg-zinc-950 border border-zinc-800 rounded-lg font-bold text-zinc-500 hover:text-white hover:border-zinc-600 transition-all text-sm uppercase tracking-widest"
                    >
                        {isRestoring ? 'Resurrecting...' : 'Restore to Market'}
                    </button>
                ) : (
                    <button
                        onClick={onSelect}
                        disabled={isPending}
                        className="w-full py-2 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-800/50 rounded-lg font-bold text-purple-200 hover:from-purple-900/40 hover:to-indigo-900/40 transition-all text-sm"
                    >
                        Details & Accept
                    </button>
                )}
            </div>
        </div>
    )
}
