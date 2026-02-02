'use client'

import { useState, useActionState } from 'react'
import { createCharacter } from '@/actions/conclave'
import { STARTER_BARS, BarDef, BarInput } from '@/lib/bars'

// --- TYPES ---
type Nation = { id: string, name: string, description: string }
type Playbook = { id: string, name: string, description: string, moves: string }
type CompletedBar = { id: string, inputs: Record<string, any> }

// --- BAR CARD COMPONENT ---
function BarCard({
    bar,
    completed,
    onComplete,
    nations,
    playbooks
}: {
    bar: BarDef
    completed: CompletedBar | null
    onComplete: (inputs: Record<string, any>) => void
    nations: Nation[]
    playbooks: Playbook[]
}) {
    const [open, setOpen] = useState(false)
    const [inputs, setInputs] = useState<Record<string, any>>({})

    const handleSubmit = () => {
        onComplete(inputs)
        setOpen(false)
    }

    const renderInput = (input: BarInput) => {
        if (input.type === 'text') {
            return (
                <input
                    key={input.key}
                    value={inputs[input.key] || ''}
                    onChange={e => setInputs({ ...inputs, [input.key]: e.target.value })}
                    placeholder={input.placeholder}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                />
            )
        }
        if (input.type === 'textarea') {
            return (
                <textarea
                    key={input.key}
                    value={inputs[input.key] || ''}
                    onChange={e => setInputs({ ...inputs, [input.key]: e.target.value })}
                    placeholder={input.placeholder}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white h-20"
                />
            )
        }
        if (input.type === 'select') {
            return (
                <select
                    key={input.key}
                    value={inputs[input.key] || ''}
                    onChange={e => setInputs({ ...inputs, [input.key]: e.target.value })}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                >
                    <option value="">Select...</option>
                    {input.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            )
        }
        if (input.type === 'nation-select') {
            return (
                <div key={input.key} className="space-y-2">
                    {nations.map(n => (
                        <button
                            key={n.id}
                            type="button"
                            onClick={() => setInputs({ ...inputs, [input.key]: n.id })}
                            className={`w-full text-left p-3 rounded border transition-all ${inputs[input.key] === n.id ? 'bg-zinc-800 border-purple-500' : 'border-zinc-800 hover:border-zinc-700'}`}
                        >
                            <div className="font-bold text-white">{n.name}</div>
                            <div className="text-xs text-zinc-500">{n.description}</div>
                        </button>
                    ))}
                </div>
            )
        }
        if (input.type === 'playbook-select') {
            return (
                <div key={input.key} className="grid grid-cols-2 gap-2">
                    {playbooks.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setInputs({ ...inputs, [input.key]: p.id })}
                            className={`text-left p-3 rounded border transition-all ${inputs[input.key] === p.id ? 'bg-zinc-800 border-blue-500' : 'border-zinc-800 hover:border-zinc-700'}`}
                        >
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            <div className="text-xs text-zinc-500">{p.description}</div>
                        </button>
                    ))}
                </div>
            )
        }
        if (input.type === 'multiselect') {
            const selected = inputs[input.key] || []
            return (
                <div key={input.key} className="grid grid-cols-2 gap-2">
                    {input.options?.map(opt => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => {
                                if (selected.includes(opt)) {
                                    setInputs({ ...inputs, [input.key]: selected.filter((s: string) => s !== opt) })
                                } else {
                                    setInputs({ ...inputs, [input.key]: [...selected, opt] })
                                }
                            }}
                            className={`text-xs py-2 px-3 rounded border text-left ${selected.includes(opt) ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-black border-zinc-800 text-zinc-400'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )
        }
        return null
    }

    const isValid = bar.inputs.every(inp => {
        if (inp.type === 'multiselect') return true // Optional
        return inputs[inp.key]
    })

    return (
        <div className={`rounded-xl border transition-all ${completed ? 'bg-zinc-900/50 border-green-900/50' : 'bg-zinc-950 border-zinc-800'}`}>
            <button
                type="button"
                onClick={() => !completed && setOpen(!open)}
                className="w-full text-left p-4 flex justify-between items-center"
            >
                <div>
                    <h3 className={`font-bold ${completed ? 'text-green-400' : 'text-white'}`}>{bar.title}</h3>
                    <p className="text-xs text-zinc-500">{bar.description}</p>
                </div>
                {completed ? (
                    <span className="text-green-500 text-xl">✓</span>
                ) : bar.reward > 0 ? (
                    <span className="text-zinc-500 text-xs">+{bar.reward} ♦</span>
                ) : bar.mandatory ? (
                    <span className="text-red-500 text-xs">Required</span>
                ) : null}
            </button>

            {open && !completed && (
                <div className="p-4 pt-0 space-y-4 border-t border-zinc-800 mt-2">
                    {bar.inputs.map(renderInput)}
                    <button
                        type="button"
                        disabled={!isValid}
                        onClick={handleSubmit}
                        className="w-full bg-white text-black py-2 rounded font-bold disabled:opacity-50"
                    >
                        Complete
                    </button>
                </div>
            )}
        </div>
    )
}

// --- MAIN WIZARD ---
export function ConclaveWizard({
    token,
    nations,
    playbooks
}: {
    token: string
    nations: Nation[]
    playbooks: Playbook[]
}) {
    // Phase: 'identity' | 'board'
    const [phase, setPhase] = useState<'identity' | 'board'>('identity')

    // Identity
    const [identity, setIdentity] = useState({ name: '', pronouns: '', contact: '' })

    // Completed Bars
    const [completedBars, setCompletedBars] = useState<CompletedBar[]>([])

    // Server Action
    const [serverState, formAction, isPending] = useActionState(createCharacter, null)

    // Calculated Values
    const vibeulons = completedBars.reduce((sum, cb) => {
        const def = STARTER_BARS.find(b => b.id === cb.id)
        if (!def) return sum
        if (def.id === 'bar_signups') {
            return sum + (cb.inputs.roles?.length || 0)
        }
        return sum + def.reward
    }, 0)

    const mandatoryDone = STARTER_BARS.filter(b => b.mandatory).every(b => completedBars.some(cb => cb.id === b.id))

    const handleCompleteBar = (barId: string, inputs: Record<string, any>) => {
        setCompletedBars([...completedBars, { id: barId, inputs }])
    }

    // --- PHASE 1: IDENTITY ---
    if (phase === 'identity') {
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
                    onClick={() => setPhase('board')}
                    className="w-full bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                >
                    Enter The Conclave →
                </button>
            </div>
        )
    }

    // --- PHASE 2: THE BOARD ---
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-zinc-900 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-white">The Conclave</h1>
                        <p className="text-xs text-zinc-500">Complete tasks to earn Vibeulons</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
                        <span className="text-green-400 font-bold">♦ {vibeulons}</span>
                    </div>
                </div>
            </div>

            {/* Bar Cards */}
            <div className="space-y-3">
                {STARTER_BARS.map(bar => (
                    <BarCard
                        key={bar.id}
                        bar={bar}
                        completed={completedBars.find(cb => cb.id === bar.id) || null}
                        onComplete={(inputs) => handleCompleteBar(bar.id, inputs)}
                        nations={nations}
                        playbooks={playbooks}
                    />
                ))}
            </div>

            {/* Submit */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-zinc-900 max-w-3xl mx-auto">
                <form action={formAction}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="identity" value={JSON.stringify(identity)} />
                    <input type="hidden" name="completedBars" value={JSON.stringify(completedBars)} />
                    <input type="hidden" name="vibeulons" value={vibeulons} />

                    <button
                        type="submit"
                        disabled={!mandatoryDone || isPending}
                        className="w-full bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                    >
                        {isPending ? 'Entering...' : mandatoryDone ? 'Enter The Game →' : 'Complete Required Tasks'}
                    </button>
                </form>
            </div>
        </div>
    )
}
