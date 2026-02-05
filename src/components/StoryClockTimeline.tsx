'use client'

interface StoryClockTimelineProps {
    currentPeriod: number
    storyClock: number
}

export function StoryClockTimeline({ currentPeriod, storyClock }: StoryClockTimelineProps) {
    const periods = [1, 2, 3, 4, 5, 6, 7, 8]

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="mb-4 text-sm text-zinc-500 uppercase tracking-widest">Timeline</div>

            <div className="grid grid-cols-8 gap-2">
                {periods.map(period => {
                    const isActive = period === currentPeriod
                    const isComplete = period < currentPeriod

                    return (
                        <div
                            key={period}
                            className={`relative h-16 rounded-lg border-2 transition-all ${isActive
                                    ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-900/50'
                                    : isComplete
                                        ? 'bg-zinc-800/50 border-zinc-700'
                                        : 'bg-zinc-900/50 border-zinc-800'
                                }`}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className={`text-xs font-bold ${isActive ? 'text-purple-300' : 'text-zinc-600'}`}>
                                    P{period}
                                </div>
                                {isComplete && (
                                    <div className="text-green-500 text-xs">✓</div>
                                )}
                            </div>

                            {/* Progress dots for current period */}
                            {isActive && (
                                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(dot => {
                                        const dotPosition = (period - 1) * 8 + dot
                                        const isFilled = dotPosition <= storyClock
                                        return (
                                            <div
                                                key={dot}
                                                className={`w-1 h-1 rounded-full ${isFilled ? 'bg-purple-400' : 'bg-zinc-700'
                                                    }`}
                                            />
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
                <span>Period 1: Awakening</span>
                <span>Period 8: Culmination</span>
            </div>
        </div>
    )
}
