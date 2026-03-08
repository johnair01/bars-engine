'use client'

import { useState } from 'react'
import { CastingRitual } from './CastingRitual'
import { generateQuestFromReading } from '@/actions/generate-quest'
import { useRouter } from 'next/navigation'

export function DashboardCaster() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [generatedQuest, setGeneratedQuest] = useState<{ title: string, description: string } | null>(null)

    const handleComplete = async (hexagramId: number) => {
        const result = await generateQuestFromReading(hexagramId)

        if ('error' in result) {
            throw new Error(result.error)
        }

        if (result.success && result.quest) {
            if (result.adventureId && result.questId && result.threadId) {
                setIsOpen(false)
                router.refresh()
                router.push(`/adventure/${result.adventureId}/play?questId=${result.questId}&threadId=${result.threadId}`)
            } else {
                setGeneratedQuest({ title: result.quest.title, description: result.quest.description ?? '' })
                router.refresh()
                setTimeout(() => {
                    setIsOpen(false)
                    setGeneratedQuest(null)
                }, 3000)
            }
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="mt-4 w-full p-4 border border-dashed border-yellow-800/50 rounded-xl text-yellow-600 hover:text-yellow-400 hover:border-yellow-600 transition-colors flex items-center justify-center gap-2"
            >
                <span className="text-xl">☰</span>
                <span>Cast the I Ching</span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-yellow-800/50 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl shadow-yellow-900/20">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                >
                    ✕
                </button>

                {!generatedQuest ? (
                    <div className="space-y-4">
                        <CastingRitual
                            mode="modal"
                            onComplete={handleComplete}
                            onCancel={() => setIsOpen(false)}
                        />
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-6 animate-in fade-in duration-500">
                        <div className="text-6xl">🔮</div>
                        <h2 className="text-2xl font-bold text-yellow-500">The Oracle Has Spoken</h2>
                        <div className="max-w-md mx-auto bg-black/40 p-6 rounded-xl border border-yellow-900/30">
                            <h3 className="text-xl font-bold text-white mb-2">{generatedQuest.title}</h3>
                            <p className="text-zinc-400 italic">{generatedQuest.description}</p>
                        </div>
                        <p className="text-zinc-500 text-sm">Play your grammatic quest to begin.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
