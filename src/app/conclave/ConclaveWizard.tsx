'use client'

import { useState, useActionState, useEffect } from 'react'
import { createCharacter } from '@/actions/conclave'
import { useRouter } from 'next/navigation'

type Nation = {
    id: string
    name: string
    description: string
    wakeUp?: string | null
    cleanUp?: string | null
    growUp?: string | null
    showUp?: string | null
}

type Playbook = {
    id: string
    name: string
    description: string
    moves: string
    wakeUp?: string | null
    cleanUp?: string | null
    growUp?: string | null
    showUp?: string | null
}

type Step = 'identity' | 'nation' | 'playbook' | 'setup'

export function ConclaveWizard({
    token,
    theme,
    nations,
    playbooks,
}: {
    token: string
    theme?: string
    nations: Nation[]
    playbooks: Playbook[]
}) {
    const [step, setStep] = useState<Step>('identity')
    const [identity, setIdentity] = useState({ name: '', pronouns: '', contact: '' })
    const [nationId, setNationId] = useState<string | null>(null)
    const [playbookId, setPlaybookId] = useState<string | null>(null)
    const [expandedNation, setExpandedNation] = useState<string | null>(null)
    const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>(null)

    const [serverState, formAction, isPending] = useActionState(createCharacter, null)
    const router = useRouter()

    // Redirect or Success Handling
    useEffect(() => {
        if (serverState?.success) {
            if (theme === 'oceans11') {
                // "Ocean's 11" Theme: Direct to Quest Creation (Setup)
                router.push('/create-bar?setup=true')
            } else {
                router.push('/')
            }
        }
    }, [serverState, theme, router])

    const selectedNation = nations.find(n => n.id === nationId)
    const selectedPlaybook = playbooks.find(p => p.id === playbookId)

    // Random selection helpers
    const selectRandomNation = () => {
        const random = nations[Math.floor(Math.random() * nations.length)]
        setNationId(random.id)
        setExpandedNation(random.id)
    }

    const selectRandomPlaybook = () => {
        const random = playbooks[Math.floor(Math.random() * playbooks.length)]
        setPlaybookId(random.id)
        setExpandedPlaybook(random.id)
    }

    // Move display component
    const MoveDisplay = ({ label, emoji, value }: { label: string; emoji: string; value?: string | null }) => {
        if (!value) return null
        const [moveName, ...descParts] = value.split(':')
        return (
            <div className="py-2 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <span>{emoji}</span>
                    <span className="text-zinc-500">{label}:</span>
                    <span className="text-white">{moveName.trim()}</span>
                </div>
                {descParts.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-1 ml-6">{descParts.join(':').trim()}</p>
                )}
            </div>
        )
    }

    // --- STEP 1: IDENTITY ---
    if (step === 'identity') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-white">Welcome to The Conclave</h1>
                    <p className="text-zinc-400">Before we begin, tell us who you are.</p>
                </div>

                <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Name</label>
                        <input
                            value={identity.name}
                            onChange={e => setIdentity({ ...identity, name: e.target.value })}
                            placeholder="Your Name..."
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Pronouns</label>
                        <input
                            value={identity.pronouns}
                            onChange={e => setIdentity({ ...identity, pronouns: e.target.value })}
                            placeholder="they/them, she/her, etc."
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email or Phone</label>
                        <input
                            value={identity.contact}
                            onChange={e => setIdentity({ ...identity, contact: e.target.value })}
                            placeholder="you@example.com"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white"
                        />
                    </div>
                </div>

                <button
                    disabled={!identity.name || !identity.contact}
                    onClick={() => setStep('nation')}
                    className="w-full bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                >
                    Next: Choose Nation →
                </button>
            </div>
        )
    }

    // --- STEP 2: NATION ---
    if (step === 'nation') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-white">Choose Your Nation</h1>
                    <p className="text-zinc-400">Where do you hail from? This defines your approach to the four paths.</p>
                </div>

                {/* Random Button */}
                <button
                    type="button"
                    onClick={selectRandomNation}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-600 text-zinc-400 hover:border-purple-500 hover:text-purple-400 transition-all flex items-center justify-center gap-2"
                >
                    🎲 Let Fate Decide
                </button>

                <div className="space-y-3">
                    {nations.map(nation => (
                        <div key={nation.id} className="rounded-xl border transition-all overflow-hidden"
                            style={{
                                backgroundColor: nationId === nation.id ? 'rgba(126, 34, 206, 0.15)' : 'rgba(39, 39, 42, 0.3)',
                                borderColor: nationId === nation.id ? 'rgb(168, 85, 247)' : 'rgb(39, 39, 42)'
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setNationId(nation.id)
                                    setExpandedNation(expandedNation === nation.id ? null : nation.id)
                                }}
                                className="w-full text-left p-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-white">{nation.name}</div>
                                        <div className="text-sm text-zinc-500">{nation.description}</div>
                                    </div>
                                    <span className="text-zinc-600 text-xl">
                                        {expandedNation === nation.id ? '−' : '+'}
                                    </span>
                                </div>
                            </button>

                            {/* Expanded Move Details */}
                            {expandedNation === nation.id && (
                                <div className="px-4 pb-4 pt-2 border-t border-zinc-800 bg-zinc-900/50">
                                    <div className="text-xs uppercase text-zinc-500 mb-2">Your Paths in {nation.name}</div>
                                    <MoveDisplay label="Wake Up" emoji="👁" value={nation.wakeUp} />
                                    <MoveDisplay label="Clean Up" emoji="🧹" value={nation.cleanUp} />
                                    <MoveDisplay label="Grow Up" emoji="🌱" value={nation.growUp} />
                                    <MoveDisplay label="Show Up" emoji="🎯" value={nation.showUp} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setStep('identity')}
                        className="flex-1 bg-zinc-800 text-white py-3 rounded-full font-bold"
                    >
                        ← Back
                    </button>
                    <button
                        disabled={!nationId}
                        onClick={() => setStep('playbook')}
                        className="flex-1 bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                    >
                        Next: Choose Playbook →
                    </button>
                </div>
            </div>
        )
    }

    // --- STEP 3: PLAYBOOK ---
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-white">Choose Your Playbook</h1>
                <p className="text-zinc-400">How do you move through the world?</p>
            </div>

            {/* Random Button */}
            <button
                type="button"
                onClick={selectRandomPlaybook}
                className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-600 text-zinc-400 hover:border-blue-500 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
            >
                🎲 Let Fate Decide
            </button>

            <div className="space-y-3">
                {playbooks.map(playbook => (
                    <div key={playbook.id} className="rounded-xl border transition-all overflow-hidden"
                        style={{
                            backgroundColor: playbookId === playbook.id ? 'rgba(30, 64, 175, 0.15)' : 'rgba(39, 39, 42, 0.3)',
                            borderColor: playbookId === playbook.id ? 'rgb(59, 130, 246)' : 'rgb(39, 39, 42)'
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setPlaybookId(playbook.id)
                                setExpandedPlaybook(expandedPlaybook === playbook.id ? null : playbook.id)
                            }}
                            className="w-full text-left p-4"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-white text-sm">{playbook.name}</div>
                                    <div className="text-xs text-zinc-500">{playbook.description}</div>
                                </div>
                                <span className="text-zinc-600 text-xl">
                                    {expandedPlaybook === playbook.id ? '−' : '+'}
                                </span>
                            </div>
                        </button>

                        {/* Expanded Move Details */}
                        {expandedPlaybook === playbook.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-zinc-800 bg-zinc-900/50">
                                <div className="text-xs uppercase text-zinc-500 mb-2">Your Moves as {playbook.name.split(' ')[0]}</div>
                                <MoveDisplay label="Wake Up" emoji="👁" value={playbook.wakeUp} />
                                <MoveDisplay label="Clean Up" emoji="🧹" value={playbook.cleanUp} />
                                <MoveDisplay label="Grow Up" emoji="🌱" value={playbook.growUp} />
                                <MoveDisplay label="Show Up" emoji="🎯" value={playbook.showUp} />

                                {/* Special Moves */}
                                <div className="mt-3 pt-3 border-t border-zinc-700">
                                    <div className="text-xs uppercase text-zinc-500 mb-2">Special Moves</div>
                                    <div className="flex flex-wrap gap-2">
                                        {JSON.parse(playbook.moves).map((move: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-blue-900/30 border border-blue-800 rounded text-xs text-blue-300">
                                                {move}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Summary */}
            {selectedNation && selectedPlaybook && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-medium text-zinc-400">Your Character</h3>
                    <div className="text-white">
                        <span className="font-bold">{identity.name}</span>
                        <span className="text-zinc-500"> ({identity.pronouns})</span>
                    </div>
                    <div className="text-sm text-zinc-400">
                        {selectedNation.name} • {selectedPlaybook.name}
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={() => setStep('nation')}
                    className="flex-1 bg-zinc-800 text-white py-3 rounded-full font-bold"
                >
                    ← Back
                </button>
                <form action={formAction} className="flex-1">
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="identity" value={JSON.stringify(identity)} />
                    <input type="hidden" name="nationId" value={nationId || ''} />
                    <input type="hidden" name="playbookId" value={playbookId || ''} />
                    <button
                        type="submit"
                        disabled={!playbookId || isPending}
                        className="w-full bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                    >
                        {isPending ? 'Creating...' : (theme === 'oceans11' ? 'Start the Job →' : 'Create Character →')}
                    </button>
                </form>
            </div>

            {serverState?.error && (
                <div className="text-red-500 text-center text-sm">{serverState.error}</div>
            )}
        </div>
    )
}
