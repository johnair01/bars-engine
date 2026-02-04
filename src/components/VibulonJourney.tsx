'use client'

interface VibulonJourneyProps {
    vibeulon: {
        id: string
        originSource: string
        originTitle: string
        generation: number
        createdAt: Date
    }
}

/**
 * Display the journey/provenance of a single Vibeulon.
 * Shows origin, generation (hops), and a visual representation.
 */
export function VibulonJourney({ vibeulon }: VibulonJourneyProps) {
    const genBadge = getGenerationBadge(vibeulon.generation)

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500">
                    #{vibeulon.id.slice(-6)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${genBadge.style}`}>
                    {genBadge.label}
                </span>
            </div>

            <div className="text-sm">
                <span className="text-zinc-500">Origin:</span>{' '}
                <span className="text-zinc-300">{vibeulon.originTitle}</span>
            </div>

            <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(vibeulon.generation, 8) }).map((_, i) => (
                    <div
                        key={i}
                        className={`
                            w-2 h-2 rounded-full
                            ${i === 0 ? 'bg-yellow-400' : 'bg-zinc-600'}
                        `}
                        title={`Hop ${i + 1}`}
                    />
                ))}
                {vibeulon.generation > 8 && (
                    <span className="text-xs text-zinc-500">+{vibeulon.generation - 8}</span>
                )}
            </div>

            <div className="text-xs text-zinc-600">
                {new Date(vibeulon.createdAt).toLocaleDateString()}
            </div>
        </div>
    )
}

function getGenerationBadge(generation: number): { label: string, style: string } {
    if (generation === 1) {
        return { label: '✨ Original', style: 'bg-yellow-500/20 text-yellow-400' }
    } else if (generation <= 3) {
        return { label: `Gen ${generation}`, style: 'bg-blue-500/20 text-blue-400' }
    } else if (generation <= 7) {
        return { label: `Gen ${generation}`, style: 'bg-purple-500/20 text-purple-400' }
    } else {
        return { label: `Elder ${generation}`, style: 'bg-amber-500/20 text-amber-400' }
    }
}

/**
 * Compact wallet view showing Vibeulon collection with generation info
 */
interface WalletGridProps {
    vibeulons: VibulonJourneyProps['vibeulon'][]
}

export function WalletGrid({ vibeulons }: WalletGridProps) {
    if (vibeulons.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500">
                No Vibeulons yet. Complete quests to earn!
            </div>
        )
    }

    // Group by generation for display
    const byGen = vibeulons.reduce((acc, v) => {
        const gen = v.generation >= 8 ? 'elder' : `gen${v.generation}`
        acc[gen] = (acc[gen] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {Object.entries(byGen).map(([gen, count]) => (
                    <div key={gen} className="bg-zinc-800 px-3 py-1.5 rounded-lg text-sm">
                        <span className="text-zinc-400">{gen}:</span>{' '}
                        <span className="text-white font-bold">{count}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {vibeulons.slice(0, 12).map(v => (
                    <VibulonJourney key={v.id} vibeulon={v} />
                ))}
            </div>

            {vibeulons.length > 12 && (
                <div className="text-center text-zinc-500 text-sm">
                    +{vibeulons.length - 12} more Vibeulons
                </div>
            )}
        </div>
    )
}
