'use client'

import { useActionState, useState } from 'react'
import { createBinding } from '@/actions/twine'

const SIGNAL_KEYS = [
    { value: 'fire', label: '🔥 Fire (Pyrakanth)', group: 'element' },
    { value: 'water', label: '💧 Water (Lamenth)', group: 'element' },
    { value: 'wood', label: '🌿 Wood (Virelune)', group: 'element' },
    { value: 'metal', label: '⚙️ Metal (Argyra)', group: 'element' },
    { value: 'earth', label: '🌍 Earth (Meridia)', group: 'element' },
    { value: 'truth_seer', label: 'Truth Seer', group: 'archetype' },
    { value: 'shadow_walker', label: 'Shadow Walker', group: 'archetype' },
    { value: 'bridge_builder', label: 'Bridge Builder', group: 'archetype' },
    { value: 'flame_keeper', label: 'Flame Keeper', group: 'archetype' },
    { value: 'dream_weaver', label: 'Dream Weaver', group: 'archetype' },
    { value: 'story_teller', label: 'Story Teller', group: 'archetype' },
    { value: 'root_tender', label: 'Root Tender', group: 'archetype' },
    { value: 'void_dancer', label: 'Void Dancer', group: 'archetype' },
]

interface BindingFormProps {
    storyId: string;
    passageNames: string[];
    nations?: any[];
    playbooks?: any[];
}

export function BindingForm({
    storyId,
    passageNames,
    nations = [],
    playbooks = []
}: BindingFormProps) {
    const [state, formAction, isPending] = useActionState(createBinding, null)
    const [actionType, setActionType] = useState('EMIT_QUEST')
    const [signalKey, setSignalKey] = useState('fire')
    const [signalAmount, setSignalAmount] = useState(1)

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="storyId" value={storyId} />
            <input type="hidden" name="scopeType" value="passage" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Passage</label>
                    <select name="scopeId" required className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors">
                        <option value="">Select passage...</option>
                        {passageNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Action</label>
                    <select
                        name="actionType"
                        required
                        value={actionType}
                        onChange={(e) => setActionType(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors"
                    >
                        <optgroup label="Content">
                            <option value="EMIT_QUEST">EMIT_QUEST (Simple Quest)</option>
                            <option value="EMIT_BAR">EMIT_BAR (Social Post)</option>
                        </optgroup>
                        <optgroup label="Selection (Hardcoded)">
                            <option value="SET_NATION">SET_NATION (Recommend Nation)</option>
                            <option value="SET_ARCHETYPE">SET_ARCHETYPE (Recommend Archetype)</option>
                        </optgroup>
                        <optgroup label="Diagnostic (Scored)">
                            <option value="ADD_SIGNAL">ADD_SIGNAL (Add Element/Archetype Score)</option>
                            <option value="COMPUTE_NATION">COMPUTE_NATION (Compute Nation from Scores)</option>
                            <option value="COMPUTE_ARCHETYPE">COMPUTE_ARCHETYPE (Compute Archetype from Scores)</option>
                            <option value="CONFIRM_NATION">CONFIRM_NATION (Write Nation to Player)</option>
                            <option value="CONFIRM_ARCHETYPE">CONFIRM_ARCHETYPE (Write Archetype to Player)</option>
                            <option value="RESET_SIGNALS">RESET_SIGNALS (Clear Scores)</option>
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* ADD_SIGNAL config */}
            {actionType === 'ADD_SIGNAL' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] uppercase text-green-400 font-bold tracking-widest">Signal Configuration</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500">Signal Key</label>
                            <select
                                name="signalKey"
                                value={signalKey}
                                onChange={(e) => setSignalKey(e.target.value)}
                                className="w-full bg-zinc-900 border border-green-900/40 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500"
                            >
                                <optgroup label="Elements (Nations)">
                                    {SIGNAL_KEYS.filter(s => s.group === 'element').map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Archetypes">
                                    {SIGNAL_KEYS.filter(s => s.group === 'archetype').map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500">Amount</label>
                            <input
                                name="signalAmount"
                                type="number"
                                min={1}
                                max={3}
                                value={signalAmount}
                                onChange={(e) => setSignalAmount(Number(e.target.value))}
                                className="w-full bg-zinc-900 border border-green-900/40 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500"
                            />
                        </div>
                    </div>
                    <div className="text-[10px] text-zinc-600">
                        Attach to a choice passage. When the player reaches this passage, +{signalAmount} will be added to their {signalKey} score.
                    </div>
                </div>
            )}

            {/* RESET_SIGNALS config */}
            {actionType === 'RESET_SIGNALS' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] uppercase text-yellow-400 font-bold tracking-widest">Reset Scope</label>
                    <select name="resetScope" className="w-full bg-zinc-900 border border-yellow-900/40 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-yellow-500">
                        <option value="all">All Signals</option>
                        <option value="nation">Nation/Element Signals Only</option>
                        <option value="archetype">Archetype Signals Only</option>
                    </select>
                </div>
            )}

            {/* COMPUTE / CONFIRM info */}
            {(actionType === 'COMPUTE_NATION' || actionType === 'COMPUTE_ARCHETYPE') && (
                <div className="p-3 bg-blue-900/20 border border-blue-900/40 text-blue-300 text-xs rounded-lg animate-in fade-in duration-200">
                    This binding computes a recommendation from accumulated signals. Place it on the passage where you want to reveal the result.
                </div>
            )}
            {(actionType === 'CONFIRM_NATION' || actionType === 'CONFIRM_ARCHETYPE') && (
                <div className="p-3 bg-emerald-900/20 border border-emerald-900/40 text-emerald-300 text-xs rounded-lg animate-in fade-in duration-200">
                    This binding writes the recommended {actionType === 'CONFIRM_NATION' ? 'nation' : 'archetype'} to the player{"'"}s profile. Place it on the confirmation passage.
                </div>
            )}

            {actionType === 'SET_NATION' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] uppercase text-purple-400 font-bold tracking-widest">Target Nation</label>
                    <select name="nationId" required className="w-full bg-zinc-900 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500">
                        <option value="">Choose a Nation...</option>
                        {nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                </div>
            )}

            {actionType === 'SET_ARCHETYPE' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] uppercase text-indigo-400 font-bold tracking-widest">Target Archetype</label>
                    <select name="playbookId" required className="w-full bg-zinc-900 border border-indigo-900/40 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500">
                        <option value="">Choose an Archetype...</option>
                        {playbooks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            )}

            {(actionType === 'EMIT_QUEST' || actionType === 'EMIT_BAR') && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Title *</label>
                        <input name="payloadTitle" required className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors" placeholder="Title for the emitted quest/BAR" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Description</label>
                        <textarea name="payloadDescription" rows={2} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none resize-y focus:border-purple-500 transition-colors" placeholder="Description / content..." />
                    </div>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Internal Notes <span className="text-zinc-600 normal-case">(optional tags/context)</span></label>
                <input name="payloadTags" className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors" placeholder="e.g. branch-root, final-choice" />
            </div>

            {state?.error && <div className="p-3 bg-red-900/20 border border-red-900/40 text-red-300 text-xs rounded-lg">{state.error}</div>}
            {state?.success && <div className="p-3 bg-green-900/20 border border-green-900/40 text-green-300 text-xs rounded-lg">Binding created!</div>}

            <button type="submit" disabled={isPending} className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50">
                {isPending ? 'Saving...' : 'Create Binding'}
            </button>
        </form>
    )
}
