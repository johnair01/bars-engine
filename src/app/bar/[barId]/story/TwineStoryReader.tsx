'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { completeQuest } from '@/actions/quest-engine'
import { QuestTwinePlayer } from '@/components/QuestTwinePlayer'
import { TwineLogic } from '@/lib/twine-engine'

export default function TwineStoryReader({ questId, title, description, logic }: { questId: string; title: string; description: string; logic: TwineLogic }) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-purple-400 mb-2">Twine Story Quest</div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-sm text-zinc-500 mt-2">{description}</p>
            </div>
            {error && <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-red-300 text-sm">{error}</div>}
            <QuestTwinePlayer
                logic={logic}
                onComplete={(variables) => startTransition(async () => {
                    const result = await completeQuest(questId, variables)
                    if ('success' in result && result.success) {
                        router.push('/')
                        router.refresh()
                        return
                    }
                    setError('error' in result ? result.error : 'Failed to complete quest')
                })}
            />
            {isPending && <div className="text-xs text-zinc-500 text-center">Completing quest...</div>}
        </div>
    )
}
