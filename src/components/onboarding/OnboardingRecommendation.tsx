import { useState, useTransition, useEffect } from 'react'
import { updatePlayerIdentity } from '@/actions/onboarding'
import { useRouter } from 'next/navigation'

interface Props {
    type: 'nation' | 'archetype'
    recommendedId: string
    options: any[]
    onComplete?: () => void
    questId?: string
    threadId?: string
    isRitual?: boolean
}

export function OnboardingRecommendation({ type, recommendedId, options, onComplete, questId, threadId, isRitual }: Props) {
    // Default to recommendedId if available, otherwise first option
    const [selectedId, setSelectedId] = useState(recommendedId || (options.length > 0 ? options[0].id : ''))
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const recommended = options.find(o => o.id === recommendedId)
    const currentSelection = options.find(o => o.id === selectedId)

    // Sync selectedId with recommendedId when it changes (ensures match is selected immediately)
    useEffect(() => {
        if (recommendedId) setSelectedId(recommendedId)
    }, [recommendedId])

    function handleConfirm() {
        if (!selectedId) return
        setError(null)
        startTransition(async () => {
            try {
                const result = await updatePlayerIdentity(type, selectedId)
                if (result.error) {
                    setError(result.error)
                } else {
                    // If this is part of a quest/thread, complete it
                    if (questId) {
                        const { completeQuest } = await import('@/actions/quest-engine')
                        const inputKey = type === 'nation' ? 'nationId' : 'playbookId'
                        await completeQuest(questId, {
                            [inputKey]: selectedId,
                            recommendationMatched: selectedId === recommendedId
                        }, { threadId })
                    }

                    if (onComplete) onComplete()

                    // RITUAL MODE: If in ritual, push to onboarding controller to maintain flow
                    if (isRitual) {
                        router.push('/conclave/onboarding?ritual=true')
                    } else {
                        // Redirect to dashboard to see results
                        router.push('/')
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Operation failed')
            }
        })
    }

    const title = type === 'nation' ? 'Your Nation' : 'Your Archetype'
    const sub = type === 'nation' ? 'Where do you belong?' : 'Who are you in this world?'

    // If no recommended match found, just show a general selection prompt
    if (!recommended && options.length > 0) {
        return (
            <div className="space-y-6 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2 mb-4">
                    <h3 className="text-xl font-bold text-white">Choose {title}</h3>
                    <p className="text-zinc-500 text-xs italic">{sub}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {options.map(option => (
                        <button
                            key={option.id}
                            onClick={() => setSelectedId(option.id)}
                            className={`p-3 rounded-xl border text-sm transition-all duration-200 ${selectedId === option.id
                                ? 'bg-zinc-800 border-purple-500 text-white shadow-lg'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                                }`}
                        >
                            <div className="font-bold truncate">{option.name}</div>
                        </button>
                    ))}
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleConfirm}
                        disabled={isPending || !selectedId}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-black rounded-xl transition-all shadow-xl shadow-purple-900/40 uppercase tracking-widest text-sm"
                    >
                        {isPending ? 'Synchronizing Identity...' : `Confirm as ${currentSelection?.name || 'Selection'}`}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    {recommendedId ? 'The path is clear...' : 'Choose Your Way'}
                </h2>
                <p className="text-zinc-400 text-sm">{sub}</p>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-2 gap-3">
                {options.map(option => (
                    <button
                        key={option.id}
                        onClick={() => setSelectedId(option.id)}
                        className={`p-3 rounded-xl border text-sm transition-all duration-200 text-left relative overflow-hidden ${selectedId === option.id
                            ? 'bg-zinc-800 border-purple-500 text-white shadow-lg shadow-purple-900/20'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                            }`}
                    >
                        <div className="font-bold truncate">{option.name}</div>
                        {option.id === recommendedId && (
                            <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-purple-600 text-[8px] font-black uppercase tracking-tighter rounded-bl-lg">
                                Match
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Detailed Preview Area */}
            {currentSelection && (
                <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex gap-4 items-start pb-4 border-b border-zinc-800">
                        {currentSelection.imgUrl && (
                            <img src={currentSelection.imgUrl} className="w-20 h-20 rounded-2xl object-cover border border-zinc-700 shadow-xl" alt={currentSelection.name} />
                        )}
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                {currentSelection.name}
                                {currentSelection.id === recommendedId && (
                                    <span className="text-[10px] px-2 py-0.5 bg-purple-900/50 text-purple-400 border border-purple-800 rounded-full font-bold uppercase tracking-widest">
                                        Recommended
                                    </span>
                                )}
                            </h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">{currentSelection.description}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Wake Up</p>
                            <p className="text-xs text-zinc-300 italic">"{currentSelection.wakeUp}"</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Clean Up</p>
                            <p className="text-xs text-zinc-300 italic">"{currentSelection.cleanUp}"</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Grow Up</p>
                            <p className="text-xs text-zinc-300 italic">"{currentSelection.growUp}"</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Show Up</p>
                            <p className="text-xs text-zinc-300 italic">"{currentSelection.showUp}"</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-900/20 text-red-400 text-xs rounded-lg border border-red-900/50">
                    {error}
                </div>
            )}

            {/* Confirm Button */}
            <div className="pt-2">
                <button
                    onClick={handleConfirm}
                    disabled={isPending || !selectedId}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-black rounded-xl transition-all shadow-xl shadow-purple-900/40 uppercase tracking-widest text-sm relative group overflow-hidden"
                >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                        {isPending ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Synchronizing...</span>
                            </>
                        ) : (
                            <span>Confirm as {currentSelection?.name}</span>
                        )}
                    </div>
                    {!isPending && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    )}
                </button>
                <p className="text-center text-zinc-600 text-[10px] mt-6 uppercase tracking-[0.2em] font-medium">
                    Resonance finalized upon confirmation
                </p>
            </div>
        </div>
    )
}
