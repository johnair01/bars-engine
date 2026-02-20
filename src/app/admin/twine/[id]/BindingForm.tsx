'use client'

import { useActionState, useState } from 'react'
import { createBinding } from '@/actions/twine'

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
                        <option value="EMIT_QUEST">EMIT_QUEST (Simple Quest)</option>
                        <option value="EMIT_BAR">EMIT_BAR (Social Post)</option>
                        <option value="SET_NATION">SET_NATION (Recommend Nation)</option>
                        <option value="SET_ARCHETYPE">SET_ARCHETYPE (Recommend Archetype)</option>
                    </select>
                </div>
            </div>

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
