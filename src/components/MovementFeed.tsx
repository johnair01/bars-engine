'use client'

interface MovementFeedItem {
    id: string
    playerName: string
    amount: number
    forWhat: string
    createdAt: Date
}

interface MovementFeedProps {
    items: MovementFeedItem[]
    title?: string
    maxHeight?: string
}

/**
 * Movement feed: who earned what, for what.
 * Shows recent vibeulon-earning events.
 */
export function MovementFeed({ items, title = 'Recent Vibeulon Activity', maxHeight = '12rem' }: MovementFeedProps) {
    if (items.length === 0) {
        return (
            <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">{title}</h2>
                <div className="text-zinc-500 text-sm text-center py-6">No recent activity yet. Complete quests to see Energy flow!</div>
            </section>
        )
    }

    return (
        <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">{title}</h2>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-sm"
                    >
                        <div className="min-w-0 flex-1">
                            <span className="text-white font-medium">{item.playerName}</span>
                            <span className="text-zinc-500"> earned </span>
                            <span className="text-green-400 font-mono">{item.amount} ♦</span>
                            <span className="text-zinc-500"> for </span>
                            <span className="text-zinc-300 truncate block sm:inline" title={item.forWhat}>
                                {item.forWhat}
                            </span>
                        </div>
                        <div className="text-xs text-zinc-600 shrink-0">
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
