'use client'

import { getMarketContent, pickupMarketPack, pickupMarketQuest } from '@/actions/market'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type MarketContent = {
    packs: any[]
    quests: any[]
}

export default function TownSquarePage() {
    const router = useRouter()
    const [content, setContent] = useState<MarketContent | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        getMarketContent().then(setContent)
    }, [])

    if (!content) {
        return <div className="p-8 text-zinc-500">Loading market data...</div>
    }

    const handlePickupPack = (id: string) => {
        startTransition(async () => {
            const res = await pickupMarketPack(id)
            if (res.success) {
                // Determine logic: redirect to home or just refresh?
                // For now, refresh to update "Owned" status if we want to show it,
                // or redirect to home to see the new pack.
                router.push('/')
            } else {
                alert(res.error)
            }
        })
    }

    const handlePickupQuest = (id: string) => {
        startTransition(async () => {
            const res = await pickupMarketQuest(id)
            if (res.success) {
                router.push('/')
            } else {
                alert(res.error)
            }
        })
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 md:p-8 space-y-8">
            <header className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
                    Town Square
                </h1>
                <p className="text-zinc-400 max-w-2xl text-sm sm:text-base">
                    The bustling market of ideas. Pick up commissioned quests from the Salad Bowl
                    or discover community-curated packs recycled by fellow travelers.
                </p>
            </header>

            {/* COMMISSIONED QUESTS (SALAD BOWL) */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">🥗</span> The Salad Bowl
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full font-normal">
                        Public Quests
                    </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {content.quests.length === 0 ? (
                        <div className="text-zinc-500 italic text-sm p-4 border border-zinc-900 rounded-lg">
                            The bowl is empty. Why not toss something in?
                        </div>
                    ) : (
                        content.quests.map(quest => (
                            <div key={quest.id} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl hover:border-amber-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">
                                        {quest.title}
                                    </h3>
                                    <span className="text-xs font-mono text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">
                                        {quest.reward}ⓥ
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                                    {quest.description}
                                </p>
                                <button
                                    onClick={() => handlePickupQuest(quest.id)}
                                    disabled={isPending}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg text-sm font-medium transition-colors border border-zinc-700 hover:border-zinc-500"
                                >
                                    {isPending ? 'Accepting...' : 'Accept Quest'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* COMMUNITY PACKS */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">🎒</span> Community Packs
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full font-normal">
                        Recycled Journeys
                    </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {content.packs.length === 0 ? (
                        <div className="text-zinc-500 italic text-sm p-4 border border-zinc-900 rounded-lg">
                            No community packs available yet. Be the first to recycle one!
                        </div>
                    ) : (
                        content.packs.map(pack => (
                            <div key={pack.id} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl space-y-4 hover:border-blue-500/30 transition-all">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-white">{pack.title}</h3>
                                        {pack.isOwned && (
                                            <span className="text-[10px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">
                                                OWNED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{pack.description}</p>
                                </div>

                                {/* Preview Quests */}
                                <div className="space-y-1">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Includes</div>
                                    {/* @ts-ignore */}
                                    {pack.quests.slice(0, 3).map(pq => (
                                        <div key={pq.id} className="flex items-center justify-between text-xs text-zinc-400 bg-black/20 p-1.5 rounded">
                                            <span className="truncate">{pq.quest.title}</span>
                                            <span className="text-zinc-600">{pq.quest.reward}ⓥ</span>
                                        </div>
                                    ))}
                                    {pack.quests.length > 3 && (
                                        <div className="text-xs text-zinc-600 p-1">+{pack.quests.length - 3} more...</div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handlePickupPack(pack.id)}
                                    disabled={isPending || pack.isOwned}
                                    className="w-full bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-900/50 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {pack.isOwned ? 'Already Owned' : isPending ? 'Adding...' : 'Add to Collection'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}
