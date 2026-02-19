'use client'

import { getMarketContent } from '@/actions/market'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { QuestDetailModal } from '@/components/QuestDetailModal'
import { StageIndicator } from '@/components/StageIndicator'
import { KOTTER_STAGES, KotterStage } from '@/lib/kotter'
import Link from 'next/link'

type MarketContent = {
    packs: any[]
    quests: any[]
}

export default function AvailableBarsPage() {
    const router = useRouter()
    const [content, setContent] = useState<MarketContent | null>(null)
    const [isPending, startTransition] = useTransition()
    const [selectedQuest, setSelectedQuest] = useState<any | null>(null)

    useEffect(() => {
        getMarketContent().then(setContent)
    }, [])

    if (!content) {
        return <div className="p-8 text-zinc-500">Loading commissions...</div>
    }

    const others = content.quests

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
                    ←
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">The Market</h1>
                    <p className="text-zinc-400">
                        Collective quests and commissions awaiting activation.
                    </p>
                </div>
            </header>

            {/* All Quests */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {others.length === 0 ? (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                            <p className="text-zinc-500">No open commissions right now.</p>
                            <Link href="/create-bar" className="text-purple-400 hover:text-purple-300 font-bold mt-2 inline-block">
                                Post one yourself →
                            </Link>
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
        </div>
    )
}

function QuestCard({ bar, onSelect, isPending }: { bar: any, onSelect: () => void, isPending: boolean }) {
    const stageInfo = KOTTER_STAGES[bar.kotterStage as KotterStage]

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-colors hover:border-zinc-700">
            <div className="p-5 space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-white text-lg">{bar.title}</h3>
                        <span className="text-xs font-mono text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">
                            {bar.reward}ⓥ
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <StageIndicator stage={bar.kotterStage} size="sm" showDetails={false} />
                    </div>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-3">
                    {bar.description}
                </p>

                {stageInfo && (
                    <div className="text-xs text-zinc-500">
                        {stageInfo.emoji} Stage {bar.kotterStage}: {stageInfo.name}
                    </div>
                )}

                <button
                    onClick={onSelect}
                    disabled={isPending}
                    className="w-full py-2 bg-purple-900/30 border border-purple-800 rounded-lg font-bold text-purple-200 hover:bg-purple-900/50 transition-all"
                >
                    Read for more details
                </button>
            </div>
        </div>
    )
}
