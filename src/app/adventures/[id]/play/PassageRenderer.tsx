'use client'

import { useTransition, useState } from 'react'
import { advanceRun } from '@/actions/twine'
import { useRouter } from 'next/navigation'
import type { ParsedPassage } from '@/lib/twine-parser'

interface Props {
    storyId: string
    passage: ParsedPassage
    isEnd: boolean
}

export function PassageRenderer({ storyId, passage, isEnd }: Props) {
    const [isPending, startTransition] = useTransition()
    const [emitted, setEmitted] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    function handleChoice(targetPassageName: string) {
        setError(null)
        setEmitted([])
        startTransition(async () => {
            const result = await advanceRun(storyId, targetPassageName)
            if (result.error) {
                setError(result.error)
            } else {
                if (result.emitted && result.emitted.length > 0) {
                    setEmitted(result.emitted)
                }
                router.refresh()
            }
        })
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Passage name */}
            <div className="text-xs text-zinc-600 font-mono uppercase tracking-widest">{passage.name}</div>

            {/* Passage content */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:p-8">
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-lg">
                    {passage.cleanText}
                </p>
            </div>

            {/* Emitted items notification */}
            {emitted.length > 0 && (
                <div className="p-3 bg-green-900/20 border border-green-800/50 rounded-lg animate-in slide-in-from-bottom-2">
                    <p className="text-green-400 text-sm font-bold">Unlocked:</p>
                    {emitted.map((e, i) => (
                        <p key={i} className="text-green-300 text-sm mt-1">+ {e}</p>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-lg">{error}</div>
            )}

            {/* Choices */}
            {isEnd ? (
                <div className="text-center space-y-4 pt-4">
                    <p className="text-zinc-500 italic">End of story.</p>
                    <a href="/adventures" className="inline-block px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition text-sm">
                        ← Back to Adventures
                    </a>
                </div>
            ) : (
                <div className="space-y-3">
                    {passage.links.map((link, i) => (
                        <button
                            key={i}
                            onClick={() => handleChoice(link.target)}
                            disabled={isPending}
                            className="w-full text-left p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-purple-600/50 hover:bg-zinc-800/50 transition-all disabled:opacity-50 group"
                        >
                            <span className="text-white group-hover:text-purple-400 transition-colors">
                                {link.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
