'use client'

import { useState, useActionState, useEffect } from 'react'
import { createCharacter } from '@/actions/conclave'

// --- TYPES ---
type Nation = { id: string, name: string, description: string, imgUrl: string | null }
type Playbook = { id: string, name: string, description: string, moves: string }

type StarterState = {
    blessedObject: string
    attunement: string
    intention: string
    cursedItem: string
    commissionTitle: string
    commissionDesc: string
    signups: string[]
}

const ATTUNEMENTS = ['Triumph (Anger)', 'Bliss (Joy)', 'Poignance (Sadness)', 'Momentum (Excitement)', 'Peace (Neutrality)']
const SIGNUPS = ['Snack Contribution', 'Drink Contribution', 'Cleanup Crew', 'Vibe Patrol', 'Decor Setup', 'Ice Delivery']

// --- WIZARD COMPONENT ---
export function ConclaveWizard({
    token,
    nations,
    playbooks
}: {
    token: string,
    nations: Nation[],
    playbooks: Playbook[]
}) {
    // --- STATE ---
    const [step, setStep] = useState<'IDENTITY' | 'NATION' | 'PLAYBOOK' | 'STARTER_HUB'>('IDENTITY')

    // Data
    const [identity, setIdentity] = useState({ name: '', pronouns: '', attendance: 'in_person' })
    const [selectedNation, setSelectedNation] = useState<string | null>(null)
    const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null)

    // Starter Pack Data
    const [starter, setStarter] = useState<StarterState>({
        blessedObject: '',
        attunement: '',
        intention: '',
        cursedItem: '',
        commissionTitle: '',
        commissionDesc: '',
        signups: []
    })

    // Actions
    const [serverState, formAction, isPending] = useActionState(createCharacter, null)

    // Derived State
    const currentNation = nations.find(n => n.id === selectedNation)
    const currentPlaybook = playbooks.find(p => p.id === selectedPlaybook)

    // Vibeulon Calculation
    const vibeulons = [
        starter.blessedObject ? 1 : 0,
        starter.attunement ? 1 : 0,
        starter.intention ? 1 : 0,
        starter.commissionTitle ? 1 : 0,
        starter.cursedItem ? 1 : 0,
        starter.signups.length > 0 ? starter.signups.length : 0
    ].reduce((a, b) => a + b, 0)

    const cappedVibulons = Math.min(vibeulons, 8)


    // --- STEP 1: IDENTITY ---
    if (step === 'IDENTITY') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-zinc-500 uppercase tracking-widest text-sm">Step 1: Introduction</h2>
                    <h1 className="text-3xl font-bold text-white">Who Enters The Conclave?</h1>
                </div>

                <div className="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Name</label>
                        <input
                            value={identity.name}
                            onChange={e => setIdentity({ ...identity, name: e.target.value })}
                            placeholder="Your Name..."
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Pronouns (Optional)</label>
                        <input
                            value={identity.pronouns}
                            onChange={e => setIdentity({ ...identity, pronouns: e.target.value })}
                            placeholder="they/them, she/her, etc."
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Attendance</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIdentity({ ...identity, attendance: 'in_person' })}
                                className={`flex-1 py-3 rounded-lg border transition-all ${identity.attendance === 'in_person' ? 'bg-zinc-800 border-white text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                            >
                                In Person
                            </button>
                            <button
                                onClick={() => setIdentity({ ...identity, attendance: 'online' })}
                                className={`flex-1 py-3 rounded-lg border transition-all ${identity.attendance === 'online' ? 'bg-zinc-800 border-white text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                            >
                                Online
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        disabled={!identity.name}
                        onClick={() => setStep('NATION')}
                        className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Next: Choose Nation →
                    </button>
                </div>
            </div>
        )
    }

    // --- STEP 2: NATION ---
    if (step === 'NATION') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-24">
                <div className="text-center space-y-2">
                    <h2 className="text-zinc-500 uppercase tracking-widest text-sm">Step 2: Origin</h2>
                    <h1 className="text-3xl font-bold text-white">Select Your Nation</h1>
                    <p className="text-zinc-400 max-w-md mx-auto">This is where you hail from. It defines your burden.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {nations.map(nation => (
                        <button
                            key={nation.id}
                            onClick={() => setSelectedNation(nation.id)}
                            className={`text-left p-6 rounded-xl border transition-all duration-200 group relative overflow-hidden ${selectedNation === nation.id
                                    ? 'bg-zinc-900 border-purple-500/50 ring-1 ring-purple-500/50'
                                    : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            <div className="relative z-10">
                                <h3 className={`font-bold text-lg mb-1 group-hover:text-purple-300 transition-colors ${selectedNation === nation.id ? 'text-purple-400' : 'text-zinc-200'}`}>
                                    {nation.name}
                                </h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{nation.description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-6 bg-black border-t border-zinc-900 flex justify-between max-w-3xl mx-auto w-full z-50">
                    <button onClick={() => setStep('IDENTITY')} className="text-zinc-500 hover:text-white">← Back</button>
                    <button
                        disabled={!selectedNation}
                        onClick={() => setStep('PLAYBOOK')}
                        className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Next: Choose Playbook →
                    </button>
                </div>
            </div>
        )
    }

    // --- STEP 3: PLAYBOOK ---
    if (step === 'PLAYBOOK') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-24">
                <div className="text-center space-y-2">
                    <h2 className="text-zinc-500 uppercase tracking-widest text-sm">Step 3: Action</h2>
                    <h1 className="text-3xl font-bold text-white">Select Your Playbook</h1>
                    <p className="text-zinc-400 max-w-md mx-auto">This defines how you move through the world.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {playbooks.map(pb => (
                        <button
                            key={pb.id}
                            onClick={() => setSelectedPlaybook(pb.id)}
                            className={`text-left p-6 rounded-xl border transition-all h-full flex flex-col ${selectedPlaybook === pb.id
                                    ? 'bg-zinc-900 border-blue-500/50 ring-1 ring-blue-500/50'
                                    : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            <h3 className={`font-bold text-lg mb-2 ${selectedPlaybook === pb.id ? 'text-blue-400' : 'text-zinc-200'}`}>
                                {pb.name}
                            </h3>
                            <p className="text-zinc-500 text-sm mb-4 flex-grow">{pb.description}</p>
                            <div className="space-y-1">
                                {JSON.parse(pb.moves).map((move: string, i: number) => (
                                    <div key={i} className="text-xs bg-zinc-950 px-2 py-1 rounded text-zinc-400 font-mono inline-block mr-1">
                                        [{move}]
                                    </div>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-6 bg-black border-t border-zinc-900 flex justify-between max-w-3xl mx-auto w-full z-50">
                    <button onClick={() => setStep('NATION')} className="text-zinc-500 hover:text-white">← Back</button>
                    <button
                        disabled={!selectedPlaybook}
                        onClick={() => setStep('STARTER_HUB')}
                        className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Next: Starter Pack →
                    </button>
                </div>
            </div>
        )
    }

    // --- STEP 4: STARTER HUB (The Meat) ---
    if (step === 'STARTER_HUB') {
        const canSubmit = cappedVibulons >= 0 // Always capable, just optional

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-32">
                <div className="text-center space-y-2">
                    <div className="inline-block bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1 mb-2">
                        <span className="text-green-400 font-bold mr-2">♦ {cappedVibulons} VIBULONS EARNED</span>
                        <span className="text-zinc-500 text-xs">(Cap: 8)</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">The Starter Pack</h1>
                    <p className="text-zinc-400 max-w-md mx-auto">Complete these optional tasks to earn starting Vibulons. Prepare yourself for the festivities.</p>
                </div>

                <div className="space-y-4">
                    {/* 1. BLESSED OBJECT */}
                    <div className={`p-6 rounded-xl border transition-all ${starter.blessedObject ? 'bg-zinc-900/50 border-green-900/50' : 'bg-zinc-950 border-zinc-800'}`}>
                        <h3 className="font-bold text-white mb-2 flex justify-between">
                            1. Bring a Blessed Object
                            {starter.blessedObject && <span className="text-green-500">✓ (+1)</span>}
                        </h3>
                        <p className="text-xs text-zinc-500 mb-4">Name a small object you will physically bring to the party. It represents where you came from.</p>
                        <input
                            placeholder="Object Name (e.g. My Grandmother's Ring)"
                            value={starter.blessedObject}
                            onChange={e => setStarter({ ...starter, blessedObject: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                        />
                    </div>

                    {/* 2. ATTUNEMENT (Requires Blessed Object) */}
                    <div className={`p-6 rounded-xl border transition-all ${!starter.blessedObject ? 'opacity-50 grayscale' : ''} ${starter.attunement ? 'bg-zinc-900/50 border-green-900/50' : 'bg-zinc-950 border-zinc-800'}`}>
                        <h3 className="font-bold text-white mb-2 flex justify-between">
                            2. Attune Your Object
                            {starter.attunement && <span className="text-green-500">✓ (+1)</span>}
                        </h3>
                        <p className="text-xs text-zinc-500 mb-4">What emotional energy does this object hold?</p>
                        <select
                            disabled={!starter.blessedObject}
                            value={starter.attunement}
                            onChange={e => setStarter({ ...starter, attunement: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                        >
                            <option value="">Select Energy...</option>
                            {ATTUNEMENTS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    {/* 3. PERSONAL INTENTION */}
                    <div className={`p-6 rounded-xl border transition-all ${starter.intention ? 'bg-zinc-900/50 border-green-900/50' : 'bg-zinc-950 border-zinc-800'}`}>
                        <h3 className="font-bold text-white mb-2 flex justify-between">
                            3. Personal Intention
                            {starter.intention && <span className="text-green-500">✓ (+1)</span>}
                        </h3>
                        <p className="text-xs text-zinc-500 mb-4">One sentence describing the experience you desire.</p>
                        <input
                            placeholder="I want to feel..."
                            value={starter.intention}
                            onChange={e => setStarter({ ...starter, intention: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                        />
                    </div>

                    {/* 4. COMMISSION */}
                    <div className={`p-6 rounded-xl border transition-all ${starter.commissionTitle ? 'bg-zinc-900/50 border-green-900/50' : 'bg-zinc-950 border-zinc-800'}`}>
                        <h3 className="font-bold text-white mb-2 flex justify-between">
                            4. Commission a Quest
                            {starter.commissionTitle && <span className="text-green-500">✓ (+1)</span>}
                        </h3>
                        <p className="text-xs text-zinc-500 mb-4">Request something from the party host/engine. This becomes a public quest.</p>
                        <div className="space-y-2">
                            <input
                                placeholder="Quest Title (e.g. The Lost Toast)"
                                value={starter.commissionTitle}
                                onChange={e => setStarter({ ...starter, commissionTitle: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                            />
                            <textarea
                                placeholder="Description / Constraints..."
                                value={starter.commissionDesc}
                                onChange={e => setStarter({ ...starter, commissionDesc: e.target.value })}
                                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white h-20"
                            />
                        </div>
                    </div>

                    {/* 5. CURSED ITEM */}
                    <div className={`p-6 rounded-xl border transition-all ${starter.cursedItem ? 'bg-zinc-900/50 border-green-900/50' : 'bg-zinc-950 border-zinc-800'}`}>
                        <h3 className="font-bold text-white mb-2 flex justify-between">
                            5. Bring a Cursed Item
                            {starter.cursedItem && <span className="text-green-500">✓ (+1)</span>}
                        </h3>
                        <p className="text-xs text-zinc-500 mb-4">An object you wish to be cleansed or destroyed.</p>
                        <input
                            placeholder="Item Name..."
                            value={starter.cursedItem}
                            onChange={e => setStarter({ ...starter, cursedItem: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-white"
                        />
                    </div>

                    {/* 6. SIGNUPS */}
                    <div className={`p-6 rounded-xl border transition-all ${starter.signups.length > 0 ? 'bg-zinc-900/50 border-green-900/50' : 'bg-zinc-950 border-zinc-800'}`}>
                        <h3 className="font-bold text-white mb-2 flex justify-between">
                            6. Preproduction Signups
                            {starter.signups.length > 0 && <span className="text-green-500">✓ (+{starter.signups.length})</span>}
                        </h3>
                        <p className="text-xs text-zinc-500 mb-4">Volunteer for party roles. +1 Vibulon per role.</p>
                        <div className="grid grid-cols-2 gap-2">
                            {SIGNUPS.map(role => (
                                <button
                                    key={role}
                                    onClick={() => {
                                        if (starter.signups.includes(role)) {
                                            setStarter({ ...starter, signups: starter.signups.filter(s => s !== role) })
                                        } else {
                                            setStarter({ ...starter, signups: [...starter.signups, role] })
                                        }
                                    }}
                                    className={`text-xs py-2 px-3 rounded border text-left ${starter.signups.includes(role)
                                            ? 'bg-green-900/20 border-green-500 text-green-400'
                                            : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FINAL SUBMISSION */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-black border-t border-zinc-900 flex justify-between max-w-3xl mx-auto w-full z-50">
                    <button onClick={() => setStep('PLAYBOOK')} className="text-zinc-500 hover:text-white">← Back</button>

                    <form action={formAction}>
                        <input type="hidden" name="token" value={token} />

                        {/* Identity */}
                        <input type="hidden" name="name" value={identity.name} />
                        <input type="hidden" name="pronouns" value={identity.pronouns} />
                        <input type="hidden" name="attendance" value={identity.attendance} />

                        {/* Character */}
                        <input type="hidden" name="nationId" value={selectedNation!} />
                        <input type="hidden" name="playbookId" value={selectedPlaybook!} />

                        {/* Starter Pack JSON */}
                        <input type="hidden" name="starterPack" value={JSON.stringify(starter)} />
                        <input type="hidden" name="initialVibeulons" value={cappedVibulons} />

                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isPending ? 'ENTERING...' : 'COMPLETE & ENTER →'}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return null
}
