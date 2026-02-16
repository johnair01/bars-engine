'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarDef, BarInput } from '@/lib/bars'
import { completeStarterQuest } from '@/actions/starter-quests'
import { pickUpBar } from '@/actions/pick-up-bar'
import { delegateBar } from '@/actions/delegate-bar'
import { releaseBarToSaladBowl } from '@/actions/release-bar'
import Link from 'next/link'

type CompletedBar = { id: string; inputs: Record<string, any> }

// Vibe Bar Card - inline completion (for Active bars)
function VibeBarCard({
    bar,
    isActive,
    onPickUp,
    onComplete,
    onDelegate, // Added onDelegate prop
    onRelease, // Added onRelease prop
}: {
    bar: BarDef
    isActive: boolean
    onPickUp: () => void
    onComplete: (inputs: Record<string, any>) => void
    onDelegate?: (targetId: string) => void
    onRelease?: () => void
}) {
    const [open, setOpen] = useState(isActive)  // Auto-open if active
    const [inputs, setInputs] = useState<Record<string, any>>({})

    const handleSubmit = () => {
        onComplete(inputs)
        setOpen(false)
    }

    const renderInput = (input: BarInput) => {
        const label = (
            <label className="block text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-1">
                {input.label}
            </label>
        )

        if (input.type === 'text') {
            return (
                <div key={input.key}>
                    {label}
                    <input
                        value={inputs[input.key] || ''}
                        onChange={e => setInputs({ ...inputs, [input.key]: e.target.value })}
                        placeholder={input.placeholder}
                        className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                    />
                </div>
            )
        }
        if (input.type === 'textarea') {
            return (
                <div key={input.key}>
                    {label}
                    <textarea
                        value={inputs[input.key] || ''}
                        onChange={e => setInputs({ ...inputs, [input.key]: e.target.value })}
                        placeholder={input.placeholder}
                        className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white h-20"
                    />
                </div>
            )
        }
        if (input.type === 'select') {
            return (
                <div key={input.key}>
                    {label}
                    <select
                        value={inputs[input.key] || ''}
                        onChange={e => setInputs({ ...inputs, [input.key]: e.target.value })}
                        className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                    >
                        <option value="">Select...</option>
                        {input.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            )
        }
        if (input.type === 'multiselect') {
            const selected = inputs[input.key] || []
            return (
                <div key={input.key}>
                    {label}
                    <div className="grid grid-cols-2 gap-2">
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
                </div>
            )
        }
        return null
    }

    const isValid = bar.inputs.every(inp => {
        if (!inp.required) return true
        if (inp.type === 'multiselect') {
            return Array.isArray(inputs[inp.key]) && inputs[inp.key].length > 0
        }
        const value = inputs[inp.key]
        return typeof value === 'string' ? value.trim().length > 0 : !!value
    })

    return (
        <div className={`rounded-xl border transition-colors ${isActive
            ? 'bg-yellow-900/20 border-yellow-700 hover:border-yellow-500'
            : 'bg-zinc-900/40 border-zinc-700 hover:border-zinc-500'}`}>
            <div className="flex justify-between items-center p-4">
                <button
                    type="button"
                    onClick={() => isActive ? setOpen(!open) : onPickUp()}
                    className="flex-1 text-left flex justify-between items-center"
                >
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono ${isActive ? 'bg-yellow-900/50 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>
                                {isActive ? 'Active' : 'Vibe'}
                            </span>
                            <h3 className="font-bold text-white">{bar.title}</h3>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{bar.description}</p>
                    </div>
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-green-400 font-mono text-sm">+{bar.reward} ♦</span>

                    {!isActive && <span className="text-zinc-500 text-xs ml-2 cursor-pointer" onClick={onPickUp}>Pick Up →</span>}

                    {isActive && onDelegate && (
                        <div className="relative group ml-2">
                            <button className="text-zinc-500 hover:text-white px-2">
                                ↪
                            </button>
                            {/* Delegation Dropdown (simplified) - Actually, popping a modal or expanding is better. using prompt for MVP speed? No, let's use a small inline form if clicked */}
                        </div>
                    )}
                </div>
            </div>

            {/* EXPANDED CONTENT */}
            {open && isActive && (
                <div className="p-4 pt-0 space-y-4 border-t border-yellow-800/50 mt-2">
                    {/* RELEASE UI (For Assigned/Custom Quests) */}
                    {onRelease && (
                        <div className="flex justify-end mb-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Release this quest to the Salad Bowl? (Costs 5 Vibeulons)')) {
                                        onRelease()
                                    }
                                }}
                                className="text-[10px] uppercase text-zinc-500 hover:text-red-400 font-mono flex items-center gap-1 transition-colors"
                            >
                                <span>♻ Release to Bowl</span>
                            </button>
                        </div>
                    )}

                    {/* DELEGATION UI */}
                    {onDelegate && (
                        <div className="bg-black/40 p-2 rounded flex gap-2 items-center mb-2">
                            <label className="text-[10px] uppercase text-zinc-500 font-mono">Delegate (-1 ♦):</label>
                            <select
                                className="bg-zinc-900 text-xs text-white border border-zinc-700 rounded px-1 py-1 flex-1"
                                onChange={(e) => {
                                    if (e.target.value && confirm(`Delegate "${bar.title}" to this player for 1 Vibulon?`)) {
                                        onDelegate(e.target.value)
                                    }
                                    e.target.value = "" // reset
                                }}
                            >
                                <option value="">Select Player...</option>
                                {/* We need the players list here. VibeBarCard doesn't have it. Passing it down. */}
                                {(bar as any).delegates?.map((p: { id: string; name: string }) => ( // Updated type for p
                                    <option key={p.id} value={p.id}>{p.name || 'Unknown'}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {bar.inputs.map(renderInput)}
                    <button
                        type="button"
                        disabled={!isValid}
                        onClick={handleSubmit}
                        className="w-full bg-yellow-500 text-black py-2 rounded font-bold disabled:opacity-50 hover:bg-yellow-400"
                    >
                        Complete Bar
                    </button>
                </div>
            )}
        </div>
    )
}

// Story Bar Card - links to story page
function StoryBarCard({ bar, isActive, onPickUp }: { bar: BarDef; isActive: boolean; onPickUp: () => void }) {
    if (isActive) {
        return (
            <Link
                href={`/bar/${bar.id}/story`}
                className="block rounded-xl border bg-yellow-900/20 border-yellow-700 hover:border-yellow-500 transition-colors"
            >
                <div className="p-4 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/50 text-yellow-400 uppercase font-mono">Active</span>
                            <h3 className="font-bold text-white">{bar.title}</h3>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{bar.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-purple-400 font-mono text-sm">+{bar.reward} ♦</span>
                        <span className="text-yellow-400">Continue →</span>
                    </div>
                </div>
            </Link>
        )
    }

    return (
        <button
            onClick={onPickUp}
            className="block w-full text-left rounded-xl border bg-purple-900/20 border-purple-800 hover:border-purple-500 transition-colors"
        >
            <div className="p-4 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-400 uppercase font-mono">Story</span>
                        <h3 className="font-bold text-white">{bar.title}</h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{bar.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-mono text-sm">+{bar.reward} ♦</span>
                    <span className="text-zinc-500 text-xs">Pick Up →</span>
                </div>
            </div>
        </button>
    )
}

// Completed Bar Card
function CompletedBarCard({ bar }: { bar: BarDef }) {
    return (
        <div className="rounded-xl border bg-zinc-900/20 border-zinc-800 p-4 flex justify-between items-center opacity-75 hover:opacity-100 transition">
            <div>
                <h3 className="font-bold text-zinc-400 line-through decoration-zinc-600">{bar.title}</h3>
                <p className="text-xs text-zinc-600">Completed</p>
            </div>
            <span className="text-zinc-600 text-sm">✓</span>
        </div>
    )
}

// Type for custom bars from DB
type CustomBarDef = {
    id: string
    title: string
    description: string
    type: string
    reward: number
    inputs: string
    creatorId: string
    storyPath: string | null
    moveType: string | null
}


// Type for I Ching bars from DB (via PlayerBar)
type IChingBarDef = {
    id: string // PlayerBar id (CUID)
    barId: number // Hexagram id
    bar: {
        id: number
        name: string
        tone: string
        text: string
    }
}

export function StarterQuestBoard({
    completedBars,
    activeBars = [],
    customBars = [],
    ichingBars = [],
    potentialDelegates = [], // New prop
    view
}: {
    completedBars: CompletedBar[],
    activeBars?: string[],
    customBars?: CustomBarDef[],
    ichingBars?: IChingBarDef[],
    potentialDelegates?: { id: string, name: string }[], // New prop type
    view: 'available' | 'active' | 'completed'
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [localCompleted, setLocalCompleted] = useState<string[]>(completedBars.map(cb => cb.id))
    const [localActive, setLocalActive] = useState<string[]>(activeBars)

    // Sync local state with server state when props change
    useEffect(() => {
        setLocalActive(activeBars)
        setLocalCompleted(completedBars.map(cb => cb.id))
    }, [activeBars, completedBars])

    const handlePickUp = async (barId: string) => {
        const formData = new FormData()
        formData.set('barId', barId)

        // Optimistic update
        setLocalActive([...localActive, barId])

        // Direct server action call
        await pickUpBar(formData)

        // Refresh via transition
        startTransition(() => {
            router.refresh()
        })
    }

    const handleComplete = async (barId: string, inputs: Record<string, any>) => {
        const formData = new FormData()
        formData.set('barId', barId)
        formData.set('inputs', JSON.stringify(inputs))

        // Optimistic update
        setLocalCompleted([...localCompleted, barId])
        setLocalActive(localActive.filter(id => id !== barId))

        // Direct server action call
        await completeStarterQuest(formData)

        // Refresh via transition
        startTransition(() => {
            router.refresh()
        })
    }

    const handleDelegate = async (barId: string, targetId: string) => {
        const formData = new FormData()
        formData.set('barId', barId)
        formData.set('targetPlayerId', targetId)

        // Optimistic: remove from active
        setLocalActive(localActive.filter(id => id !== barId))

        const result = await delegateBar(formData)
        if (result && 'error' in result) {
            alert("Delegation failed: " + result.error)
            // Rollback (simple refresh)
            startTransition(() => { router.refresh() })
            return
        }

        startTransition(() => { router.refresh() })
    }

    const handleRelease = async (barId: string) => {
        // Optimistic: remove from active (it goes to available, but we might not see it immediately if not refreshing available list, or it goes to salad bowl)
        setLocalActive(localActive.filter(id => id !== barId))

        const result = await releaseBarToSaladBowl(barId)
        if (result && 'error' in result) {
            alert("Release failed: " + result.error)
            startTransition(() => { router.refresh() }) // rollback
            return
        }

        startTransition(() => { router.refresh() })
    }

    // Convert custom bars to BarDef format
    const customAsBarDef: BarDef[] = customBars.map(cb => ({
        id: cb.id,
        title: cb.title,
        description: cb.description,
        type: cb.type as 'vibe' | 'story',
        reward: cb.reward,
        inputs: JSON.parse(cb.inputs || '[]'),
        unique: false,  // Custom bars are repeatable
        isCustom: true, // Mark as custom
        moveType: cb.moveType,
    }))

    // Convert I Ching readings to BarDef format
    const ichingAsBarDef: BarDef[] = ichingBars.map(ib => ({
        id: `iching_${ib.bar.id}`,
        title: `Hexagram ${ib.bar.id}: ${ib.bar.name}`,
        description: ib.bar.tone, // Use tone as description
        type: 'vibe', // Treat as vibe bar
        reward: 1,
        inputs: [{
            key: 'reflection',
            label: 'Reflection',
            type: 'textarea',
            placeholder: 'How does this hexagram resonate with your current situation?'
        }],
        unique: false,
    }))

    // Merge starter bars with custom bars and I Ching bars
    // Note: I Ching bars are only ever "active" or "completed", they don't appear in "available" usually (unless we wanted to show past ones)
    // But since localActive contains 'iching_X', we need them in allBars to be found by the filter.
    const allBars = [...customAsBarDef, ...ichingAsBarDef]

    const availableBars = allBars.filter(b => !localCompleted.includes(b.id) && !localActive.includes(b.id))
    // const activeBarsFiltered = allBars.filter(b => localActive.includes(b.id)) // Original line
    // Inject delegates into bars (hacky but works for UI)
    const activeBarsWithDelegates = allBars
        .filter(b => localActive.includes(b.id))
        .map(b => ({ ...b, delegates: potentialDelegates })) // Attach delegates list to bar for dropdown usage
    const completedList = allBars.filter(b => localCompleted.includes(b.id))

    if (view === 'active') {
        if (activeBarsWithDelegates.length === 0) { // Changed to activeBarsWithDelegates
            return <div className="p-6 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-600">
                No active bars. Pick one up from Available Bars below.
            </div>
        }
        return (
            <div className="space-y-3">
                {activeBarsWithDelegates.map(bar => ( // Changed to activeBarsWithDelegates
                    (bar.type === 'story' && !bar.isCustom) ? (
                        <StoryBarCard key={bar.id} bar={bar} isActive={true} onPickUp={() => { }} />
                    ) : (
                        <VibeBarCard
                            key={bar.id}
                            bar={bar}
                            isActive={true}
                            onPickUp={() => { }}
                            onComplete={(inputs) => handleComplete(bar.id, inputs)}
                            onDelegate={(targetId) => handleDelegate(bar.id, targetId)}
                            onRelease={bar.isCustom ? () => handleRelease(bar.id) : undefined}
                        />
                    )
                ))}
            </div>
        )
    }

    if (view === 'available') {
        if (availableBars.length === 0) return <div className="text-zinc-500 text-sm italic">No available starter quests. Good job.</div>
        return (
            <div className="space-y-3">
                {availableBars.map(bar => (
                    (bar.type === 'story' && !bar.isCustom) ? (
                        <StoryBarCard key={bar.id} bar={bar} isActive={false} onPickUp={() => handlePickUp(bar.id)} />
                    ) : (
                        <VibeBarCard
                            key={bar.id}
                            bar={bar}
                            isActive={false}
                            onPickUp={() => handlePickUp(bar.id)}
                            onComplete={() => { }}
                        />
                    )
                ))}
            </div>
        )
    }

    if (view === 'completed') {
        if (completedList.length === 0) return <div className="text-zinc-600 text-sm italic">No completed quests yet.</div>
        return (
            <div className="space-y-3">
                {completedList.map(bar => (
                    <CompletedBarCard key={bar.id} bar={bar} />
                ))}
            </div>
        )
    }

    return null
}
