'use client'

import { useMemo, useState } from 'react'
import {
    TwineLogic,
    TwineGameState,
    getInitialState,
    navigate,
    getCurrentPassage
} from '@/lib/twine-engine'

interface FirstAidTwinePlayerProps {
    logic: TwineLogic
    onComplete: (variables: Record<string, unknown>) => void
}

export function FirstAidTwinePlayer({ logic, onComplete }: FirstAidTwinePlayerProps) {
    const [state, setState] = useState<TwineGameState>(() => getInitialState(logic))
    const currentPassage = useMemo(() => getCurrentPassage(logic, state), [logic, state])

    if (!currentPassage) {
        return (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
                Unable to load this protocol script.
            </div>
        )
    }

    const handleChoice = (choiceIndex: number) => {
        const next = navigate(logic, state, choiceIndex)
        if (next) setState(next)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {currentPassage.text}
                </p>
            </div>

            <div className="space-y-3">
                {currentPassage.choices.map((choice, index) => (
                    <button
                        key={`${currentPassage.id}-${index}`}
                        type="button"
                        onClick={() => handleChoice(index)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left text-sm text-zinc-100 transition hover:border-cyan-500/50 hover:bg-zinc-800"
                    >
                        {choice.text}
                    </button>
                ))}

                {currentPassage.isFinal && (
                    <button
                        type="button"
                        onClick={() => onComplete(state.variables)}
                        className="w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-500"
                    >
                        Protocol complete
                    </button>
                )}
            </div>
        </div>
    )
}
