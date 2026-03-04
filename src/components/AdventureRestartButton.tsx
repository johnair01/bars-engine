'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { restoreCertificationQuest } from '@/actions/admin-certification'

export function AdventureRestartButton({
    questId,
    storyId,
    children,
    className = '',
}: {
    questId: string
    storyId: string
    children: React.ReactNode
    className?: string
}) {
    const router = useRouter()
    const [isRestoring, setIsRestoring] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleRestart() {
        setIsRestoring(true)
        setError(null)
        const result = await restoreCertificationQuest(questId)
        if (result.success) {
            router.push(`/adventures/${storyId}/play?questId=${questId}`)
        } else {
            setError(result.error ?? 'Failed to restart')
            setIsRestoring(false)
        }
    }

    return (
        <div className={className}>
            {children}
            <button
                type="button"
                onClick={handleRestart}
                disabled={isRestoring}
                className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
                {isRestoring ? 'Restarting…' : 'Restart'}
            </button>
            {error && (
                <p className="mt-2 text-xs text-red-400">{error}</p>
            )}
        </div>
    )
}
