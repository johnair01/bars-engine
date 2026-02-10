'use client'

import { useState, useMemo } from 'react'
import { TwineLogic, TwineGameState, getInitialState, navigate, getCurrentPassage } from '@/lib/twine-engine'

interface QuestTwinePlayerProps {
    logic: TwineLogic;
    onComplete: (variables: Record<string, any>) => void;
}

export function QuestTwinePlayer({ logic, onComplete }: QuestTwinePlayerProps) {
    const [state, setState] = useState<TwineGameState>(() => getInitialState(logic))

    const currentPassage = useMemo(() => getCurrentPassage(logic, state), [logic, state])
    const resolvedIntention = typeof state.variables.intention === 'string' ? state.variables.intention : null

    if (!currentPassage) {
        return <div className="p-4 text-red-500 font-mono text-sm">Error: Passage not found.</div>
    }

    const handleChoice = (index: number) => {
        const nextState = navigate(logic, state, index)
        if (nextState) {
            setState(nextState)

            // If the current passage was final, or if we want to check for completion on entry
            // For now, let's assume if isFinal is set, we can complete.
            // But usually, we want the USER to click "Complete" after reading the final passage.
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="prose prose-invert prose-sm">
                <p className="text-zinc-300 text-lg leading-relaxed whitespace-pre-wrap font-serif italic">
                    {currentPassage.text}
                </p>
            </div>

            <div className="grid gap-3">
                {currentPassage.choices.map((choice, index) => (
                    <button
                        key={index}
                        onClick={() => handleChoice(index)}
                        className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 text-left text-zinc-200 transition-all group flex justify-between items-center"
                    >
                        <span>{choice.text}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500">→</span>
                    </button>
                ))}

                {currentPassage.isFinal && (
                    <>
                        {resolvedIntention && (
                            <div className="rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 space-y-1">
                                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Your intention</div>
                                <p className="text-emerald-100 text-sm leading-relaxed">{resolvedIntention}</p>
                            </div>
                        )}
                        <button
                            onClick={() => onComplete(state.variables)}
                            className="w-full p-4 mt-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-900/20"
                        >
                            Complete Quest
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
