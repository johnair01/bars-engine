'use client'

import { useState, useActionState } from 'react'
import { createCharacter } from '@/actions/conclave'

type Nation = { id: string; name: string; description: string }
type Playbook = { id: string; name: string; description: string; moves: string }

type Step = 'identity' | 'nation' | 'playbook'

export function ConclaveWizard({
    token,
    nations,
    playbooks,
}: {
    token: string
    nations: Nation[]
    playbooks: Playbook[]
}) {
    const [step, setStep] = useState<Step>('identity')
    const [identity, setIdentity] = useState({ name: '', pronouns: '', contact: '' })
    const [nationId, setNationId] = useState<string | null>(null)
    const [playbookId, setPlaybookId] = useState<string | null>(null)

    const [serverState, formAction, isPending] = useActionState(createCharacter, null)

    const selectedNation = nations.find(n => n.id === nationId)
    const selectedPlaybook = playbooks.find(p => p.id === playbookId)

    // DEBUG: Log state on each render
    console.log('[ConclaveWizard] Current state:', { step, identity, nationId, playbookId })

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
                    <p className="text-zinc-400">Where do you hail from? This defines your burden.</p>
                </div>

                <div className="space-y-3">
                    {nations.map(nation => (
                        <button
                            key={nation.id}
                            type="button"
                            onClick={() => setNationId(nation.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${nationId === nation.id
                                ? 'bg-purple-900/30 border-purple-500'
                                : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            <div className="font-bold text-white">{nation.name}</div>
                            <div className="text-sm text-zinc-500">{nation.description}</div>
                        </button>
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

            <div className="grid grid-cols-2 gap-3">
                {playbooks.map(playbook => (
                    <button
                        key={playbook.id}
                        type="button"
                        onClick={() => setPlaybookId(playbook.id)}
                        className={`text-left p-4 rounded-xl border transition-all ${playbookId === playbook.id
                            ? 'bg-blue-900/30 border-blue-500'
                            : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                            }`}
                    >
                        <div className="font-bold text-white text-sm">{playbook.name}</div>
                        <div className="text-xs text-zinc-500 line-clamp-2">{playbook.description}</div>
                    </button>
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
                        {isPending ? 'Creating...' : 'Create Character →'}
                    </button>
                </form>
            </div>

            {serverState?.error && (
                <div className="text-red-500 text-center text-sm">{serverState.error}</div>
            )}
        </div>
    )
}
