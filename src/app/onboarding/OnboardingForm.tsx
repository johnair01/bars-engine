'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveOnboardingSelections } from '@/actions/onboarding'

interface Props {
    playerId: string
    playerName: string
    currentNationId: string | null
    currentPlaybookId: string | null
    nations: { id: string; name: string; description: string }[]
    playbooks: { id: string; name: string; description: string }[]
}

export function OnboardingForm({ playerId, playerName, currentNationId, currentPlaybookId, nations, playbooks }: Props) {
    const router = useRouter()
    const [nationId, setNationId] = useState(currentNationId || '')
    const [playbookId, setPlaybookId] = useState(currentPlaybookId || '')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = () => {
        if (!nationId || !playbookId) {
            setError('Please select both a Nation and an Archetype.')
            return
        }
        setError(null)
        startTransition(async () => {
            const result = await saveOnboardingSelections(playerId, nationId, playbookId)
            if (result.error) {
                setError(result.error)
            } else {
                router.push('/')
                router.refresh()
            }
        })
    }

    const selectedNation = nations.find(n => n.id === nationId)
    const selectedPlaybook = playbooks.find(p => p.id === playbookId)

    return (
        <div className="w-full max-w-lg mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm space-y-6">
            <div className="text-center space-y-2">
                <div className="text-4xl">⚡</div>
                <h1 className="text-2xl font-bold text-white">Complete Your Setup</h1>
                <p className="text-zinc-400 text-sm">
                    Welcome{playerName ? `, ${playerName}` : ''}! Choose your Nation and Archetype to begin your journey.
                </p>
            </div>

            {/* Nation Selection */}
            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">Nation</label>
                <select
                    value={nationId}
                    onChange={(e) => setNationId(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition"
                >
                    <option value="">Select a Nation...</option>
                    {nations.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                </select>
                {selectedNation && (
                    <p className="text-xs text-zinc-500 pl-1">{selectedNation.description}</p>
                )}
            </div>

            {/* Archetype Selection */}
            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">Archetype</label>
                <select
                    value={playbookId}
                    onChange={(e) => setPlaybookId(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition"
                >
                    <option value="">Select an Archetype...</option>
                    {playbooks.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                {selectedPlaybook && (
                    <p className="text-xs text-zinc-500 pl-1">{selectedPlaybook.description}</p>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg text-center">
                    {error}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={isPending || !nationId || !playbookId}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-purple-900/20 disabled:opacity-50"
            >
                {isPending ? 'Saving...' : 'Begin Your Journey →'}
            </button>

            {nations.length === 0 && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-center space-y-1">
                    <p className="text-xs text-yellow-400 font-bold">No nations found in database.</p>
                    <p className="text-xs text-yellow-500">An admin needs to run the seed script: <code className="bg-black px-1 rounded">npm run db:seed</code></p>
                </div>
            )}
            {playbooks.length === 0 && nations.length > 0 && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-center space-y-1">
                    <p className="text-xs text-yellow-400 font-bold">No archetypes found in database.</p>
                    <p className="text-xs text-yellow-500">An admin needs to run the seed script: <code className="bg-black px-1 rounded">npm run db:seed</code></p>
                </div>
            )}
        </div>
    )
}
